"""Finance Assistant: transactions, budget, weekly & monthly summaries."""

from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, HTTPException

from lib.activity import log_activity
from lib.db import OWNER_ID, db, from_mongo, new_id, now_utc
from lib.dates import today_iso
from models.agents import FinanceSummary, CategoryTotal, Transaction, TransactionCreate, WeekPoint

router = APIRouter()

WEEKDAY_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]


@router.get("/transactions", response_model=List[Transaction])
async def list_transactions(limit: int = 50):
    docs = await db.transactions.find({"owner_id": OWNER_ID}).sort("occurred_date", -1).to_list(min(limit, 200))
    return [Transaction(**from_mongo(d, "created_at")) for d in docs]


@router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    if input.type not in ("income", "expense"):
        raise HTTPException(status_code=400, detail="Jenis transaksi tidak valid.")
    data = input.model_dump()
    data["occurred_date"] = data["occurred_date"] or today_iso()
    txn = Transaction(**data)
    await db.transactions.insert_one(txn.model_dump())
    label = "Pemasukan" if txn.type == "income" else "Pengeluaran"
    await log_activity("transaction", f"{label} dicatat", f"Rp{txn.amount:,.0f} - {txn.category}")
    return txn


@router.delete("/transactions/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: str):
    await db.transactions.delete_one({"id": transaction_id})
    return None


@router.get("/finance/summary", response_model=FinanceSummary)
async def finance_summary():
    today = today_iso()
    month_prefix = today[:7]

    month_docs = (
        await db.transactions.find(
            {"owner_id": OWNER_ID, "occurred_date": {"$gte": f"{month_prefix}-01", "$lte": f"{month_prefix}-31"}}
        )
        .to_list(2000)
    )

    income_month = sum(t["amount"] for t in month_docs if t["type"] == "income")
    expense_month = sum(t["amount"] for t in month_docs if t["type"] == "expense")

    base = datetime.strptime(today, "%Y-%m-%d")
    week_days = [(base - timedelta(days=i)).strftime("%Y-%m-%d") for i in (6, 5, 4, 3, 2, 1, 0)]
    weekly: list[WeekPoint] = []
    income_week = expense_week = 0.0
    for day in week_days:
        d = datetime.strptime(day, "%Y-%m-%d")
        income = sum(t["amount"] for t in month_docs if t["occurred_date"] == day and t["type"] == "income")
        expense = sum(t["amount"] for t in month_docs if t["occurred_date"] == day and t["type"] == "expense")
        income_week += income
        expense_week += expense
        weekly.append(WeekPoint(label=WEEKDAY_ID[d.weekday()], income=income, expense=expense))

    by_category: dict[tuple[str, str], float] = {}
    for t in month_docs:
        key = (t.get("category", "Lainnya"), t["type"])
        by_category[key] = by_category.get(key, 0.0) + t["amount"]
    categories = sorted(
        (CategoryTotal(name=name, type=type_, total=total) for (name, type_), total in by_category.items()),
        key=lambda c: c.total,
        reverse=True,
    )

    settings_doc = await db.settings.find_one({"id": "local"})
    budget = (settings_doc or {}).get("monthly_budget", 0)

    return FinanceSummary(
        income_month=income_month,
        expense_month=expense_month,
        income_week=income_week,
        expense_week=expense_week,
        budget=budget,
        by_category=categories,
        weekly=weekly,
    )

import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { AGENTS } from "@/lib/agentMeta";
import { PageHeader } from "@/components/shared";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AgentsDirectory() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agen"
        description="Direktori agen AI personalmu. Setiap agen punya workspace sendiri dan bisa dikembangkan modular."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="agents-grid">
        {AGENTS.map((agent) => (
          <article
            key={agent.id}
            data-testid={`agent-card-${agent.id}`}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
              agent.id === "studio" ? "border-[#D5CCA6] ring-1 ring-[#9B8264]/20" : "border-border",
            )}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl",
                  agent.id === "studio" ? "bg-[#9B8264] text-white" : "bg-[#E9E1D5] text-[#9B8264]",
                )}
              >
                <agent.icon className="size-6" strokeWidth={1.8} />
              </span>
              {agent.id === "studio" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#9B8264] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Sparkles className="size-3" /> Utama
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight text-foreground">{agent.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{agent.tagline}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {agent.features.map((feature) => (
                <li key={feature} className="rounded-full bg-[#F4EFEA] px-2.5 py-0.5 text-[11px] font-medium text-[#5A4E3E]">
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <Link to={agent.path} className={buttonVariants({ variant: agent.id === "studio" ? "default" : "outline", size: "sm" })} data-testid={`open-agent-${agent.id}`}>
                Buka Workspace <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

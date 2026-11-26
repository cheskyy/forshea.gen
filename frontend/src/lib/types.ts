// Hand-written mirrors of the backend Pydantic models — keep in sync in the same edit.
// Nothing infers across the Python boundary; these are the single source of truth on this side.

export interface Category {
  id: string;
  name: string;
  slug: string;
  group: "clothing" | "baby" | "general";
  subcategories: string[];
  required_slots: string[];
  custom: boolean;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  group?: string;
  subcategories?: string[];
}

export interface UploadMeta {
  id: string;
  filename: string;
  mime: string;
  slot: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  category_group: string;
  product_type: string;
  material: string;
  main_color: string;
  secondary_color: string;
  pattern: string;
  dimensions: string;
  description: string;
  characteristics: string;
  upload_ids: string[];
  created_at: string;
}

export interface SceneSettings {
  background_color: string;
  background_type: string;
  lighting: string;
  camera_angle: string;
  composition: string;
  props: string;
  mood: string;
  aspect_ratio: string;
  custom_prompt: string;
  preset: string;
}

export interface ImageMeta {
  id: string;
  mime: string;
  is_mock: boolean;
  favorite: boolean;
  project_id: string | null;
  product_name: string;
  style: string;
  created_at: string;
}

export type JobStatus = "processing" | "done" | "error";

export interface Job {
  id: string;
  product_id: string;
  product_name: string;
  status: JobStatus;
  provider: string;
  quantity: number;
  progress: number;
  style: string;
  scene: SceneSettings;
  result_ids: string[];
  error: string;
  created_at: string;
  completed_at: string | null;
}

export interface JobDetail extends Job {
  images: ImageMeta[];
  originals: UploadMeta[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  image_count: number;
  created_at: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  detail: string;
  created_at: string;
}

export type TaskPriority = "rendah" | "sedang" | "tinggi";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  due_date: string;
  notes: string;
  done: boolean;
  done_at: string | null;
  created_at: string;
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
}

export type TxnType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  note: string;
  occurred_date: string;
  created_at: string;
}

export interface FinanceSummary {
  income_month: number;
  expense_month: number;
  income_week: number;
  expense_week: number;
  budget: number;
  by_category: { name: string; type: string; total: number }[];
  weekly: { label: string; income: number; expense: number }[];
}

export interface LearningGoal {
  id: string;
  title: string;
  subject: string;
  target_date: string;
  progress: number;
  notes: string;
  created_at: string;
}

export type IdeaKind = "brainstorm" | "caption" | "konten";

export interface Idea {
  id: string;
  kind: IdeaKind;
  title: string;
  content: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  owner_name: string;
  theme: "light" | "dark";
  default_quantity: number;
  default_aspect: string;
  monthly_budget: number;
  updated_at: string;
}

export interface DashboardSummary {
  owner_name: string;
  today: string;
  tasks_today: number;
  tasks_done_today: number;
  images_total: number;
  images_today: number;
  income_month: number;
  expense_month: number;
  goals_active: number;
  ideas_total: number;
  recent_images: { id: string; product_name: string; style: string; is_mock: boolean; created_at: string }[];
  recent_activities: Activity[];
}

export interface AiStatus {
  provider: string;
  image_model: string | null;
  key_configured: boolean;
}

export interface CaptionResult {
  text: string;
  hashtags: string[];
  is_mock: boolean;
}

export interface ExplainResult {
  text: string;
  is_mock: boolean;
}

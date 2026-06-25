export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school_id: string;
}

export interface StudentProfile {
  user_id: string;
  grade: number;
  career_interest: string;
  current_avg: number;
  target_score: number;
}

export interface Subject {
  id: string;
  name: string;
  grade: number;
}

export interface Unit {
  id: string;
  subject_id: string;
  name: string;
  order: number;
}

export interface Topic {
  id: string;
  unit_id: string;
  name: string;
  difficulty_level: "easy" | "medium" | "hard";
}

export interface CLO {
  id: string;
  topic_id: string;
  code: string;
  description: string;
  cognitive_level: string;
}

export type ExamStatus = "draft" | "verified" | "published";

export interface Exam {
  id: string;
  teacher_id: string;
  subject_id: string;
  unit_id: string;
  title: string;
  status: ExamStatus;
  total_marks: number;
  created_at: string;
  subject_name?: string;
  unit_name?: string;
}

export type QuestionType = "mcq" | "short" | "essay";

export interface Question {
  id: string;
  exam_id: string;
  text: string;
  type: QuestionType;
  marks: number;
  options?: string[];
  correct_option?: number;
  clo_id?: string;
  topic_id?: string;
}

export interface ExamSession {
  id: string;
  student_id: string;
  exam_id: string;
  started_at: string;
  submitted_at?: string;
  total_score?: number;
  status: "in_progress" | "submitted" | "graded";
  exam?: Exam;
}

export interface Answer {
  question_id: string;
  student_answer: string;
  marks_awarded?: number;
  is_correct?: boolean;
}

export interface LearningGap {
  id: string;
  topic_id: string;
  topic_name: string;
  subject_name: string;
  clo_description?: string;
  gap_type: "weak" | "prerequisite_missing";
  severity: "low" | "medium" | "high";
  mastery_percent: number;
  is_career_critical: boolean;
}

export interface StudyPlan {
  id: string;
  student_id: string;
  generated_at: string;
  target_avg: number;
  current_avg: number;
  status: "active" | "completed";
  total_weeks: number;
  current_week: number;
  tasks: PlanTask[];
}

export interface PlanTask {
  id: string;
  plan_id: string;
  topic_name: string;
  description: string;
  week_number: number;
  day?: number;
  status: "pending" | "in_progress" | "completed";
  resource_type: "read" | "practice" | "quiz" | "watch";
  estimated_minutes: number;
}

export interface VerificationReport {
  exam_id: string;
  curriculum_alignment: number;
  clo_coverage: number;
  difficulty_balance: "low" | "moderate" | "high";
  out_of_curriculum_count: number;
  under_covered_topics: string[];
  questions_analysis: QuestionAnalysis[];
  ai_recommendation: string;
}

export interface QuestionAnalysis {
  question_id: string;
  question_text: string;
  assigned_clo?: string;
  is_aligned: boolean;
  issue?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Backend-aligned types (returned directly from API) ────────────────────

export interface ExamSummary {
  id: string;
  title: string;
  grade: number;
  duration_minutes: number;
  total_marks: number;
  status: string;
  question_count: number;
  alignment_score: number | null;
  created_at: string;
}

export interface BackendQuestion {
  id: string;
  order: number;
  question_type: string;
  text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  marks: number;
}

export interface BackendGap {
  clo_id: string;
  clo_code: string;
  description: string;
  topic: string | null;
  bloom_level: string | null;
  fail_rate: number;
  fail_count: number;
  total_attempts: number;
  severity: "critical" | "needs_support" | "on_track";
  is_career_critical: boolean;
  prerequisite_roots: { id: string; code: string; depth: number }[];
}

export interface BackendTask {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  task_type: "review" | "practice";
  is_completed: boolean;
  clo_id: string;
}

export interface BackendPlan {
  id: string;
  student_id: string;
  generated_at: string;
  week: Record<string, BackendTask[]>;
  total_tasks: number;
  completed_tasks: number;
}

export interface ExamResult {
  session_id: string;
  exam_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  correct_count: number;
  total_questions: number;
  answers: {
    id: string;
    question_id: string;
    selected_option: string | null;
    essay_text: string | null;
    marks_awarded: number | null;
    is_correct: boolean | null;
  }[];
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_code: string | null;
  profile: {
    grade: number | null;
    career_interest: string | null;
    current_avg: number | null;
    target_score: number | null;
  } | null;
}

export const CAREER_OPTIONS = [
  { value: "electrical_engineering", label: "Electrical Engineering", icon: "⚡" },
  { value: "medicine", label: "Medicine", icon: "🏥" },
  { value: "software_engineering", label: "Software Engineering", icon: "💻" },
  { value: "civil_engineering", label: "Civil Engineering", icon: "🏗️" },
  { value: "accounting", label: "Accounting & Finance", icon: "📊" },
  { value: "law", label: "Law", icon: "⚖️" },
  { value: "architecture", label: "Architecture", icon: "🏛️" },
  { value: "pharmacy", label: "Pharmacy", icon: "💊" },
  { value: "education", label: "Education / Teaching", icon: "📚" },
  { value: "agriculture", label: "Agriculture", icon: "🌱" },
];

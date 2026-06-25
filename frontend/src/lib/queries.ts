import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  UserResponse,
  ExamSummary,
  BackendQuestion,
  BackendGap,
  BackendPlan,
  ExamResult,
} from "@/types";

// ── Auth / Profile ────────────────────────────────────────────────────────

export function useMe() {
  return useQuery<UserResponse>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data as UserResponse),
    retry: false,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { grade?: number; career_interest?: string; target_score?: number }) =>
      api.patch("/auth/profile", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

// ── Curriculum ────────────────────────────────────────────────────────────

export function useSubjects(grade?: number) {
  return useQuery<{ id: string; name: string; grade: number }[]>({
    queryKey: ["subjects", grade],
    queryFn: () =>
      api.get("/curriculum/subjects", { params: grade ? { grade } : {} }).then((r) => r.data),
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: ["subject", id],
    queryFn: () => api.get(`/curriculum/subjects/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// ── Exams ─────────────────────────────────────────────────────────────────

export function useStudentExams() {
  return useQuery<ExamSummary[]>({
    queryKey: ["exams", "student"],
    queryFn: () => api.get("/exams").then((r) => r.data as ExamSummary[]),
  });
}

export function useTeacherExams() {
  return useQuery<ExamSummary[]>({
    queryKey: ["exams", "teacher"],
    queryFn: () => api.get("/exams/teacher").then((r) => r.data as ExamSummary[]),
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get(`/exams/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useStartSession(examId: string) {
  const qc = useQueryClient();
  return useMutation<{ id: string; exam_id: string; student_id: string; started_at: string; status: string; answers: unknown[] }>({
    mutationFn: () => api.post(`/exams/${examId}/sessions`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useExamQuestions(id: string) {
  return useQuery<BackendQuestion[]>({
    queryKey: ["exam-questions", id],
    queryFn: () => api.get(`/exams/${id}/questions`).then((r) => r.data as BackendQuestion[]),
    enabled: !!id,
  });
}

export function useStartExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) =>
      api.post(`/exams/${examId}/sessions`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useSubmitExam() {
  const qc = useQueryClient();
  return useMutation<ExamResult, Error, {
    sessionId: string;
    answers: { question_id: string; selected_option?: string; essay_text?: string }[];
  }>({
    mutationFn: ({ sessionId, answers }) =>
      api.post(`/exams/sessions/${sessionId}/submit`, { answers }).then((r) => r.data as ExamResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["gaps"] });
    },
  });
}

export function useVerifyExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: Record<string, unknown> }) =>
      api.post(`/exams/${examId}/verify`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

// ── Learning Gaps ─────────────────────────────────────────────────────────

export function useMyGaps() {
  return useQuery<BackendGap[]>({
    queryKey: ["gaps", "my"],
    queryFn: () => api.get("/gaps/my").then((r) => r.data as BackendGap[]),
  });
}

export function useStudentGaps(studentId: string) {
  return useQuery<BackendGap[]>({
    queryKey: ["gaps", "student", studentId],
    queryFn: () => api.get(`/gaps/student/${studentId}`).then((r) => r.data as BackendGap[]),
    enabled: !!studentId,
  });
}

// ── Study Plan ────────────────────────────────────────────────────────────

export function useMyPlan() {
  return useQuery<BackendPlan | null>({
    queryKey: ["study-plan"],
    queryFn: () => api.get("/study-plan/my").then((r) => r.data as BackendPlan | null),
  });
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation<BackendPlan>({
    mutationFn: () => api.post("/study-plan/my/generate").then((r) => r.data as BackendPlan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-plan"] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api.patch(`/study-plan/tasks/${taskId}/toggle`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-plan"] }),
  });
}

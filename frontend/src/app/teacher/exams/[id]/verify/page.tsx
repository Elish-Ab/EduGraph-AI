"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import type { VerificationReport } from "@/types";
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, ThumbsUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK: VerificationReport = {
  exam_id: "e1",
  curriculum_alignment: 86,
  clo_coverage: 70,
  difficulty_balance: "moderate",
  out_of_curriculum_count: 1,
  under_covered_topics: ["Magnetism"],
  questions_analysis: [
    { question_id: "q1", question_text: "A resistor of 10Ω is connected to a 5V battery. Calculate the current.", assigned_clo: "Analyze current, voltage, and resistance in a circuit", is_aligned: true },
    { question_id: "q2", question_text: "Define Ohm's Law and state its expression.", assigned_clo: "Apply Ohm's Law to solve circuit problems", is_aligned: true },
    { question_id: "q3", question_text: "What is the boiling point of water at sea level?", assigned_clo: undefined, is_aligned: false, issue: "Out of curriculum — this topic belongs to Chemistry, not Electricity unit." },
    { question_id: "q4", question_text: "Calculate equivalent resistance of two parallel resistors.", assigned_clo: "Analyze series and parallel circuit configurations", is_aligned: true },
    { question_id: "q5", question_text: "Explain how wire length affects resistance.", assigned_clo: "Analyze factors affecting electrical resistance", is_aligned: true },
  ],
  ai_recommendation: "Revise Q3 — it is out of curriculum for this unit. Add 2 questions covering Magnetism (CLO 3.4) to improve CLO coverage. The difficulty balance is moderate and appropriate.",
};

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle
            cx="40" cy="40" r="32" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${(value / 100) * 201} 201`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
    </div>
  );
}

export default function VerifyPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: examDetail } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const res = await api.get(`/exams/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const report = examDetail
    ? {
        ...MOCK,
        exam_id: examDetail.id,
        curriculum_alignment: examDetail.alignment_score ?? MOCK.curriculum_alignment,
        clo_coverage: examDetail.clo_coverage ?? MOCK.clo_coverage,
        ai_recommendation: examDetail.ai_notes ?? MOCK.ai_recommendation,
      }
    : MOCK;

  const approve = useMutation({
    mutationFn: () =>
      api.post(`/exams/${id}/verify`, {
        approve: true,
        alignment_score: report.curriculum_alignment,
        clo_coverage: report.clo_coverage,
        ai_notes: report.ai_recommendation,
      }),
    onSuccess: () => router.push("/teacher/exams"),
  });

  const reject = useMutation({
    mutationFn: () =>
      api.post(`/exams/${id}/verify`, {
        approve: false,
        ai_notes: "Exam needs revision before publishing.",
      }),
    onSuccess: () => router.push("/teacher/exams"),
  });

  const difficultyColor = {
    low: "text-chart-3",
    moderate: "text-primary",
    high: "text-destructive",
  }[report.difficulty_balance];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification Report</h1>
        <p className="text-muted-foreground mt-1">Physics — Electricity Unit Test</p>
      </div>

      {/* Score overview */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex justify-around py-2">
            <ScoreRing value={report.curriculum_alignment} label="Curriculum Alignment" color="#F59E0B" />
            <ScoreRing value={report.clo_coverage} label="CLO Coverage" color="#10b981" />
            <div className="text-center">
              <div className="w-20 h-20 mx-auto flex items-center justify-center">
                <span className={cn("text-2xl font-bold capitalize", difficultyColor)}>
                  {report.difficulty_balance}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Difficulty Balance</p>
            </div>
          </div>

          {/* Issues summary */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {report.out_of_curriculum_count > 0 && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-lg px-3 py-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-foreground">{report.out_of_curriculum_count} out-of-curriculum question</span>
              </div>
            )}
            {report.under_covered_topics.map((t) => (
              <div key={t} className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Under-covered: {t}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="bg-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Sparkles className="w-4 h-4 text-primary" /> AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{report.ai_recommendation}</p>
        </CardContent>
      </Card>

      {/* Question-by-question */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Question Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.questions_analysis.map((q, i) => (
            <div
              key={q.question_id}
              className={cn(
                "rounded-lg p-4 border",
                q.is_aligned ? "border-border bg-muted/20" : "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {q.is_aligned ? (
                    <CheckCircle2 className="w-4 h-4 text-chart-3" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Q{i + 1}</p>
                  <p className="text-sm text-foreground">{q.question_text}</p>
                  {q.assigned_clo && (
                    <p className="text-xs text-muted-foreground mt-1.5">CLO: {q.assigned_clo}</p>
                  )}
                  {q.issue && (
                    <p className="text-xs text-destructive mt-1.5 font-medium">{q.issue}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={() => approve.mutate()}
          disabled={approve.isPending}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          {approve.isPending ? "Approving…" : "Approve & Publish"}
        </Button>
        <Button
          variant="outline"
          className="border-border"
          onClick={() => reject.mutate()}
          disabled={reject.isPending}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Send for Revision
        </Button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeacherExams } from "@/lib/queries";
import type { ExamSummary } from "@/types";
import { FileText, Upload, CheckCircle2, Clock, Edit, Loader2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  verified: "bg-primary/15 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-border",
  pending_verification: "bg-chart-5/15 text-chart-5 border-chart-5/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/20",
};

const MOCK: ExamSummary[] = [
  { id: "e1", title: "Physics — Electricity Unit Test", grade: 11, duration_minutes: 45, total_marks: 50, status: "active", question_count: 10, alignment_score: 86, created_at: "2026-06-20" },
  { id: "e2", title: "Mathematics — Algebra Assessment", grade: 11, duration_minutes: 40, total_marks: 40, status: "draft", question_count: 8, alignment_score: null, created_at: "2026-06-18" },
  { id: "e3", title: "Physics — Mechanics Mid-term", grade: 11, duration_minutes: 60, total_marks: 60, status: "verified", question_count: 12, alignment_score: 91, created_at: "2026-06-10" },
];

export default function TeacherExamsPage() {
  const { data: exams = MOCK, isLoading } = useTeacherExams();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Exams</h1>
          <p className="text-muted-foreground mt-1">{exams.length} exams created</p>
        </div>
        <Link href="/teacher/exams/upload">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" /> Upload New
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => (
          <Card key={exam.id} className="bg-card border-border card-hover">
            <CardContent className="flex items-center justify-between py-5 px-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2.5 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{exam.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">Grade {exam.grade}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {exam.duration_minutes} min
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{exam.total_marks} marks</span>
                    {exam.alignment_score !== null && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">{exam.alignment_score}% aligned</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`${STATUS_STYLES[exam.status] ?? STATUS_STYLES.draft} border text-xs`}>
                  {exam.status.replace(/_/g, " ")}
                </Badge>
                {(exam.status === "draft" || exam.status === "pending_verification") && (
                  <Link href={`/teacher/exams/${exam.id}/verify`}>
                    <Button size="sm" variant="outline" className="border-border text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verify
                    </Button>
                  </Link>
                )}
                {(exam.status === "active" || exam.status === "verified") && (
                  <Link href={`/teacher/exams/${exam.id}/grade`}>
                    <Button size="sm" variant="outline" className="border-border text-xs">
                      <Edit className="w-3.5 h-3.5 mr-1" /> Grade
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

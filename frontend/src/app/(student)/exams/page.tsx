"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentExams } from "@/lib/queries";
import type { ExamSummary } from "@/types";
import { BookOpen, Clock, ArrowRight, Loader2 } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  verified: "bg-primary/15 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-border",
  closed: "bg-muted text-muted-foreground border-border",
};

const MOCK: ExamSummary[] = [
  { id: "e1", title: "Physics — Electricity Unit Test", grade: 11, duration_minutes: 45, total_marks: 50, status: "active", question_count: 10, alignment_score: 86, created_at: "2026-06-20" },
  { id: "e2", title: "Mathematics — Algebra Assessment", grade: 11, duration_minutes: 40, total_marks: 40, status: "active", question_count: 8, alignment_score: 91, created_at: "2026-06-18" },
];

export default function StudentExamsPage() {
  const { data: exams = MOCK, isLoading } = useStudentExams();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Exams</h1>
        <p className="text-muted-foreground mt-1">Available exams for your grade.</p>
      </div>

      {exams.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No exams available right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="bg-card border-border card-hover">
              <CardContent className="flex items-center justify-between py-5 px-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg mt-0.5">
                    <BookOpen className="w-5 h-5 text-primary" />
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${STATUS_BADGE[exam.status] ?? STATUS_BADGE.draft} text-xs border`}>
                    {exam.status}
                  </Badge>
                  {exam.status === "active" && (
                    <Link href={`/exams/${exam.id}/take`}>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Start <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ExamResult } from "@/types";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";

function gradeLabel(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "B+";
  if (pct >= 75) return "B";
  if (pct >= 70) return "C+";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

const MOCK_RESULT: ExamResult = {
  session_id: "s1",
  exam_title: "Physics — Electricity Unit Test",
  score: 31,
  total_marks: 50,
  percentage: 62,
  correct_count: 3,
  total_questions: 5,
  answers: [
    { id: "a1", question_id: "q1", selected_option: "a", essay_text: null, marks_awarded: 3, is_correct: true },
    { id: "a2", question_id: "q2", selected_option: null, essay_text: "Ohm's Law states...", marks_awarded: 2, is_correct: false },
    { id: "a3", question_id: "q3", selected_option: "b", essay_text: null, marks_awarded: 0, is_correct: false },
  ],
};

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<ExamResult>(MOCK_RESULT);

  useEffect(() => {
    const stored = sessionStorage.getItem(`exam-result-${id}`);
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        // keep mock
      }
    }
  }, [id]);

  const color =
    result.percentage >= 80
      ? "text-chart-3"
      : result.percentage >= 60
      ? "text-primary"
      : "text-destructive";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
        <p className="text-muted-foreground mt-1">{result.exam_title}</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6 flex items-center gap-8">
          <div className="text-center">
            <p className={`text-5xl font-bold ${color}`}>{Math.round(result.percentage)}%</p>
            <p className="text-sm text-muted-foreground mt-1">Score</p>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Marks obtained</span>
              <span className="text-foreground font-medium">{result.score} / {result.total_marks}</span>
            </div>
            <Progress value={result.percentage} className="h-2.5 bg-muted" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Grade</span>
              <Badge className="bg-primary/10 text-primary border-primary/20">{gradeLabel(result.percentage)}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Correct answers</span>
              <span className="text-foreground font-medium">{result.correct_count} / {result.total_questions}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {result.answers.some((a) => a.is_correct === false) && (
        <Card className="bg-card border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Questions to review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.answers
              .filter((a) => a.is_correct === false)
              .map((a, i) => (
                <div key={a.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  Question {i + 1} — {a.marks_awarded ?? 0}/{result.total_marks / result.total_questions} marks
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Answer Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.answers.map((answer, i) => (
            <div key={answer.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                {answer.is_correct ? (
                  <CheckCircle2 className="w-4 h-4 text-chart-3 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="text-sm text-foreground">Question {i + 1}</span>
                {answer.selected_option && (
                  <span className="text-xs text-muted-foreground">Option {answer.selected_option.toUpperCase()}</span>
                )}
                {answer.essay_text && (
                  <span className="text-xs text-muted-foreground italic">Essay response</span>
                )}
              </div>
              <span className="text-sm font-medium text-muted-foreground shrink-0 ml-4">
                {answer.marks_awarded ?? 0} pts
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/gaps" className="flex-1">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            View Learning Gaps <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href="/study-plan">
          <Button variant="outline" className="border-border">Study Plan</Button>
        </Link>
      </div>
    </div>
  );
}

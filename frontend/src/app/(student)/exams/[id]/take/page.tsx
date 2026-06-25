"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useExamQuestions, useStartSession, useSubmitExam } from "@/lib/queries";
import type { BackendQuestion } from "@/types";
import { Flag, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AnswerMap = Record<string, string>;

const MOCK_QUESTIONS: BackendQuestion[] = [
  { id: "q1", order: 1, question_type: "mcq", text: "A resistor of 10Ω is connected to a 5V battery. What is the current flowing through the circuit?", option_a: "0.5 A", option_b: "2.0 A", option_c: "50 A", option_d: "5.0 A", marks: 3 },
  { id: "q2", order: 2, question_type: "essay", text: "Define Ohm's Law and state its mathematical expression.", option_a: null, option_b: null, option_c: null, option_d: null, marks: 4 },
  { id: "q3", order: 3, question_type: "mcq", text: "Two resistors of 4Ω and 6Ω are connected in parallel. Calculate the equivalent resistance.", option_a: "10 Ω", option_b: "2.4 Ω", option_c: "1.5 Ω", option_d: "24 Ω", marks: 3 },
];

export default function ExamTakePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const sessionIdRef = useRef<string | null>(null);

  const { data: questions = MOCK_QUESTIONS, isLoading: questionsLoading } = useExamQuestions(id);
  const startSession = useStartSession(id);
  const submitExam = useSubmitExam();

  useEffect(() => {
    startSession.mutate(undefined, {
      onSuccess: (session) => {
        sessionIdRef.current = session.id;
      },
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  }, []);

  const handleSubmit = () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    const answerList = questions.map((q) => {
      const value = answers[q.id];
      if (q.question_type === "mcq") {
        const optionKeys = ["a", "b", "c", "d"] as const;
        return { question_id: q.id, selected_option: value ? optionKeys[Number(value)] : undefined };
      }
      return { question_id: q.id, essay_text: value };
    });

    submitExam.mutate(
      { sessionId, answers: answerList },
      {
        onSuccess: (result) => {
          sessionStorage.setItem(`exam-result-${id}`, JSON.stringify(result));
          router.push(`/exams/${id}/results`);
        },
      }
    );
  };

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  if (!q) return null;

  const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-8 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground text-sm">Exam</p>
          <p className="text-xs text-muted-foreground">
            Question {current + 1} of {questions.length} · {q.marks} marks
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className={cn("text-lg font-bold tabular-nums", timeLeft < 300 ? "text-destructive" : "text-primary")}>
              {formatTime(timeLeft)}
            </p>
            <p className="text-[10px] text-muted-foreground">remaining</p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={submitExam.isPending || !sessionIdRef.current}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {submitExam.isPending ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </div>

      <div className="px-8 pt-3">
        <Progress value={progress} className="h-1 bg-muted" />
        <p className="text-xs text-muted-foreground mt-1">{answeredCount} of {questions.length} answered</p>
      </div>

      <div className="flex flex-1 gap-0">
        <div className="flex-1 p-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-foreground leading-relaxed">{q.text}</p>
                <button
                  onClick={() => toggleFlag(q.id)}
                  className={cn(
                    "shrink-0 p-1.5 rounded transition-colors",
                    flagged.has(q.id) ? "text-chart-5 bg-chart-5/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              {q.question_type === "mcq" && options.length > 0 && (
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(q.id, String(i))}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                        answers[q.id] === String(i)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/40"
                      )}
                    >
                      <span className="font-medium mr-3">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === "essay" && (
                <Textarea
                  rows={8}
                  placeholder="Write your answer here…"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  className="bg-input border-border resize-none text-sm"
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              disabled={current === questions.length - 1}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        <div className="w-56 border-l border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">QUESTIONS</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((question, i) => (
              <button
                key={question.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-8 h-8 rounded text-xs font-medium transition-all",
                  i === current
                    ? "bg-primary text-primary-foreground"
                    : answers[question.id]
                    ? "bg-chart-3/20 text-chart-3 border border-chart-3/30"
                    : flagged.has(question.id)
                    ? "bg-chart-5/20 text-chart-5 border border-chart-5/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary inline-block" /> Current</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-chart-3/20 border border-chart-3/30 inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-chart-5/20 border border-chart-5/30 inline-block" /> Flagged</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-muted inline-block" /> Unanswered</div>
          </div>
        </div>
      </div>
    </div>
  );
}

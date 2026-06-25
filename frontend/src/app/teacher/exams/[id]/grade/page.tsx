"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { CheckCircle2, Save } from "lucide-react";

interface StudentAnswer {
  session_id: string;
  student_name: string;
  question_id: string;
  question_text: string;
  student_answer: string;
  marks: number;
  awarded: number | null;
}

const MOCK: StudentAnswer[] = [
  { session_id: "s1", student_name: "Abebe Kebede", question_id: "q2", question_text: "Define Ohm's Law and state its mathematical expression.", student_answer: "Ohm's Law says that current is proportional to voltage. V = IR", marks: 4, awarded: null },
  { session_id: "s1", student_name: "Abebe Kebede", question_id: "q4", question_text: "Explain how increasing the length of a wire affects its resistance. Use the resistivity formula.", student_answer: "When wire is longer, resistance increases because R = ρL/A. More length means electrons travel farther and collide more.", marks: 6, awarded: null },
  { session_id: "s2", student_name: "Tigist Haile", question_id: "q2", question_text: "Define Ohm's Law and state its mathematical expression.", student_answer: "Ohm's Law: V = IR where V is voltage in volts, I is current in amperes, R is resistance in ohms.", marks: 4, awarded: null },
];

export default function GradePage() {
  const { id } = useParams();
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  const saveGrades = useMutation({
    mutationFn: () =>
      api.post(`/exams/${id}/grades`, {
        grades: Object.entries(marks).map(([key, m]) => {
          const [session_id, question_id] = key.split("__");
          return { session_id, question_id, marks_awarded: m };
        }),
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => router.push("/teacher/exams"), 1500);
    },
  });

  const setMark = (session_id: string, question_id: string, val: number) => {
    setMarks((prev) => ({ ...prev, [`${session_id}__${question_id}`]: val }));
  };

  const getMark = (session_id: string, question_id: string) =>
    marks[`${session_id}__${question_id}`] ?? "";

  const grouped = MOCK.reduce<Record<string, StudentAnswer[]>>((acc, a) => {
    if (!acc[a.student_name]) acc[a.student_name] = [];
    acc[a.student_name].push(a);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manual Grading</h1>
        <p className="text-muted-foreground mt-1">Grade written answers for Physics — Electricity Unit Test</p>
      </div>

      {Object.entries(grouped).map(([student, answers]) => (
        <Card key={student} className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">{student}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {answers.map((ans) => (
              <div key={ans.question_id} className="space-y-3 border-b border-border pb-5 last:border-0 last:pb-0">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">QUESTION</p>
                  <p className="text-sm text-foreground">{ans.question_text}</p>
                  <Badge className="mt-2 bg-muted text-muted-foreground border-border text-xs">{ans.marks} marks</Badge>
                </div>
                <div className="bg-muted/10 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">STUDENT ANSWER</p>
                  <p className="text-sm text-foreground leading-relaxed">{ans.student_answer}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">Marks awarded:</p>
                  <Input
                    type="number"
                    min={0}
                    max={ans.marks}
                    className="w-20 bg-input border-border text-center"
                    value={getMark(ans.session_id, ans.question_id)}
                    onChange={(e) => setMark(ans.session_id, ans.question_id, Number(e.target.value))}
                    placeholder={`/ ${ans.marks}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {saved ? (
        <div className="flex items-center justify-center gap-2 py-4 text-chart-3">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Grades saved! Redirecting…</span>
        </div>
      ) : (
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={() => saveGrades.mutate()}
          disabled={saveGrades.isPending || Object.keys(marks).length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveGrades.isPending ? "Saving…" : "Save grades"}
        </Button>
      )}
    </div>
  );
}

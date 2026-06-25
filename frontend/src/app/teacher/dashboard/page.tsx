"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { FileText, Upload, ArrowRight } from "lucide-react";
import { useTeacherExams } from "@/lib/queries";
import type { ExamSummary } from "@/types";

const SUBJECT_DATA = [
  { subject: "Physics", avg: 62 },
  { subject: "Math", avg: 71 },
  { subject: "Chemistry", avg: 78 },
];

const WEAK_CLOS = [
  { clo: "Analyze circuit resistance", subject: "Physics", fail_rate: 68, student_count: 24 },
  { clo: "Apply Ohm's Law", subject: "Physics", fail_rate: 61, student_count: 22 },
  { clo: "Solve linear equations", subject: "Math", fail_rate: 44, student_count: 16 },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  verified: "bg-primary/15 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-border",
  pending_verification: "bg-chart-5/15 text-chart-5 border-chart-5/20",
};

export default function TeacherDashboard() {
  const { data: exams = [] } = useTeacherExams();
  const recentExams: ExamSummary[] = exams.slice(0, 5);
  const draftCount = exams.filter((e: ExamSummary) => e.status === "draft" || e.status === "pending_verification").length;
  const activeCount = exams.filter((e: ExamSummary) => e.status === "active").length;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">Class overview · Exam management</p>
        </div>
        <Link href="/teacher/exams/upload">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" /> Upload Exam
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Exams", value: String(exams.length), sub: `${activeCount} active, ${draftCount} draft` },
          { label: "Class Gaps", value: "—", sub: "Take exams to see" },
          { label: "Students", value: "—", sub: "In your classes" },
        ].map(({ label, value, sub }) => (
          <Card key={label} className="bg-card border-border card-hover">
            <CardContent className="pt-5">
              <div className="bg-primary/10 p-2 rounded-lg w-fit">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Class Average by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SUBJECT_DATA} barSize={40}>
                <XAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  itemStyle={{ color: "#F59E0B" }}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {SUBJECT_DATA.map((_, i) => <Cell key={i} fill="#F59E0B" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Top Weak CLOs</CardTitle>
            <Link href="/teacher/class-gaps">
              <Button variant="ghost" size="sm" className="text-primary text-xs">
                Full report <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {WEAK_CLOS.map((item) => (
              <div key={item.clo} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{item.clo}</p>
                    <p className="text-xs text-muted-foreground">{item.subject} · {item.student_count} students</p>
                  </div>
                  <span className="text-sm font-bold text-destructive">{item.fail_rate}% fail</span>
                </div>
                <Progress value={100 - item.fail_rate} className="h-1.5 bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Recent Exams</CardTitle>
          <Link href="/teacher/exams">
            <Button variant="ghost" size="sm" className="text-primary text-xs">
              All exams <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentExams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No exams uploaded yet.</p>
          ) : (
            recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">{exam.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  {exam.alignment_score !== null && (
                    <span className="text-xs text-muted-foreground">{exam.alignment_score}% alignment</span>
                  )}
                  <Badge className={`${STATUS_STYLES[exam.status] ?? STATUS_STYLES.draft} border`}>
                    {exam.status.replace(/_/g, " ")}
                  </Badge>
                  <Link href={`/teacher/exams/${exam.id}/verify`}>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

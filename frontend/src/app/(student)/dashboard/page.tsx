"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useMyGaps, useStudentExams, useMyPlan } from "@/lib/queries";
import Link from "next/link";
import {
  TrendingUp,
  BookOpen,
  Brain,
  CalendarCheck,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card className="bg-card border-border card-hover">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="bg-primary/10 p-2 rounded-lg">{icon}</div>
        </div>
        <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user, profile } = useAuthStore();
  const { data: gaps = [] } = useMyGaps();
  const { data: exams = [] } = useStudentExams();
  const { data: plan } = useMyPlan();

  const currentAvg = profile?.current_avg ?? 0;
  const targetAvg = profile?.target_score ?? 85;
  const criticalGaps = gaps.filter((g) => g.severity === "critical");

  const subjectPerf = gaps.length > 0
    ? Object.entries(
        gaps.reduce<Record<string, number[]>>((acc, g) => {
          const subj = g.clo_code?.split(".")[0] ?? "Other";
          const subjectMap: Record<string, string> = { PHYS: "Physics", MATH: "Math", CHEM: "Chemistry", BIO: "Biology" };
          const name = subjectMap[subj] ?? subj;
          if (!acc[name]) acc[name] = [];
          acc[name].push(100 - g.fail_rate);
          return acc;
        }, {})
      ).map(([subject, scores]) => ({
        subject,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
    : [
        { subject: "Physics", score: 62 },
        { subject: "Math", score: 71 },
        { subject: "Chemistry", score: 78 },
      ];

  const progressPct = targetAvg > 0 ? Math.min(100, Math.round((currentAvg / targetAvg) * 100)) : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Career Goal:{" "}
            <span className="text-primary font-medium">
              {profile?.career_interest?.replace(/_/g, " ") ?? "Not set"}
            </span>
          </p>
        </div>
        <Link href="/ai-tutor">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Ask AI Tutor
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          label="Current Average"
          value={currentAvg ? `${currentAvg}%` : "—"}
          sub={`Target: ${targetAvg}%`}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          label="Available Exams"
          value={String(exams.length)}
          sub="This semester"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-primary" />}
          label="Learning Gaps"
          value={String(gaps.length)}
          sub={`${criticalGaps.length} critical`}
        />
        <StatCard
          icon={<CalendarCheck className="w-5 h-5 text-primary" />}
          label="Study Plan"
          value={plan ? `${plan.completed_tasks}/${plan.total_tasks}` : "None"}
          sub={plan ? "Tasks this week" : "Generate plan"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectPerf} barSize={28}>
                <XAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  itemStyle={{ color: "#F59E0B" }}
                />
                <Bar dataKey="score" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Priority Gaps</CardTitle>
            <Link href="/gaps">
              <Button variant="ghost" size="sm" className="text-primary text-xs">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.slice(0, 3).map((gap) => {
              const mastery = Math.round(100 - gap.fail_rate);
              return (
                <div key={gap.clo_id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {gap.severity === "critical" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span className="text-sm text-foreground">{gap.topic ?? gap.clo_code}</span>
                      {gap.is_career_critical && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 py-0">Career</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{mastery}%</span>
                  </div>
                  <Progress value={mastery} className="h-1.5 bg-muted" />
                </div>
              );
            })}
            {gaps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Take an exam to see your gaps.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {currentAvg > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-foreground">Progress toward target average</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentAvg}% → {targetAvg}% target
                </p>
              </div>
              <span className="text-lg font-bold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-3 bg-muted" />
            <p className="text-xs text-muted-foreground mt-2">
              {targetAvg - currentAvg} points to go — follow your study plan to get there.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

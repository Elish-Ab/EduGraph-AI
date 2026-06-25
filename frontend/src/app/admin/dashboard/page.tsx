"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Users, FileText, TrendingUp, AlertTriangle } from "lucide-react";

const TREND_DATA = [
  { month: "Jan", avg: 61 },
  { month: "Feb", avg: 63 },
  { month: "Mar", avg: 65 },
  { month: "Apr", avg: 64 },
  { month: "May", avg: 68 },
  { month: "Jun", avg: 71 },
];

const SUBJECT_STATS = [
  { subject: "Physics", avg: 64, improvement: +3, gap_count: 8 },
  { subject: "Mathematics", avg: 71, improvement: +6, gap_count: 5 },
  { subject: "Chemistry", avg: 78, improvement: +2, gap_count: 3 },
  { subject: "Biology", avg: 82, improvement: +1, gap_count: 2 },
  { subject: "English", avg: 74, improvement: -1, gap_count: 4 },
];

const TEACHER_QUALITY = [
  { name: "Ato Kebede Alemu", subject: "Physics", alignment_avg: 86, exams: 4 },
  { name: "W/ro Tigist Bekele", subject: "Mathematics", alignment_avg: 91, exams: 3 },
  { name: "Ato Dawit Girma", subject: "Chemistry", alignment_avg: 79, exams: 5 },
];

export default function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">School Overview</h1>
        <p className="text-muted-foreground mt-1">Addis Ketema Secondary School · Academic Year 2025/26</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Students", value: "1,240", sub: "12 classes" },
          { icon: TrendingUp, label: "School Average", value: "71%", sub: "+4% from last term" },
          { icon: FileText, label: "Exams Verified", value: "48", sub: "This semester" },
          { icon: AlertTriangle, label: "At-Risk Students", value: "187", sub: "Below 60% average" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <Card key={label} className="bg-card border-border card-hover">
            <CardContent className="pt-5">
              <div className="bg-primary/10 p-2 rounded-lg w-fit">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">School Average Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#F59E0B" }}
              />
              <Line type="monotone" dataKey="avg" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: "#F59E0B", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {SUBJECT_STATS.map((s) => (
              <div key={s.subject} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-medium">{s.subject}</span>
                    <Badge className={`text-[10px] border py-0 ${s.improvement >= 0 ? "bg-chart-3/15 text-chart-3 border-chart-3/20" : "bg-destructive/15 text-destructive border-destructive/20"}`}>
                      {s.improvement > 0 ? "+" : ""}{s.improvement}%
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-foreground">{s.avg}%</span>
                </div>
                <Progress value={s.avg} className="h-1.5 bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Teacher assessment quality */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Teacher Assessment Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {TEACHER_QUALITY.map((t) => (
              <div key={t.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.subject} · {t.exams} exams</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{t.alignment_avg}%</span>
                </div>
                <Progress value={t.alignment_avg} className="h-1.5 bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

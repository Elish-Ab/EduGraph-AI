"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Users } from "lucide-react";

const CLO_DATA = [
  { clo: "Analyze current, voltage, and resistance in a circuit", topic: "Electric Circuits", subject: "Physics", fail_rate: 68, student_count: 24, severity: "high" },
  { clo: "Apply Ohm's Law to solve circuit problems", topic: "Ohm's Law", subject: "Physics", fail_rate: 61, student_count: 22, severity: "high" },
  { clo: "Calculate equivalent resistance in parallel/series circuits", topic: "Circuit Configurations", subject: "Physics", fail_rate: 55, student_count: 20, severity: "medium" },
  { clo: "Solve linear equations and inequalities", topic: "Algebra", subject: "Mathematics", fail_rate: 44, student_count: 16, severity: "medium" },
  { clo: "Convert between SI units accurately", topic: "Unit Conversion", subject: "Physics", fail_rate: 39, student_count: 14, severity: "medium" },
  { clo: "Analyze factors affecting resistance", topic: "Resistivity", subject: "Physics", fail_rate: 28, student_count: 10, severity: "low" },
];

const STUDENT_GROUPS = [
  { label: "Critical intervention needed", count: 8, color: "text-destructive", bg: "bg-destructive/10", description: "Below 50% on 3+ CLOs" },
  { label: "Needs support", count: 14, color: "text-primary", bg: "bg-primary/10", description: "Below 60% on 1-2 CLOs" },
  { label: "On track", count: 14, color: "text-chart-3", bg: "bg-chart-3/10", description: "Above 70% on most CLOs" },
];

export default function ClassGapsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Class Gap Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Whole-class CLO mastery across all subjects · Grade 11
        </p>
      </div>

      {/* Student grouping */}
      <div className="grid grid-cols-3 gap-4">
        {STUDENT_GROUPS.map((g) => (
          <Card key={g.label} className="bg-card border-border card-hover">
            <CardContent className="pt-5">
              <div className={`${g.bg} p-2 rounded-lg w-fit`}>
                <Users className={`w-4 h-4 ${g.color}`} />
              </div>
              <p className={`text-3xl font-bold mt-3 ${g.color}`}>{g.count}</p>
              <p className="text-sm text-foreground font-medium">{g.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CLO heatmap */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">CLO Mastery — Class Failure Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CLO_DATA.map((item) => (
            <div key={item.clo} className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <AlertTriangle
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.severity === "high" ? "text-destructive" : item.severity === "medium" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{item.clo}</p>
                    <p className="text-xs text-muted-foreground">{item.subject} · {item.topic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{item.student_count} students</span>
                  <Badge
                    className={`text-xs border ${item.severity === "high" ? "bg-destructive/15 text-destructive border-destructive/20" : item.severity === "medium" ? "bg-primary/15 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`}
                  >
                    {item.fail_rate}% fail
                  </Badge>
                </div>
              </div>
              <Progress value={100 - item.fail_rate} className="h-1.5 bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

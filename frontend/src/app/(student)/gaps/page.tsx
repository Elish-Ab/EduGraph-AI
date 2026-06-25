"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMyGaps } from "@/lib/queries";
import type { BackendGap } from "@/types";
import { AlertTriangle, Info, Sparkles, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK: BackendGap[] = [
  { clo_id: "1", clo_code: "PHYS.11.U2.T2.CLO1", description: "Analyze current, voltage, and resistance in a circuit", topic: "Electric Circuits", bloom_level: "analyze", fail_rate: 58, fail_count: 5, total_attempts: 8, severity: "critical", is_career_critical: true, prerequisite_roots: [] },
  { clo_id: "2", clo_code: "MATH.11.U1.T2.CLO2", description: "Solve linear equations and inequalities", topic: "Algebra", bloom_level: "apply", fail_rate: 42, fail_count: 3, total_attempts: 7, severity: "needs_support", is_career_critical: true, prerequisite_roots: [{ id: "r1", code: "MATH.11.U1.T1.CLO1", depth: 1 }] },
  { clo_id: "3", clo_code: "PHYS.11.U1.T1.CLO2", description: "Convert between SI units accurately", topic: "Unit Conversion", bloom_level: "apply", fail_rate: 39, fail_count: 3, total_attempts: 7, severity: "needs_support", is_career_critical: false, prerequisite_roots: [] },
];

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-destructive/30 bg-destructive/5",
  needs_support: "border-primary/20 bg-primary/5",
  on_track: "border-border bg-card",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/20",
  needs_support: "bg-primary/15 text-primary border-primary/20",
  on_track: "bg-muted text-muted-foreground border-border",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "critical",
  needs_support: "needs support",
  on_track: "on track",
};

function subjectFromCode(code: string): string {
  const prefix = code.split(".")[0];
  const MAP: Record<string, string> = { PHYS: "Physics", MATH: "Mathematics", CHEM: "Chemistry", BIO: "Biology" };
  return MAP[prefix] ?? prefix;
}

export default function GapsPage() {
  const { data: gaps = MOCK, refetch, isFetching, isLoading } = useMyGaps();

  const criticalCount = gaps.filter((g) => g.severity === "critical").length;
  const careerCount = gaps.filter((g) => g.is_career_critical).length;
  const rootCauses = gaps.filter((g) => g.prerequisite_roots.length > 0);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Gap Analysis</h1>
          <p className="text-muted-foreground mt-1">
            {criticalCount} critical gaps · {careerCount} career-critical
          </p>
        </div>
        <Button
          variant="outline"
          className="border-border"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
          Re-analyze
        </Button>
      </div>

      {rootCauses.length > 0 && (
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Root Cause Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These prerequisite gaps are blocking your progress on other topics.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {rootCauses.map((g, i) => (
                <span key={g.clo_id} className="flex items-center gap-2">
                  <span className="bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-medium">
                    {g.topic ?? g.clo_code}
                  </span>
                  {i < rootCauses.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {gaps.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No gaps found. Take some exams to see your analysis.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Gaps</h2>
          {gaps.map((gap) => {
            const mastery = Math.round(100 - gap.fail_rate);
            return (
              <Card key={gap.clo_id} className={cn("border card-hover", SEVERITY_STYLES[gap.severity])}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          gap.severity === "critical" ? "text-destructive" : "text-primary"
                        )}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{gap.topic ?? gap.clo_code}</p>
                          <Badge className={cn("text-[10px] border", SEVERITY_BADGE[gap.severity])}>
                            {SEVERITY_LABEL[gap.severity]}
                          </Badge>
                          {gap.is_career_critical && (
                            <Badge className="text-[10px] bg-chart-5/15 text-chart-5 border-chart-5/20 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Career
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{subjectFromCode(gap.clo_code)}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{gap.description}</p>
                        {gap.prerequisite_roots.length > 0 && (
                          <p className="text-xs text-primary mt-1 font-medium">⚠ Prerequisite gap — fix this first</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">{mastery}%</p>
                      <p className="text-xs text-muted-foreground">mastery</p>
                    </div>
                  </div>
                  <Progress value={mastery} className="h-1.5 mt-3 bg-muted/50" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

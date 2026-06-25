"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMyPlan, useGeneratePlan, useToggleTask } from "@/lib/queries";
import type { BackendPlan, BackendTask } from "@/types";
import { BookOpen, CheckCircle2, Clock, Sparkles, Zap, PenLine, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TASK_ICONS: Record<string, React.ReactNode> = {
  review: <BookOpen className="w-3.5 h-3.5" />,
  practice: <PenLine className="w-3.5 h-3.5" />,
};

const MOCK_PLAN: BackendPlan = {
  id: "p1",
  student_id: "s1",
  generated_at: "2026-06-20T00:00:00",
  week: {
    Mon: [{ id: "t1", title: "Review: Algebra", description: "Study linear equations with examples from your exam errors.", duration_minutes: 40, task_type: "review", is_completed: true, clo_id: "c1" }],
    Tue: [{ id: "t2", title: "Practice: Algebra", description: "Solve 15 practice problems on linear equations.", duration_minutes: 30, task_type: "practice", is_completed: false, clo_id: "c1" }],
    Wed: [{ id: "t3", title: "Review: Unit Conversion", description: "Study SI unit conversions.", duration_minutes: 40, task_type: "review", is_completed: false, clo_id: "c2" }],
    Thu: [{ id: "t4", title: "Practice: Unit Conversion", description: "Solve conversion problems.", duration_minutes: 30, task_type: "practice", is_completed: false, clo_id: "c2" }],
    Fri: [{ id: "t5", title: "Review: Electric Circuits", description: "Watch explanation and note the formulas.", duration_minutes: 40, task_type: "review", is_completed: false, clo_id: "c3" }],
    Sat: [{ id: "t6", title: "Practice: Electric Circuits", description: "Practice 10 circuit problems.", duration_minutes: 30, task_type: "practice", is_completed: false, clo_id: "c3" }],
  },
  total_tasks: 6,
  completed_tasks: 1,
};

function TaskCard({ task, onToggle, isPending }: { task: BackendTask; onToggle: () => void; isPending: boolean }) {
  return (
    <Card
      className={cn(
        "border transition-all card-hover",
        task.is_completed
          ? "border-chart-3/20 bg-chart-3/5 opacity-70"
          : "bg-card border-border"
      )}
    >
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-1.5 rounded mt-0.5",
              task.is_completed ? "bg-chart-3/20 text-chart-3" : "bg-primary/10 text-primary"
            )}
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              TASK_ICONS[task.task_type] ?? <Zap className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <p className={cn("text-sm font-medium", task.is_completed ? "text-muted-foreground line-through" : "text-foreground")}>
              {task.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.duration_minutes} min
              </span>
              <Badge className="text-[10px] bg-muted text-muted-foreground border-border py-0 capitalize">
                {task.task_type}
              </Badge>
            </div>
          </div>
        </div>
        {!task.is_completed && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-chart-3 shrink-0"
            onClick={onToggle}
            disabled={isPending}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudyPlanPage() {
  const { data: planData, isLoading } = useMyPlan();
  const plan: BackendPlan = planData ?? MOCK_PLAN;
  const generate = useGeneratePlan();
  const toggleTask = useToggleTask();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const progress = plan.total_tasks > 0
    ? (plan.completed_tasks / plan.total_tasks) * 100
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Plan</h1>
          <p className="text-muted-foreground mt-1">
            {plan.completed_tasks}/{plan.total_tasks} tasks completed
          </p>
        </div>
        <Button
          variant="outline"
          className="border-border"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generate.isPending ? "Generating…" : "Regenerate plan"}
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">This week&apos;s progress</p>
            <span className="text-sm font-bold text-primary">{plan.completed_tasks}/{plan.total_tasks} tasks</span>
          </div>
          <Progress value={progress} className="h-2.5 bg-muted" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {DAYS.map((day) => {
          const tasks = plan.week[day] ?? [];
          if (tasks.length === 0) return null;
          return (
            <div key={day}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <span className="bg-muted px-2 py-0.5 rounded text-foreground">{day}</span>
              </h2>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask.mutate(task.id)}
                    isPending={toggleTask.isPending}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {Object.values(plan.week).every((tasks) => tasks.length === 0) && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            {planData === null ? (
              <>
                <p className="text-muted-foreground text-sm mb-4">No study plan yet. Generate one based on your gaps.</p>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => generate.mutate()}
                  disabled={generate.isPending}
                >
                  {generate.isPending ? "Generating…" : "Generate Study Plan"}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No tasks yet — complete an exam first so the AI can identify your learning gaps and build a personalised plan.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

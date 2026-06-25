"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, AlertTriangle, CheckCircle2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  grade: number;
  career_interest: string;
  current_avg: number;
  gap_count: number;
  severity: "critical" | "needs_support" | "on_track";
  weak_subjects: string[];
  last_exam_score: number;
}

const STUDENTS: Student[] = [
  { id: "s1", name: "Abebe Kebede",    grade: 11, career_interest: "Electrical Engineering", current_avg: 62, gap_count: 4, severity: "critical",      weak_subjects: ["Physics", "Math"],   last_exam_score: 58 },
  { id: "s2", name: "Tigist Haile",    grade: 11, career_interest: "Medicine",                current_avg: 74, gap_count: 2, severity: "needs_support",  weak_subjects: ["Chemistry"],         last_exam_score: 71 },
  { id: "s3", name: "Dawit Girma",     grade: 11, career_interest: "Software Engineering",    current_avg: 81, gap_count: 1, severity: "on_track",       weak_subjects: ["Math"],              last_exam_score: 84 },
  { id: "s4", name: "Mekdes Alemu",    grade: 11, career_interest: "Civil Engineering",       current_avg: 55, gap_count: 5, severity: "critical",       weak_subjects: ["Physics", "Math"],   last_exam_score: 52 },
  { id: "s5", name: "Yonas Tadesse",   grade: 11, career_interest: "Accounting",              current_avg: 77, gap_count: 1, severity: "needs_support",  weak_subjects: ["Physics"],           last_exam_score: 79 },
  { id: "s6", name: "Selam Bekele",    grade: 11, career_interest: "Medicine",                current_avg: 88, gap_count: 0, severity: "on_track",       weak_subjects: [],                    last_exam_score: 91 },
  { id: "s7", name: "Bereket Mengistu",grade: 11, career_interest: "Electrical Engineering",  current_avg: 48, gap_count: 6, severity: "critical",       weak_subjects: ["Physics", "Math"],   last_exam_score: 44 },
  { id: "s8", name: "Hana Tesfaye",    grade: 11, career_interest: "Architecture",            current_avg: 70, gap_count: 2, severity: "needs_support",  weak_subjects: ["Math"],              last_exam_score: 68 },
];

const SEVERITY_CONFIG = {
  critical:      { label: "Critical",       badge: "bg-destructive/15 text-destructive border-destructive/20",  icon: AlertTriangle, iconClass: "text-destructive" },
  needs_support: { label: "Needs support",  badge: "bg-primary/15 text-primary border-primary/20",              icon: Minus,         iconClass: "text-primary" },
  on_track:      { label: "On track",       badge: "bg-chart-3/15 text-chart-3 border-chart-3/20",              icon: CheckCircle2,  iconClass: "text-chart-3" },
};

const FILTER_OPTIONS = ["All", "Critical", "Needs support", "On track"] as const;
type Filter = typeof FILTER_OPTIONS[number];

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = STUDENTS.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.career_interest.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Critical" && s.severity === "critical") ||
      (filter === "Needs support" && s.severity === "needs_support") ||
      (filter === "On track" && s.severity === "on_track");
    return matchSearch && matchFilter;
  });

  const counts = {
    critical:      STUDENTS.filter((s) => s.severity === "critical").length,
    needs_support: STUDENTS.filter((s) => s.severity === "needs_support").length,
    on_track:      STUDENTS.filter((s) => s.severity === "on_track").length,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-1">
          {STUDENTS.length} students · Grade 11
        </p>
      </div>

      {/* Group summary */}
      <div className="grid grid-cols-3 gap-4">
        {(["critical", "needs_support", "on_track"] as const).map((key) => {
          const cfg = SEVERITY_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <Card key={key} className="bg-card border-border card-hover cursor-pointer"
              onClick={() => setFilter(cfg.label as Filter)}>
              <CardContent className="pt-5">
                <Icon className={`w-5 h-5 ${cfg.iconClass}`} />
                <p className="text-2xl font-bold text-foreground mt-2">{counts[key]}</p>
                <p className="text-sm text-muted-foreground">{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            className="pl-9 bg-input border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                filter === f
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {filtered.map((student) => {
          const cfg = SEVERITY_CONFIG[student.severity];
          const Icon = cfg.icon;
          return (
            <Card key={student.id} className="bg-card border-border card-hover">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <Avatar className="w-9 h-9 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {student.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{student.name}</p>
                      <Badge className={`text-[10px] border ${cfg.badge}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {student.career_interest}
                      {student.weak_subjects.length > 0 && (
                        <span className="ml-2 text-destructive/70">
                          · Weak: {student.weak_subjects.join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-foreground">{student.current_avg}%</p>
                    <p className="text-xs text-muted-foreground">avg</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-foreground">{student.last_exam_score}%</p>
                    <p className="text-xs text-muted-foreground">last exam</p>
                  </div>
                  <div className="w-24 hidden md:block">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{student.gap_count} gaps</span>
                    </div>
                    <Progress value={student.current_avg} className="h-1.5 bg-muted" />
                  </div>
                  <Icon className={`w-4 h-4 shrink-0 ${cfg.iconClass}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No students match your filter.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

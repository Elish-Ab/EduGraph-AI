"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, TrendingUp, TrendingDown, Minus, FileText, Users } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  exams_uploaded: number;
  avg_alignment: number;
  avg_clo_coverage: number;
  students_count: number;
  class_avg: number;
  trend: "up" | "down" | "flat";
  weak_areas: string[];
}

const TEACHERS: Teacher[] = [
  {
    id: "t1",
    name: "Ato Kebede Alemu",
    subjects: ["Physics"],
    exams_uploaded: 4,
    avg_alignment: 86,
    avg_clo_coverage: 74,
    students_count: 72,
    class_avg: 64,
    trend: "up",
    weak_areas: ["Electric Circuits", "Ohm's Law"],
  },
  {
    id: "t2",
    name: "W/ro Tigist Bekele",
    subjects: ["Mathematics"],
    exams_uploaded: 3,
    avg_alignment: 91,
    avg_clo_coverage: 88,
    students_count: 68,
    class_avg: 71,
    trend: "up",
    weak_areas: ["Linear Equations"],
  },
  {
    id: "t3",
    name: "Ato Dawit Girma",
    subjects: ["Chemistry"],
    exams_uploaded: 5,
    avg_alignment: 79,
    avg_clo_coverage: 82,
    students_count: 70,
    class_avg: 78,
    trend: "flat",
    weak_areas: [],
  },
  {
    id: "t4",
    name: "W/ro Mekdes Haile",
    subjects: ["Biology"],
    exams_uploaded: 2,
    avg_alignment: 68,
    avg_clo_coverage: 71,
    students_count: 65,
    class_avg: 74,
    trend: "down",
    weak_areas: ["Cell Division", "Genetics"],
  },
  {
    id: "t5",
    name: "Ato Bereket Tadesse",
    subjects: ["English"],
    exams_uploaded: 6,
    avg_alignment: 94,
    avg_clo_coverage: 91,
    students_count: 80,
    class_avg: 76,
    trend: "up",
    weak_areas: [],
  },
];

const RADAR_DATA = [
  { metric: "Exam Quality", value: 84 },
  { metric: "CLO Coverage", value: 77 },
  { metric: "Difficulty Balance", value: 81 },
  { metric: "Student Performance", value: 73 },
  { metric: "Curriculum Alignment", value: 88 },
];

function TrendIcon({ trend }: { trend: Teacher["trend"] }) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-chart-3" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function alignmentBadge(v: number) {
  if (v >= 85) return "bg-chart-3/15 text-chart-3 border-chart-3/20";
  if (v >= 70) return "bg-primary/15 text-primary border-primary/20";
  return "bg-destructive/15 text-destructive border-destructive/20";
}

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Teacher | null>(null);

  const filtered = TEACHERS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const schoolAvgAlignment = Math.round(
    TEACHERS.reduce((s, t) => s + t.avg_alignment, 0) / TEACHERS.length
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teachers</h1>
        <p className="text-muted-foreground mt-1">
          Assessment quality and student performance per teacher
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Teachers", value: String(TEACHERS.length), icon: Users },
          { label: "Avg Exam Alignment", value: `${schoolAvgAlignment}%`, icon: FileText },
          { label: "Exams This Term", value: String(TEACHERS.reduce((s, t) => s + t.exams_uploaded, 0)), icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="pt-5">
              <div className="bg-primary/10 p-2 rounded-lg w-fit">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers or subjects…"
              className="pl-9 bg-input border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card className="bg-card border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Teacher</TableHead>
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-muted-foreground text-center">Exams</TableHead>
                  <TableHead className="text-muted-foreground text-center">Alignment</TableHead>
                  <TableHead className="text-muted-foreground text-center">Class Avg</TableHead>
                  <TableHead className="text-muted-foreground text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className="border-border cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelected(t === selected ? null : t)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {t.subjects.map((s) => (
                          <Badge key={s} className="bg-muted text-muted-foreground border-border text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-foreground">{t.exams_uploaded}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs border ${alignmentBadge(t.avg_alignment)}`}>
                        {t.avg_alignment}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-foreground">{t.class_avg}%</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <TrendIcon trend={t.trend} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-primary/30">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {selected.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">{selected.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selected.subjects.join(", ")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="space-y-3">
                  {[
                    { label: "Exam Alignment", value: selected.avg_alignment },
                    { label: "CLO Coverage", value: selected.avg_clo_coverage },
                    { label: "Class Average", value: selected.class_avg },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">{value}%</span>
                      </div>
                      <Progress value={value} className="h-1.5 bg-muted" />
                    </div>
                  ))}
                </div>

                {/* Radar chart */}
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                    />
                    <Radar
                      dataKey="value"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.15}
                      strokeWidth={1.5}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                      itemStyle={{ color: "#F59E0B" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Weak areas */}
                {selected.weak_areas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Class weak areas
                    </p>
                    {selected.weak_areas.map((area) => (
                      <div key={area} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                        {area}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{selected.students_count}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{selected.exams_uploaded}</p>
                    <p className="text-xs text-muted-foreground">Exams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click a teacher row to see their detailed profile
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

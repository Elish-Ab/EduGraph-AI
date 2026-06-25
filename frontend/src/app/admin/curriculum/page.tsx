"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, BookOpen, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CLOItem {
  code: string;
  description: string;
  coverage: number;
}

interface TopicItem {
  name: string;
  clos: CLOItem[];
}

interface UnitItem {
  name: string;
  coverage: number;
  topics: TopicItem[];
}

interface SubjectItem {
  id: string;
  name: string;
  grade: number;
  overall_coverage: number;
  units: UnitItem[];
}

const CURRICULUM_DATA: SubjectItem[] = [
  {
    id: "s1",
    name: "Physics",
    grade: 11,
    overall_coverage: 74,
    units: [
      {
        name: "Electricity",
        coverage: 68,
        topics: [
          {
            name: "Electric Circuits",
            clos: [
              { code: "PHY11.1.1", description: "Analyze current, voltage, and resistance in a circuit", coverage: 42 },
              { code: "PHY11.1.2", description: "Apply Ohm's Law to solve circuit problems", coverage: 38 },
              { code: "PHY11.1.3", description: "Calculate equivalent resistance in series and parallel circuits", coverage: 55 },
            ],
          },
          {
            name: "Magnetism",
            clos: [
              { code: "PHY11.2.1", description: "Describe properties of magnetic fields", coverage: 82 },
              { code: "PHY11.2.2", description: "Explain electromagnetic induction", coverage: 71 },
            ],
          },
        ],
      },
      {
        name: "Mechanics",
        coverage: 91,
        topics: [
          {
            name: "Newton's Laws",
            clos: [
              { code: "PHY11.3.1", description: "Apply Newton's three laws to solve problems", coverage: 88 },
              { code: "PHY11.3.2", description: "Analyze forces in equilibrium", coverage: 94 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "s2",
    name: "Mathematics",
    grade: 11,
    overall_coverage: 81,
    units: [
      {
        name: "Algebra",
        coverage: 77,
        topics: [
          {
            name: "Linear Equations",
            clos: [
              { code: "MATH11.1.1", description: "Solve linear equations and inequalities", coverage: 58 },
              { code: "MATH11.1.2", description: "Graph linear functions and interpret slope", coverage: 72 },
            ],
          },
          {
            name: "Quadratic Equations",
            clos: [
              { code: "MATH11.2.1", description: "Solve quadratic equations using multiple methods", coverage: 83 },
            ],
          },
        ],
      },
      {
        name: "Trigonometry",
        coverage: 86,
        topics: [
          {
            name: "Trigonometric Functions",
            clos: [
              { code: "MATH11.3.1", description: "Apply sine, cosine, and tangent in problem-solving", coverage: 86 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "s3",
    name: "Chemistry",
    grade: 11,
    overall_coverage: 88,
    units: [
      {
        name: "Chemical Bonding",
        coverage: 88,
        topics: [
          {
            name: "Ionic & Covalent Bonds",
            clos: [
              { code: "CHEM11.1.1", description: "Distinguish between ionic and covalent bonding", coverage: 91 },
              { code: "CHEM11.1.2", description: "Predict bond type from electronegativity differences", coverage: 84 },
            ],
          },
        ],
      },
    ],
  },
];

function coverageColor(v: number) {
  if (v >= 80) return "text-chart-3";
  if (v >= 60) return "text-primary";
  return "text-destructive";
}

function coverageBadge(v: number) {
  if (v >= 80) return "bg-chart-3/15 text-chart-3 border-chart-3/20";
  if (v >= 60) return "bg-primary/15 text-primary border-primary/20";
  return "bg-destructive/15 text-destructive border-destructive/20";
}

function SubjectTree({ subject }: { subject: SubjectItem }) {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const toggleUnit = (name: string) =>
    setOpenUnits((p) => ({ ...p, [name]: !p[name] }));
  const toggleTopic = (name: string) =>
    setOpenTopics((p) => ({ ...p, [name]: !p[name] }));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                {subject.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Grade {subject.grade} · {subject.units.length} units</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${coverageColor(subject.overall_coverage)}`}>
              {subject.overall_coverage}%
            </p>
            <p className="text-xs text-muted-foreground">overall coverage</p>
          </div>
        </div>
        <Progress value={subject.overall_coverage} className="h-1.5 mt-2 bg-muted" />
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {subject.units.map((unit) => (
          <div key={unit.name} className="border border-border rounded-lg overflow-hidden">
            {/* Unit row */}
            <button
              onClick={() => toggleUnit(unit.name)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {openUnits[unit.name]
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{unit.name}</span>
              </div>
              <Badge className={`text-xs border ${coverageBadge(unit.coverage)}`}>
                {unit.coverage}% covered
              </Badge>
            </button>

            {/* Topics */}
            {openUnits[unit.name] && (
              <div className="border-t border-border bg-muted/10">
                {unit.topics.map((topic) => (
                  <div key={topic.name}>
                    <button
                      onClick={() => toggleTopic(`${unit.name}-${topic.name}`)}
                      className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {openTopics[`${unit.name}-${topic.name}`]
                          ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-sm text-foreground">{topic.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {topic.clos.length} CLOs
                      </span>
                    </button>

                    {/* CLOs */}
                    {openTopics[`${unit.name}-${topic.name}`] && (
                      <div className="px-8 pb-3 space-y-2">
                        {topic.clos.map((clo) => (
                          <div key={clo.code} className="bg-background/50 rounded-lg p-3 border border-border/50">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1">
                                {clo.coverage >= 70
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-chart-3 mt-0.5 shrink-0" />
                                  : <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />}
                                <div>
                                  <p className="text-xs font-mono text-muted-foreground">{clo.code}</p>
                                  <p className="text-xs text-foreground mt-0.5">{clo.description}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold shrink-0 ${coverageColor(clo.coverage)}`}>
                                {clo.coverage}%
                              </span>
                            </div>
                            <Progress value={clo.coverage} className="h-1 mt-2 bg-muted" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function CurriculumPage() {
  const [search, setSearch] = useState("");

  const filtered = CURRICULUM_DATA.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCLOs = CURRICULUM_DATA.flatMap((s) =>
    s.units.flatMap((u) => u.topics.flatMap((t) => t.clos))
  );
  const weakCLOs = totalCLOs.filter((c) => c.coverage < 60).length;
  const avgCoverage = Math.round(
    totalCLOs.reduce((sum, c) => sum + c.coverage, 0) / totalCLOs.length
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Curriculum Coverage</h1>
        <p className="text-muted-foreground mt-1">
          CLO mastery across all subjects — Grade 11
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total CLOs", value: String(totalCLOs.length), sub: "Across all subjects" },
          { label: "Avg CLO Coverage", value: `${avgCoverage}%`, sub: "School-wide" },
          { label: "Weak CLOs", value: String(weakCLOs), sub: "Below 60% coverage" },
        ].map(({ label, value, sub }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="pt-5">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects…"
          className="pl-9 bg-input border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Subject trees */}
      <div className="space-y-4">
        {filtered.map((subject) => (
          <SubjectTree key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSubjects } from "@/lib/queries";
import api from "@/lib/api";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(3, "Enter an exam title"),
  grade: z.coerce.number().min(9).max(12),
  subject_id: z.string().min(1, "Select a subject"),
  duration_minutes: z.coerce.number().min(10).default(60),
});

type UploadFormData = z.infer<typeof schema>;

const GRADES = [9, 10, 11, 12];

export default function UploadExamPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<"form" | "uploading" | "parsing" | "done">("form");
  const [error, setError] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number>(11);

  const { data: subjects = [] } = useSubjects(selectedGrade);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UploadFormData>({
    resolver: zodResolver(schema) as Resolver<UploadFormData>,
    defaultValues: { grade: 11, duration_minutes: 60 },
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type.includes("pdf") || dropped.name.endsWith(".docx"))) {
      setFile(dropped);
    }
  }, []);

  const onSubmit = async (data: UploadFormData) => {
    if (!file) { setError("Please upload a PDF or DOCX file."); return; }
    setError("");
    setStep("uploading");
    try {
      const formData = new window.FormData();
      formData.append("title", data.title);
      formData.append("subject_id", data.subject_id);
      formData.append("grade", String(data.grade));
      formData.append("duration_minutes", String(data.duration_minutes));
      formData.append("file", file);

      setStep("parsing");
      const res = await api.post("/exams", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStep("done");
      setTimeout(() => router.push(`/teacher/exams/${res.data.id}/verify`), 1200);
    } catch {
      setError("Upload failed. Please try again.");
      setStep("form");
    }
  };

  if (step !== "form") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="bg-card border-border w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            {step === "done" ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-chart-3 mx-auto" />
                <p className="font-semibold text-foreground">Exam uploaded successfully</p>
                <p className="text-sm text-muted-foreground">Redirecting to verification…</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="font-semibold text-foreground">
                  {step === "uploading" ? "Uploading exam…" : "AI is parsing questions…"}
                </p>
                {step === "parsing" && (
                  <p className="text-sm text-muted-foreground">
                    Extracting questions and mapping to CLOs. This takes ~30 seconds.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Exam</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF or DOCX. The AI will extract questions and verify CLO alignment automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <CardContent className="py-10 text-center">
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Drop your exam file here</p>
                <p className="text-xs text-muted-foreground mt-1">PDF or DOCX · or click to browse</p>
                <div className="flex justify-center gap-2 mt-3">
                  {["PDF", "DOCX"].map((f) => (
                    <Badge key={f} className="bg-muted text-muted-foreground border-border text-xs">{f}</Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Exam Details</CardTitle>
            <CardDescription>Help the AI verify alignment correctly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Exam title</Label>
              <Input placeholder="e.g. Physics — Electricity Unit Test" className="bg-input border-border" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select
                  defaultValue="11"
                  onValueChange={(v) => {
                    const g = Number(v);
                    setValue("grade", g);
                    setSelectedGrade(g);
                  }}
                >
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select onValueChange={(v) => setValue("subject_id", v as string)}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {subjects.length === 0 ? (
                      <SelectItem value="_none">No subjects for grade {selectedGrade}</SelectItem>
                    ) : (
                      subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.subject_id && <p className="text-xs text-destructive">{errors.subject_id.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" placeholder="60" className="bg-input border-border" {...register("duration_minutes")} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          Upload & Run AI Verification
        </Button>
      </form>
    </div>
  );
}

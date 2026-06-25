"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { mockSaveProfile } from "@/lib/mock-auth";
import { CAREER_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";

const GRADES = [9, 10, 11, 12];

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const [grade, setGrade] = useState<number>(profile?.grade ?? 11);
  const [career, setCareer] = useState(profile?.career_interest ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!career) { setError("Please select a career interest."); return; }
    setSaving(true);
    setError("");
    try {
      let savedProfile;
      try {
        const res = await api.post("/students/profile", { grade, career_interest: career });
        savedProfile = res.data.data;
      } catch {
        savedProfile = mockSaveProfile(user?.id ?? "local", grade, career);
      }
      setProfile(savedProfile);
      router.push("/dashboard");
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
        <p className="text-muted-foreground mt-1">
          Tell us your grade and career goal so we can personalize your learning path.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Academic Information</CardTitle>
          <CardDescription>Your grade affects which subjects and CLOs are relevant to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grade */}
          <div className="space-y-2">
            <Label>Current Grade</Label>
            <div className="flex gap-3">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    "w-14 h-14 rounded-xl border text-sm font-bold transition-all",
                    grade === g
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Career interest */}
          <div className="space-y-3">
            <Label>Career Interest</Label>
            <p className="text-xs text-muted-foreground">
              This helps us prioritize which subjects matter most for your future goal.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CAREER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCareer(opt.value)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                    career === opt.value
                      ? "border-primary bg-primary/15"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className={cn("text-sm font-medium", career === opt.value ? "text-primary" : "text-foreground")}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {career && (
            <div className="bg-muted/40 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">What this means:</span> EduGraph AI will
                highlight subjects and CLOs most relevant to{" "}
                <span className="text-foreground">{CAREER_OPTIONS.find(c => c.value === career)?.label}</span>{" "}
                in your gap analysis and study plan.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save profile and continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

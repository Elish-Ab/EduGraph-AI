"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { mockRegister } from "@/lib/mock-auth";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["student", "teacher"]),
  school_code: z.string().min(4, "Enter your school code"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      let user, token;
      try {
        const res = await api.post("/auth/register", {
          full_name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          school_code: data.school_code,
        });
        user = res.data.user;
        token = res.data.access_token;
      } catch {
        ({ user, token } = mockRegister(data));
      }
      login(user, token);
      document.cookie = `edugraph-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      if (user.role === "student") router.push("/profile");
      else router.push("/teacher/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-foreground">Create account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Join your school on EduGraph AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input placeholder="Abebe Kebede" className="bg-input border-border" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@school.edu.et" className="bg-input border-border" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" className="bg-input border-border" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>I am a</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  const val = v as "student" | "teacher";
                  setRole(val);
                  setValue("role", val);
                }}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>School code</Label>
              <Input placeholder="e.g. SCH001" className="bg-input border-border" {...register("school_code")} />
              {errors.school_code && <p className="text-xs text-destructive">{errors.school_code.message}</p>}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

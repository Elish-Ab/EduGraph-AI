"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { mockLogin, demoLogin } from "@/lib/mock-auth";
import { GraduationCap, BookOpen, Settings } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const DEMO_ROLES = [
  { role: "student" as const,  label: "Student View",      icon: GraduationCap, redirect: "/dashboard",         color: "border-primary/30 hover:border-primary hover:bg-primary/10 text-primary" },
  { role: "teacher" as const,  label: "Teacher View",      icon: BookOpen,       redirect: "/teacher/dashboard", color: "border-chart-2/30 hover:border-chart-2 hover:bg-chart-2/10 text-chart-2" },
  { role: "admin" as const,    label: "Admin View",        icon: Settings,       redirect: "/admin/dashboard",   color: "border-chart-3/30 hover:border-chart-3 hover:bg-chart-3/10 text-chart-3" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, setProfile } = useAuthStore();
  const [error, setError] = useState("");
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      let user, token;
      try {
        const res = await api.post("/auth/login", data);
        const u = res.data.user;
        user = { ...u, name: u.full_name, school_id: u.school_code };
        token = res.data.access_token;
      } catch {
        ({ user, token } = mockLogin(data.email, data.password));
      }
      login(user, token);
      document.cookie = `edugraph-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      if (user.role === "student") router.push("/dashboard");
      else if (user.role === "teacher") router.push("/teacher/dashboard");
      else router.push("/admin/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
  };

  const handleDemo = (role: "student" | "teacher" | "admin", redirect: string) => {
    setLoadingDemo(role);
    const { user, token, profile } = demoLogin(role);
    login(user, token);
    if (profile) setProfile(profile);
    document.cookie = `edugraph-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    router.push(redirect);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your EduGraph AI account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Demo quick-access */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick demo access
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ROLES.map(({ role, label, icon: Icon, redirect, color }) => (
              <button
                key={role}
                onClick={() => handleDemo(role, redirect)}
                disabled={!!loadingDemo}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-medium transition-all ${color} disabled:opacity-50`}
              >
                <Icon className="w-4 h-4" />
                {loadingDemo === role ? "Loading…" : label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or sign in with your account</span>
          <Separator className="flex-1 bg-border" />
        </div>

        {/* Regular login form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu.et"
              className="bg-input border-border"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-input border-border"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

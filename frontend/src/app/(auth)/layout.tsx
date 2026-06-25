"use client";

import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-foreground">EduGraph AI</span>
        </div>

        <div>
          <blockquote className="text-2xl font-medium text-foreground leading-relaxed">
            &ldquo;The system understands what you don&apos;t know, why you failed,
            and exactly what to study next.&rdquo;
          </blockquote>
          <p className="mt-4 text-muted-foreground text-sm">
            Offline-first academic intelligence for every school.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Students Supported", value: "2,400+" },
            { label: "Learning Gaps Identified", value: "18,000+" },
            { label: "Exams Verified", value: "340+" },
            { label: "Schools", value: "12" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Theme toggle — top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

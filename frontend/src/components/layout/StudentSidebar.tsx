"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  CalendarCheck,
  MessageSquare,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exams", label: "My Exams", icon: BookOpen },
  { href: "/gaps", label: "Learning Gaps", icon: Brain },
  { href: "/study-plan", label: "Study Plan", icon: CalendarCheck },
  { href: "/ai-tutor", label: "AI Tutor", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuthStore();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" />
          <span className="font-bold text-lg text-foreground">EduGraph AI</span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {user?.name?.charAt(0) ?? "S"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">Grade {profile?.grade ?? "—"}</p>
          </div>
        </div>
        {profile?.career_interest && (
          <Badge className="mt-2 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {profile.career_interest.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <ThemeToggle />
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

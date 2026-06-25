"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard, BookOpen, Users, LogOut, GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV = [
  { href: "/admin/dashboard", label: "School Overview", icon: LayoutDashboard },
  { href: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/admin/teachers", label: "Teachers", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-border flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" />
          <span className="font-bold text-lg text-foreground">EduGraph AI</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 ml-9">School Admin</p>
      </div>

      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {user?.name?.charAt(0) ?? "A"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">School Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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

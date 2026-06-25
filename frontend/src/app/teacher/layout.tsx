import { TeacherSidebar } from "@/components/layout/TeacherSidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <TeacherSidebar />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}

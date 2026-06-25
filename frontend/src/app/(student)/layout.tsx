import { StudentSidebar } from "@/components/layout/StudentSidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}

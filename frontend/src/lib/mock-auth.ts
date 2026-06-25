import type { User, StudentProfile } from "@/types";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  school_id: string;
}

const STORAGE_KEY = "edugraph_users";
const DEMO_TOKEN = "demo_token_edugraph";

export const DEMO_ACCOUNTS: { role: "student" | "teacher" | "admin"; label: string; user: User; profile?: StudentProfile }[] = [
  {
    role: "student",
    label: "Student",
    user: { id: "demo-student", name: "Abebe Kebede", email: "student@demo.et", role: "student", school_id: "SCH001" },
    profile: { user_id: "demo-student", grade: 11, career_interest: "electrical_engineering", current_avg: 68, target_score: 85 },
  },
  {
    role: "teacher",
    label: "Teacher",
    user: { id: "demo-teacher", name: "Ato Kebede Alemu", email: "teacher@demo.et", role: "teacher", school_id: "SCH001" },
  },
  {
    role: "admin",
    label: "School Admin",
    user: { id: "demo-admin", name: "W/ro Tigist Bekele", email: "admin@demo.et", role: "admin", school_id: "SCH001" },
  },
];

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function mockRegister(data: {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher";
  school_code: string;
}): { user: User; token: string } {
  const users = getUsers();
  if (users.find((u) => u.email === data.email)) {
    throw new Error("Email already registered.");
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    school_id: data.school_code,
  };
  saveUsers([...users, user]);
  const { password: _, ...publicUser } = user;
  return { user: publicUser as User, token: DEMO_TOKEN };
}

export function mockLogin(email: string, password: string): { user: User; token: string } {
  const users = getUsers();
  const found = users.find((u) => u.email === email && u.password === password);
  if (!found) throw new Error("Invalid email or password.");
  const { password: _, ...publicUser } = found;
  return { user: publicUser as User, token: DEMO_TOKEN };
}

export function demoLogin(role: "student" | "teacher" | "admin"): { user: User; token: string; profile?: StudentProfile } {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;
  if (account.profile) {
    localStorage.setItem(`edugraph_profile_${account.user.id}`, JSON.stringify(account.profile));
  }
  return { user: account.user, token: DEMO_TOKEN, profile: account.profile };
}

export function mockSaveProfile(userId: string, grade: number, careerInterest: string): StudentProfile {
  const profile: StudentProfile = {
    user_id: userId,
    grade,
    career_interest: careerInterest,
    current_avg: 68,
    target_score: 85,
  };
  localStorage.setItem(`edugraph_profile_${userId}`, JSON.stringify(profile));
  return profile;
}

export function mockGetProfile(userId: string): StudentProfile | null {
  try {
    const raw = localStorage.getItem(`edugraph_profile_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

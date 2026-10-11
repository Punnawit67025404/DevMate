export type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  work_mode: string;
  tags: string[];
  status: string;
  max_members: number;
  created_at: string;
  // เพิ่มจาก migration 0001 — optional เพราะแถวเก่าก่อนรัน SQL อาจยังไม่มีค่า
  timeline?: string;
  milestones?: { title: string; dueDate: string }[];
  tech_stack?: string[];
};

export type Profile = {
  id: string;
  display_name: string;
  bio: string;
  faculty: string;
  year: number;
  skills: { name: string; level: number }[];
  availability: string;
  portfolio_url: string;
  avatar_url?: string; // path ใน bucket avatars (ว่าง = ไม่มีรูป)
};

export type Application = {
  id: string;
  project_id: string;
  applicant_id: string;
  status: string;
  message: string;
  created_at: string;
  portfolio_link?: string;
};
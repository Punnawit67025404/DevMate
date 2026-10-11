// ==============================================================================
// types/index.ts
// Data Models กลางสำหรับโปรเจกต์ DevMate (ระดับนิสิตปี 3 เข้าใจง่าย)
// ==============================================================================

// ข้อมูลทักษะ/ความสามารถ
export interface Skill {
  id: string;
  name: string;
  level: number; // ระดับความเชี่ยวชาญ 20, 40, 60, 80, 100 (%)
  category?: string;
}

// ข้อมูลนิสิต / ผู้ใช้งาน
export interface User {
  id: string;
  name: string;
  email: string; // อีเมลมหาวิทยาลัย เช่น student@university.ac.th
  faculty: string; // คณะ
  year: number; // ชั้นปี 1-4
  bio: string; // แนะนำตัวสั้นๆ
  avatar?: string;
  avatarUrl?: string; // URL รูปโปรไฟล์ (ไม่มี = ใช้ตัวย่อชื่อใน avatar)
  skills: Skill[]; // รายการทักษะที่มี
  githubUrl?: string; // ลิงก์ GitHub
  behanceUrl?: string; // ลิงก์ Behance/Portfolio
  bookmarkedMemberIds?: string[]; // รหัสสมาชิกที่บันทึกไว้
}

// คำเชิญเข้าร่วมทีม
export interface TeamInvite {
  id: string;
  projectId: string;
  projectTitle: string;
  senderName: string;
  role: string;
  date: string;
  status: "pending" | "accepted" | "rejected";
}

// ข้อมูลโปรเจกต์
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string; // เช่น Web, Mobile, AI/ML, IoT, Game
  duration: string; // เช่น 1-3 เดือน, 1 ภาคการศึกษา
  timeline: string; // คำอธิบาย Timeline สรุป
  requiredSkills: string[]; // รายการทักษะที่ต้องการ
  maxMembers: number; // จำนวนสมาชิกสูงสุด
  currentMembers: number; // จำนวนสมาชิกปัจจุบัน
  status: "open" | "closed";
  milestones: {
    title: string;
    dueDate: string;
  }[];
  techStack: string[];
  ownerName: string;
  ownerId?: string; // id ผู้ใช้เจ้าของโปรเจกต์ (มีเมื่อข้อมูลมาจาก DB จริง ใช้เช็กว่าเราเป็นเจ้าของหรือไม่)
  createdAt: string;
}

// ข้อมูลใบสมัครเข้าร่วมทีม
export interface Application {
  id: string;
  projectId: string;
  applicantId: string;
  applicantName: string;
  applicantAvatarUrl?: string; // รูปผู้สมัคร (ถ้ามี) ใช้ในหน้า My Team ของเจ้าของ
  message: string;
  portfolioLink: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
}

// ข้อความในแชตทีม
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isMe: boolean;
}

// งานที่ต้องทำในทีม (Task)
export interface TeamTask {
  id: string;
  title: string;
  assignee: string;
  assigneeId?: string; // id ผู้รับผิดชอบ (ไม่มี = ยังไม่มอบหมาย)
  status: "completed" | "in_progress" | "pending";
  priority: "high" | "medium" | "low";
  dueDate: string;
}

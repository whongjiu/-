export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: "admin" | "member" | "leader";
  classId: number | null;
}

export interface UserWithClass {
  id: number;
  username: string;
  name: string;
  role: string;
  classId: number | null;
  class: { id: number; name: string } | null;
  createdAt: Date;
}

export interface ClassWithCount {
  id: number;
  name: string;
  _count: { users: number };
}

export interface DutyScheduleWithRelations {
  id: number;
  dayOfWeek: number;
  memberId: number;
  classId: number;
  dormitoryId: number;
  member: { id: number; name: string };
  class: { id: number; name: string };
  dormitory: { id: number; building: string };
}

export interface RollCallWithAttendances {
  id: number;
  leaderId: number;
  classId: number;
  names: string;
  enrolled: boolean;
  createdAt: Date;
  class: { id: number; name: string };
  leader: { id: number; name: string };
  attendances: {
    id: number;
    studentName: string;
    status: string;
    images: string | null;
  }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

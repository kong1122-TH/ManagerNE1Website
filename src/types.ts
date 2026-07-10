/**
 * Shared Type Definitions for PEA District 1 Manager's Club Applet
 */

export interface News {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  images?: string[];
  category: string; // e.g., "ข่าวประชาสัมพันธ์", "กิจกรรมชมรม", "ข่าวสารทั่วไป"
  author: string;
}

export interface Member {
  id: string;
  name: string;
  position: string; // e.g., ผู้จัดการ กฟส.อุดรธานี, รองผู้จัดการ
  peaOffice: string; // การไฟฟ้าสาขา
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  role: string; // e.g., "ประธานชมรม", "รองประธานชมรม", "เลขานุการชมรม", "เหรัญญิก", "กรรมการ", "สมาชิก"
  imageUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  category: string; // e.g., "ประชุม", "สัมมนา", "กิจกรรม", "CSR"
}

export interface Message {
  id: string;
  senderName: string;
  senderPosition: string;
  message: string;
  timestamp: string; // ISO String
}

export interface AppConfig {
  hasGoogleCredentials: boolean;
  googleSheetId: string;
  googleDriveFolderId: string;
}

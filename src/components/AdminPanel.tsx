import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Unlock,
  Plus,
  Edit,
  Trash2,
  Database,
  Sparkles,
  RefreshCw,
  Users,
  Calendar,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
  X,
  PlusCircle,
  FileText,
  Upload,
  Image
} from "lucide-react";
import { News, Member, CalendarEvent, AppConfig } from "../types";

// @ts-ignore
import clubLogo from "../assets/images/regenerated_image_1783494444543.jpg";

interface AdminPanelProps {
  newsList: News[];
  members: Member[];
  events: CalendarEvent[];
  config: AppConfig | null;
  onNewsChange: () => void;
  onMembersChange: () => void;
  onEventsChange: () => void;
}

export default function AdminPanel({
  newsList,
  members,
  events,
  config,
  onNewsChange,
  onMembersChange,
  onEventsChange
}: AdminPanelProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLogginIn, setIsLoggingIn] = useState(false);

  // Admin Internal Section Tab
  const [activeTab, setActiveTab] = useState<"news" | "members" | "calendar" | "ai_assistant">("news");

  // Fetching States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CRUD Forms State
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsDate, setNewsDate] = useState("");
  const [newsCategory, setNewsCategory] = useState("กิจกรรมชมรม");
  const [newsAuthor, setNewsAuthor] = useState("ฝ่ายประชาสัมพันธ์ชมรมผู้จัดการ กฟฉ.1");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsImages, setNewsImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);

  // Member Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memName, setMemName] = useState("");
  const [memPosition, setMemPosition] = useState("");
  const [memOffice, setMemOffice] = useState("");
  const [memEmail, setMemEmail] = useState("");
  const [memPhone, setMemPhone] = useState("");
  const [memStatus, setMemStatus] = useState<"Active" | "Inactive">("Active");
  const [memRole, setMemRole] = useState("สมาชิก");
  const [memImageUrl, setMemImageUrl] = useState("");
  const [uploadingMemImage, setUploadingMemImage] = useState(false);
  const [memUploadError, setMemUploadError] = useState("");
  const [memDragActive, setMemDragActive] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  // Calendar Event Form State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState("กิจกรรม");
  const [showEventForm, setShowEventForm] = useState(false);

  // AI Assistant Drafting Form State
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeyPoints, setAiKeyPoints] = useState("");
  const [aiDraftedText, setAiDraftedText] = useState("");
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");

  // Check login session
  useEffect(() => {
    const token = sessionStorage.getItem("pea_admin_token");
    if (token === "admin-session-token-pea") {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("pea_admin_token", data.token);
        setIsAdmin(true);
      } else {
        setLoginError(data.error || "รหัสผ่านแอดมินไม่ถูกต้อง");
      }
    } catch (err) {
      setLoginError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pea_admin_token");
    setIsAdmin(false);
    setPasscode("");
  };

  // ---------------- NEWS CRUD OPERATIONS ----------------
  const handleEditNewsClick = (news: News) => {
    setSelectedNewsId(news.id);
    setNewsTitle(news.title);
    setNewsContent(news.content);
    setNewsDate(news.date);
    setNewsCategory(news.category);
    setNewsAuthor(news.author);
    setNewsImageUrl(news.imageUrl || "");
    setNewsImages(news.images || (news.imageUrl ? [news.imageUrl] : []));
    setShowNewsForm(true);
  };

  const handleCreateNewsClick = () => {
    setSelectedNewsId(null);
    setNewsTitle("");
    setNewsContent("");
    setNewsDate(new Date().toISOString().split("T")[0]);
    setNewsCategory("กิจกรรมชมรม");
    setNewsAuthor("ฝ่ายประชาสัมพันธ์ชมรมผู้จัดการ กฟฉ.1");
    setNewsImageUrl("");
    setNewsImages([]);
    setUploadError("");
    setShowNewsForm(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("กรุณาเลือกเฉพาะไฟล์รูปภาพ (เช่น png, jpeg, gif)");
      return;
    }

    setUploadingImage(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`อัปโหลดล้มเหลว: รหัสสถานะ ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || "อัปโหลดรูปภาพล้มเหลว");
      }

      const imageUrl = data.imageUrl;

      setNewsImages(prev => {
        const updated = [...prev, imageUrl];
        if (!newsImageUrl && updated.length > 0) {
          setNewsImageUrl(updated[0]);
        }
        return updated;
      });
    } catch (err: any) {
      console.error("Upload Error:", err);
      setUploadError(err.message || "อัปโหลดรูปภาพล้มเหลว");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      title: newsTitle,
      content: newsContent,
      date: newsDate,
      category: newsCategory,
      author: newsAuthor,
      imageUrl: newsImages[0] || newsImageUrl || "",
      images: newsImages,
    };

    try {
      let url = "/api/news";
      let method = "POST";

      if (selectedNewsId) {
        url = `/api/news/${selectedNewsId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowNewsForm(false);
        onNewsChange();
        alert(selectedNewsId ? "แก้ไขข่าวสารสำเร็จ" : "บันทึกและเผยแพร่ข่าวสารสำเร็จ");
      } else {
        alert("ไม่สามารถดำเนินการได้ในขณะนี้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async (id: string, title: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบข่าวเรื่อง "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        onNewsChange();
        alert("ลบข่าวสารเสร็จสิ้น");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // ---------------- MEMBERS CRUD OPERATIONS ----------------
  const handleMemImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMemUploadError("กรุณาเลือกเฉพาะไฟล์รูปภาพ (เช่น png, jpeg, gif)");
      return;
    }

    setUploadingMemImage(true);
    setMemUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`อัปโหลดล้มเหลว: รหัสสถานะ ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || "อัปโหลดรูปภาพล้มเหลว");
      }

      const imageUrl = data.imageUrl;
      setMemImageUrl(imageUrl);
    } catch (err: any) {
      console.error("Upload Error:", err);
      setMemUploadError(err.message || "อัปโหลดรูปภาพล้มเหลว");
    } finally {
      setUploadingMemImage(false);
    }
  };

  const handleMemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleMemImageUpload(e.target.files[0]);
    }
  };

  const handleMemDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setMemDragActive(true);
    } else if (e.type === "dragleave") {
      setMemDragActive(false);
    }
  };

  const handleMemDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMemDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleMemImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleEditMemberClick = (member: Member) => {
    setSelectedMemberId(member.id);
    setMemName(member.name);
    setMemPosition(member.position);
    setMemOffice(member.peaOffice);
    setMemEmail(member.email);
    setMemPhone(member.phone);
    setMemStatus(member.status);
    setMemRole(member.role);
    setMemImageUrl(member.imageUrl || "");
    setMemUploadError("");
    setShowMemberForm(true);
  };

  const handleCreateMemberClick = () => {
    setSelectedMemberId(null);
    setMemName("");
    setMemPosition("");
    setMemOffice("");
    setMemEmail("");
    setMemPhone("");
    setMemStatus("Active");
    setMemRole("สมาชิก");
    setMemImageUrl("");
    setMemUploadError("");
    setShowMemberForm(true);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: memName,
      position: memPosition,
      peaOffice: memOffice,
      email: memEmail,
      phone: memPhone,
      status: memStatus,
      role: memRole,
      imageUrl: memImageUrl,
    };

    try {
      let url = "/api/members";
      let method = "POST";

      if (selectedMemberId) {
        url = `/api/members/${selectedMemberId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowMemberForm(false);
        onMembersChange();
        alert(selectedMemberId ? "แก้ไขข้อมูลสมาชิกสำเร็จ" : "เพิ่มสมาชิกชมรมคนใหม่สำเร็จ");
      } else {
        alert("เกิดปัญหาในการบันทึกข้อมูลสมาชิก");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการประมวลผล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`คุณต้องการลบคุณ "${name}" ออกจากทำเนียบสมาชิกใช่หรือไม่?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        onMembersChange();
        alert("ลบสมาชิกเรียบร้อยแล้ว");
      }
    } catch (err) {
      alert("ไม่สามารถลบสมาชิกได้");
    }
  };

  // ---------------- CALENDAR CRUD OPERATIONS ----------------
  const handleEditEventClick = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventDate(event.date);
    setEventTime(event.time);
    setEventLocation(event.location);
    setEventCategory(event.category);
    setShowEventForm(true);
  };

  const handleCreateEventClick = () => {
    setSelectedEventId(null);
    setEventTitle("");
    setEventDescription("");
    setEventDate(new Date().toISOString().split("T")[0]);
    setEventTime("09:00");
    setEventLocation("กฟฉ.1");
    setEventCategory("กิจกรรม");
    setShowEventForm(true);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      category: eventCategory,
    };

    try {
      let url = "/api/calendar";
      let method = "POST";

      if (selectedEventId) {
        url = `/api/calendar/${selectedEventId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowEventForm(false);
        onEventsChange();
        alert(selectedEventId ? "แก้ไขแผนกิจกรรมสำเร็จ" : "บันทึกเพิ่มกิจกรรมในปฏิทินสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกตารางกิจกรรม");
      }
    } catch (err) {
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ปฏิทินได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบกิจกรรม "${title}" ออกจากตารางแผนงาน?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (res.ok) {
        onEventsChange();
        alert("ลบข้อมูลกิจกรรมสำเร็จ");
      }
    } catch (err) {
      alert("ลบไม่สำเร็จ");
    }
  };

  // ---------------- AI NEWS DRAFTING (GEMINI) ----------------
  const handleAiDraftNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      alert("กรุณาระบุหัวข้อข่าวเพื่อเป็นแนวทางให้ AI");
      return;
    }

    setIsAiDrafting(true);
    setAiDraftedText("");
    setAiSuccessMessage("");

    try {
      const res = await fetch("/api/ai/draft-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, keyPoints: aiKeyPoints }),
      });

      const data = await res.json();
      if (res.ok && data.draft) {
        setAiDraftedText(data.draft);
        setAiSuccessMessage("AI เขียนร่างข่าวสำเร็จแล้ว! ตรวจสอบเนื้อหาและคัดลอกนำไปเผยแพร่ด้านล่าง");
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลร่างข่าว");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI");
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleApplyAiDraftToForm = () => {
    if (!aiDraftedText) return;
    
    // Switch to News tab, Open the Create form and fill with AI draft
    setNewsTitle(aiTopic);
    setNewsContent(aiDraftedText);
    setNewsDate(new Date().toISOString().split("T")[0]);
    setNewsCategory("กิจกรรมชมรม");
    setNewsAuthor("ฝ่ายประชาสัมพันธ์ชมรมผู้จัดการ กฟฉ.1");
    setNewsImageUrl("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800");
    
    setSelectedNewsId(null);
    setActiveTab("news");
    setShowNewsForm(true);
  };

  // Locked View
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 text-center"
        >
          {/* Logo Header Graphic */}
          <div className="relative mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-purple-100 p-1 mb-2">
            <img 
              src={clubLogo} 
              alt="โลโก้ชมรมผู้จัดการ กฟฉ.1" 
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">ระบบเข้าสู่ระบบผู้ดูแลระบบ (Admin)</h2>
            <p className="text-slate-400 text-xs font-light px-4 leading-relaxed">
              สิทธิ์เฉพาะเจ้าหน้าที่แอดมินชมรม เพื่อจัดการเผยแพร่ข่าวสาร ทำเนียบสมาชิก และปฏิทินกิจกรรมชมรม ผ่านหน้าจอควบคุมจุดเดียว
            </p>
          </div>

          {/* Login input */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                placeholder="กรอกรหัสผ่านแอดมิน"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-pea-purple/20 focus:border-pea-purple"
                required
              />
              {loginError && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" /> {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLogginIn}
              className="w-full py-3 bg-pea-purple hover:bg-pea-darkpurple text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLogginIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" /> ปลดล็อกระบบแอดมิน
                </>
              )}
            </button>
          </form>

          {/* Guide to security */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-light">
            <Database className="w-3.5 h-3.5 text-pea-amber" />
            <span>ซิงโครไนซ์ข้อมูลโดยตรงแบบเรียลไทม์</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard Workspace View
  return (
    <div className="space-y-6">
      {/* Header and Sync Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-100 text-pea-purple text-[10px] font-bold rounded-full mb-1">
            <Unlock className="w-3 h-3" /> ผู้ดูแลระบบพร้อมใช้งาน
          </span>
          <h2 className="text-2xl font-bold text-slate-800">แผงควบคุมแอดมินแบบรวมศูนย์</h2>
          <p className="text-slate-500 text-xs">จัดการฐานข้อมูลและเผยแพร่ข่าวสารได้สะดวกรวดเร็วในหน้าจอเดียว</p>
        </div>

        {/* Sync Info Block */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            <Database className="w-4 h-4 text-pea-purple" />
            <span>
              สถานะซิงก์:{" "}
              <strong className={config?.hasGoogleCredentials ? "text-emerald-600" : "text-amber-600"}>
                {config?.hasGoogleCredentials ? "เชื่อมต่อ Google Sheet" : "ระบบจำลองทดแทน (Local DB)"}
              </strong>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-rose-500 hover:bg-rose-50 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
          >
            ออกจากระบบแอดมิน
          </button>
        </div>
      </div>

      {/* Admin Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation / Sidebar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 h-fit">
          <p className="text-[10px] font-bold text-slate-400 uppercase px-3 pb-1 tracking-wider">แผงจัดการข้อมูล</p>
          
          <button
            onClick={() => { setActiveTab("news"); setShowNewsForm(false); }}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all flex items-center gap-2.5 ${
              activeTab === "news" ? "bg-pea-purple text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Newspaper className="w-4 h-4" /> จัดการข่าวสารและกิจกรรม
          </button>

          <button
            onClick={() => { setActiveTab("members"); setShowMemberForm(false); }}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all flex items-center gap-2.5 ${
              activeTab === "members" ? "bg-pea-purple text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> จัดการรายชื่อสมาชิก
          </button>

          <button
            onClick={() => { setActiveTab("calendar"); setShowEventForm(false); }}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all flex items-center gap-2.5 ${
              activeTab === "calendar" ? "bg-pea-purple text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Calendar className="w-4 h-4" /> จัดการปฏิทินกิจกรรม
          </button>

          <p className="text-[10px] font-bold text-slate-400 uppercase px-3 pt-3 pb-1 tracking-wider">ระบบช่วยประชาสัมพันธ์</p>
          
          <button
            onClick={() => { setActiveTab("ai_assistant"); }}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all flex items-center gap-2.5 ${
              activeTab === "ai_assistant" ? "bg-amber-500 text-white shadow-md" : "text-slate-600 hover:bg-amber-50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-pea-amber" /> AI ผู้ช่วยร่างข่าวประชาสัมพันธ์
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3">
          {/* TAB 1: NEWS MANAGEMENT */}
          {activeTab === "news" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              {!showNewsForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">จัดการบทความและกิจกรรมชมรม</h3>
                      <p className="text-slate-500 text-xs">แก้ไข ลบ หรือ เขียนข่าวประชาสัมพันธ์ใหม่ขึ้นเว็บชมรม</p>
                    </div>
                    <button
                      onClick={handleCreateNewsClick}
                      className="px-4 py-2 bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
                    >
                      <PlusCircle className="w-4 h-4" /> เขียนข่าวใหม่
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {newsList.map((news) => (
                      <div key={news.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-grow">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded">
                            {news.category}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1 truncate">{news.title}</h4>
                          <p className="text-xs text-slate-400 font-light mt-0.5">{news.date} • โดย {news.author}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleEditNewsClick(news)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(news.id, news.title)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* NEWS FORM */
                <form onSubmit={handleNewsSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800">
                      {selectedNewsId ? "แก้ไขบทความประชาสัมพันธ์" : "เขียนและเผยแพร่ข่าวใหม่"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewsForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">หัวข้อข่าว</label>
                      <input
                        type="text"
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-pea-purple focus:border-pea-purple"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-medium">หมวดหมู่</label>
                        <select
                          value={newsCategory}
                          onChange={(e) => setNewsCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-pea-purple"
                        >
                          <option value="กิจกรรมชมรม">กิจกรรมชมรม</option>
                          <option value="ข่าวสารทั่วไป">ข่าวสารทั่วไป</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-medium">ผู้โพสต์ข่าว</label>
                        <input
                          type="text"
                          value={newsAuthor}
                          onChange={(e) => setNewsAuthor(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-pea-purple"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1 max-w-xs">
                      <label className="text-xs text-slate-500 font-medium">วันที่เผยแพร่</label>
                      <input
                        type="date"
                        value={newsDate}
                        onChange={(e) => setNewsDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-pea-purple"
                        required
                      />
                    </div>

                    {/* Modern Multiple Image File Upload / Selector zone */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                        <Image className="w-4 h-4 text-pea-purple" />
                        <span>รูปภาพข่าวประชาสัมพันธ์ (สามารถเพิ่มได้หลายภาพสำหรับการสไลด์โชว์)</span>
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1.5">
                        {/* Drag & Drop Zone */}
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`md:col-span-2 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                            dragActive 
                              ? "border-pea-purple bg-purple-50" 
                              : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
                          }`}
                          onClick={() => document.getElementById("news-image-file")?.click()}
                        >
                          <input 
                            type="file" 
                            id="news-image-file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden" 
                          />
                          
                          {uploadingImage ? (
                            <div className="space-y-2 text-slate-500">
                              <RefreshCw className="w-8 h-8 text-pea-purple animate-spin mx-auto" />
                              <p className="text-xs font-medium">กำลังอัปโหลดรูปภาพไปยังคลังไฟล์...</p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 text-slate-500">
                              <Upload className="w-8 h-8 text-pea-purple/60 mx-auto" />
                              <div className="text-xs">
                                <span className="font-semibold text-pea-purple hover:underline">คลิกเพื่ออัปโหลดไฟล์ภาพ</span> หรือลากไฟล์มาวางที่นี่
                              </div>
                              <p className="text-[10px] text-slate-400 font-light">รองรับไฟล์ JPG, PNG, GIF (สูงสุด 10MB) - อัปโหลดทีละภาพเพื่อต่อกัน</p>
                            </div>
                          )}

                          {uploadError && (
                            <p className="text-rose-500 text-[10px] mt-2 font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {uploadError}
                            </p>
                          )}
                        </div>

                        {/* Manual URL Input to add to gallery */}
                        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 bg-slate-50/50">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ใส่ลิงก์รูปภาพโดยตรง:</span>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                id="manual-image-url"
                                placeholder="https://images.unsplash.com/..."
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] focus:ring-1 focus:ring-pea-purple"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = (e.currentTarget as HTMLInputElement).value.trim();
                                    if (val) {
                                      setNewsImages(prev => [...prev, val]);
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById("manual-image-url") as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    setNewsImages(prev => [...prev, input.value.trim()]);
                                    input.value = "";
                                  }
                                }}
                                className="px-2.5 py-1 bg-pea-purple text-white text-[10px] font-bold rounded-xl hover:bg-opacity-90"
                              >
                                เพิ่ม
                              </button>
                            </div>
                            <span className="text-[9px] text-slate-400 font-light">กด Enter หรือปุ่มเพิ่ม เพื่อแทรกลงในรายการรูปภาพ</span>
                          </div>

                          <div className="text-[10px] text-slate-500 bg-purple-50/50 border border-purple-100/50 rounded-lg p-2 font-light">
                            มีรูปภาพทั้งหมด <span className="font-bold text-pea-purple">{newsImages.length}</span> ภาพในปัจจุบัน
                          </div>
                        </div>
                      </div>

                      {/* Display image gallery of newsImages */}
                      {newsImages.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">รายการรูปภาพในสไลด์โชว์ (ลาก/ลบ เพื่อจัดการได้):</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {newsImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white group">
                                <img 
                                  src={imgUrl} 
                                  alt={`Preview ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewsImages(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all scale-90 hover:scale-100 shadow-sm"
                                    title="ลบรูปภาพนี้"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-[9px] font-bold text-white rounded">
                                  {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">เนื้อหาข่าวประชาสัมพันธ์แบบละเอียด</label>
                    <textarea
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-pea-purple font-light leading-relaxed"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNewsForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-md hover:shadow"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...
                        </>
                      ) : (
                        "บันทึกและเผยแพร่ข่าว"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS MANAGEMENT */}
          {activeTab === "members" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              {!showMemberForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">จัดการทำเนียบสมาชิกชมรม</h3>
                      <p className="text-slate-500 text-xs">เพิ่ม แก้ไขข้อมูล หรือนำสมาชิกที่ย้าย/พ้นสภาพออกจากฐานข้อมูล</p>
                    </div>
                    <button
                      onClick={handleCreateMemberClick}
                      className="px-4 py-2 bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow"
                    >
                      <Plus className="w-4 h-4" /> เพิ่มรายชื่อสมาชิก
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">ชื่อ-สกุล</th>
                          <th className="py-3 px-4">ตำแหน่งในชมรม / หน้าที่</th>
                          <th className="py-3 px-4">การไฟฟ้าสาขา</th>
                          <th className="py-3 px-4">เบอร์โทร</th>
                          <th className="py-3 px-4 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-800">{member.name}</td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="font-medium text-pea-purple">{member.position}</span>
                              <span className="block text-[10px] text-slate-400">บทบาท: {member.role}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">{member.peaOffice}</td>
                            <td className="py-3 px-4 text-slate-500">{member.phone || "-"}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleEditMemberClick(member)}
                                  className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(member.id, member.name)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* MEMBER FORM */
                <form onSubmit={handleMemberSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800">
                      {selectedMemberId ? "แก้ไขรายชื่อสมาชิก" : "เพิ่มรายชื่อสมาชิกใหม่"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowMemberForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">ชื่อจริง-นามสกุล</label>
                      <input
                        type="text"
                        value={memName}
                        onChange={(e) => setMemName(e.target.value)}
                        placeholder="เช่น นายมานัส ชนะดี"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">ตำแหน่งในการไฟฟ้า</label>
                      <input
                        type="text"
                        list="positionOptions"
                        value={memPosition}
                        onChange={(e) => setMemPosition(e.target.value)}
                        placeholder="เลือกจากรายการ หรือ พิมพ์กรอกเองได้เลย..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                      <datalist id="positionOptions">
                        <option value="ผจก.กฟจ.(12)(CEO)" />
                        <option value="ผจก.กฟจ.(11)(CEO)" />
                        <option value="รจก.กฟจ.(11)" />
                        <option value="รจก.กฟจ.(10)" />
                        <option value="ผจก.กฟส.(11)" />
                        <option value="รจก(ท)กฟส.(10)" />
                        <option value="รจก(ล)กฟส.(10)" />
                        <option value="ผจก.กฟส.(10)" />
                        <option value="ชจก.(ท)กฟส.(9)" />
                        <option value="ชจก.(ล)กฟส.(9)" />
                        <option value="ผจก.กฟส.(9)" />
                        <option value="ผจก.กฟส.(8)" />
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">การไฟฟ้าสาขา (สังกัด)</label>
                      <input
                        type="text"
                        value={memOffice}
                        onChange={(e) => setMemOffice(e.target.value)}
                        placeholder="เช่น กฟส.หนองหาน หรือ กฟจ.อุดรธานี"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">เบอร์โทรศัพท์ติดต่อ</label>
                      <input
                        type="text"
                        value={memPhone}
                        onChange={(e) => setMemPhone(e.target.value)}
                        placeholder="เช่น 081-XXX-XXXX"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">อีเมล (PEA Co.th)</label>
                      <input
                        type="email"
                        value={memEmail}
                        onChange={(e) => setMemEmail(e.target.value)}
                        placeholder="username.sur@pea.co.th"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">บทบาทในชมรม</label>
                      <select
                        value={memRole}
                        onChange={(e) => setMemRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1"
                      >
                        <option value="สมาชิกชมรม">สมาชิกชมรม</option>
                        <option value="ประธานที่ปรึกษากิตติมศักดิ์">ประธานที่ปรึกษากิตติมศักดิ์</option>
                        <option value="ที่ปรึกษากิตติมศักดิ์">ที่ปรึกษากิตติมศักดิ์</option>
                        <option value="ประธานที่ปรึกษา">ประธานที่ปรึกษา</option>
                        <option value="รองประธานที่ปรึกษา">รองประธานที่ปรึกษา</option>
                        <option value="ที่ปรึกษา">ที่ปรึกษา</option>
                        <option value="ประธานชมรม">ประธานชมรม</option>
                        <option value="รองประธานชมรม">รองประธานชมรม</option>
                        <option value="ประธานคณะกรรมการ">ประธานคณะกรรมการ</option>
                        <option value="กรรมการ">กรรมการ</option>
                        <option value="กรรมการและเลขานุการ">กรรมการและเลขานุการ</option>
                        <option value="เลขานุการ">เลขานุการ</option>
                        <option value="ผู้ช่วยเลขานุการ">ผู้ช่วยเลขานุการ</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">สถานะ</label>
                      <select
                        value={memStatus}
                        onChange={(e) => setMemStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1"
                      >
                        <option value="Active">กำลังปฏิบัติงาน (Active)</option>
                        <option value="Inactive">เกษียณ/ย้ายแล้ว (Inactive)</option>
                      </select>
                    </div>
                  </div>

                  {/* Member Profile Photo Zone */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-pea-purple" />
                      <span>รูปภาพประจำตัวของสมาชิก (Profile Image)</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1.5">
                      {/* Drag & Drop Zone */}
                      <div 
                        onDragEnter={handleMemDrag}
                        onDragOver={handleMemDrag}
                        onDragLeave={handleMemDrag}
                        onDrop={handleMemDrop}
                        className={`md:col-span-2 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                          memDragActive 
                            ? "border-pea-purple bg-purple-50" 
                            : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
                        }`}
                        onClick={() => document.getElementById("member-image-file")?.click()}
                      >
                        <input 
                          type="file" 
                          id="member-image-file" 
                          accept="image/*"
                          onChange={handleMemFileChange}
                          className="hidden" 
                        />
                        
                        {uploadingMemImage ? (
                          <div className="space-y-2 text-slate-500">
                            <RefreshCw className="w-6 h-6 text-pea-purple animate-spin mx-auto" />
                            <p className="text-xs font-medium">กำลังอัปโหลดรูปภาพสมาชิก...</p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-slate-500">
                            <Upload className="w-6 h-6 text-pea-purple/60 mx-auto" />
                            <div className="text-xs">
                              <span className="font-semibold text-pea-purple hover:underline">คลิกเพื่ออัปโหลดภาพสมาชิก</span> หรือลากไฟล์มาวาง
                            </div>
                            <p className="text-[10px] text-slate-400 font-light">รองรับไฟล์ JPG, PNG, GIF (สูงสุด 5MB)</p>
                          </div>
                        )}

                        {memUploadError && (
                          <p className="text-rose-500 text-[10px] mt-2 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {memUploadError}
                          </p>
                        )}
                      </div>

                      {/* Preview and direct URL */}
                      <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {memImageUrl ? (
                              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pea-purple/30 shadow-sm bg-white">
                                <img 
                                  src={memImageUrl} 
                                  alt="Member Profile" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setMemImageUrl("")}
                                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                  title="ลบรูปภาพ"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                                <Users className="w-6 h-6 opacity-40" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ภาพประจำตัว:</span>
                            <span className="text-[10px] text-slate-400 font-light">
                              {memImageUrl ? "อัปโหลดเรียบร้อยแล้ว" : "ยังไม่มีภาพประจำตัว"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-medium">หรือใส่ลิงก์รูปภาพโดยตรง (URL):</span>
                          <input
                            type="text"
                            value={memImageUrl}
                            onChange={(e) => setMemImageUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] focus:ring-1 focus:ring-pea-purple"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowMemberForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-semibold rounded-xl shadow-md hover:shadow"
                    >
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลสมาชิก"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: CALENDAR EVENT MANAGEMENT */}
          {activeTab === "calendar" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              {!showEventForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">จัดการปฏิทินแผนงานกิจกรรม</h3>
                      <p className="text-slate-500 text-xs">กำหนดนัดหมายประชุม จัดสัมมนา และงานช่วยเหลือประชาชนประจำปี</p>
                    </div>
                    <button
                      onClick={handleCreateEventClick}
                      className="px-4 py-2 bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow"
                    >
                      <Plus className="w-4 h-4" /> เพิ่มกิจกรรมใหม่
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {events.map((event) => (
                      <div key={event.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-grow">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded">
                            {event.category}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1 truncate">{event.title}</h4>
                          <p className="text-xs text-slate-400 font-light mt-0.5">{event.date} เวลา {event.time} น. • ณ {event.location}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleEditEventClick(event)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.title)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* EVENT FORM */
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800">
                      {selectedEventId ? "แก้ไขกำหนดนัดหมาย" : "เพิ่มวาระกิจกรรมปฏิทิน"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">ชื่อกิจกรรม/วาระ</label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="เช่น ประชุมบอร์ดสามัคคี หรือ ตรวจระบบจำหน่ายกระแสไฟฟ้า"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">หมวดหมู่กิจกรรม</label>
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1"
                      >
                        <option value="ประชุม">การประชุม/บอร์ดบริหาร</option>
                        <option value="CSR">งาน CSR / จิตอาสาช่วยประชาชน</option>
                        <option value="กิจกรรม">กิจกรรมสัมพันธ์กีฬา/สันทนาการ</option>
                        <option value="สัมมนา">วิชาการ / สัมมนาพัฒนาประสิทธิภาพ</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">วันที่กำหนด</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">เวลาเริ่ม (น.)</label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        placeholder="เช่น 09:30"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">สถานที่จัดกิจกรรม</label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="ห้องประชุมชั้น 3 กฟฉ.1"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">คำอธิบายเพิ่มเติม</label>
                    <textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-light"
                      placeholder="เป้าหมายของนัดหมายนี้และผู้มีสิทธิ์เข้าร่วมประชุม..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-semibold rounded-xl shadow-md"
                    >
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกปฏิทินกิจกรรม"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: AI WRITER HELPER */}
          {activeTab === "ai_assistant" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-1.5 bg-amber-50 text-amber-500 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">AI ผู้ช่วยเขียนข่าวประชาสัมพันธ์</h3>
                  <p className="text-slate-500 text-xs">ระบุหัวข้อสั้นๆ และให้ Gemini AI ร่างข้อความประชาสัมพันธ์ที่เป็นทางการระดับพรีเมียมให้ทันที</p>
                </div>
              </div>

              <form onSubmit={handleAiDraftNews} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-semibold">หัวข้อข่าวที่อยากร่าง (Topic)</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="เช่น ชมรมผู้จัดการ กฟฉ.1 จัดวิ่งมินิมาราธอนระดมทุนช่วยผู้ประสบอุทกภัย"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-semibold">ประเด็นสำคัญที่ต้องการเน้น (Key Points / Bullet points)</label>
                  <textarea
                    value={aiKeyPoints}
                    onChange={(e) => setAiKeyPoints(e.target.value)}
                    rows={3}
                    placeholder="เช่น จัดขึ้นในวันที่ 12 สิงหาคม 2569 ณ สวนสาธารณะหนองประจักษ์ จ.อุดรธานี คาดว่าจะมีผู้จัดการเข้าร่วมวิ่งกว่า 80 ท่าน นำเงินส่งบริจาคสภากาชาด"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isAiDrafting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isAiDrafting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> กำลังประมวลผลวิเคราะห์ร่างข่าวสารด้วย Gemini AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> เริ่มให้ AI ร่างข่าวด่วนระดับมืออาชีพ
                    </>
                  )}
                </button>
              </form>

              {/* AI Draft Result Area */}
              {aiDraftedText && (
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <FileText className="w-4 h-4" /> ผลลัพธ์จากการร่างโดยปัญญาประดิษฐ์ (Gemini Model)
                    </span>
                    <button
                      onClick={handleApplyAiDraftToForm}
                      className="px-3 py-1.5 bg-pea-purple hover:bg-pea-darkpurple text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> นำร่างข่าวนี้ไปกรอกแบบฟอร์มเพื่อเผยแพร่ทันที
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed font-light whitespace-pre-wrap">
                    {aiDraftedText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Users,
  Calendar as CalendarIcon,
  MessageSquare,
  Settings,
  Zap,
  Phone,
  HelpCircle,
  Menu,
  X,
  RefreshCw,
  Database,
  Lock
} from "lucide-react";

// Types
import { News, Member, CalendarEvent, Message, AppConfig } from "./types";

// Sub-components
import HomeNews from "./components/HomeNews";
import MemberDirectory from "./components/MemberDirectory";
import CalendarDashboard from "./components/CalendarDashboard";
import SecureForum from "./components/SecureForum";
import AdminPanel from "./components/AdminPanel";

// Firebase Integration
import { collection, onSnapshot, query, orderBy, limit, addDoc } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";

// @ts-ignore
import clubLogo from "./assets/images/regenerated_image_1783494444543.jpg";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "members" | "calendar" | "forum" | "admin">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Database States
  const [newsList, setNewsList] = useState<News[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isForumLoading, setIsForumLoading] = useState(false);
  const [fbUser, setFbUser] = useState<any>(null);

  // Fetch all core datasets
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [newsRes, membersRes, eventsRes, configRes] = await Promise.all([
        fetch("/api/news"),
        fetch("/api/members"),
        fetch("/api/calendar"),
        fetch("/api/config"),
      ]);

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNewsList(newsData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      if (membersRes.ok) setMembers(await membersRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (configRes.ok) setConfig(await configRes.json());
    } catch (error) {
      console.error("Error loading application datasets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages separately (since it might be locked/unlocked frequently)
  const fetchMessages = async () => {
    setIsForumLoading(true);
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Failed to load forum messages:", err);
    } finally {
      setIsForumLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
    });
    return unsubscribe;
  }, []);

  // Handle auto-sign-in for Firebase Auth when session tokens exist
  useEffect(() => {
    const handleAuth = async () => {
      const token = sessionStorage.getItem("pea_member_token");
      const adminToken = sessionStorage.getItem("pea_admin_token");
      if ((token || adminToken) && !auth.currentUser) {
        try {
          await signInAnonymously(auth);
          console.log("Firebase Auth signed in anonymously.");
        } catch (err) {
          console.warn("Could not sign in anonymously to Firebase Auth:", err);
        }
      }
    };
    handleAuth();
  }, [activeTab]);

  // Real-time Firestore sync for forum messages
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const token = sessionStorage.getItem("pea_member_token");
    const adminToken = sessionStorage.getItem("pea_admin_token");
    const isUnlocked = token || adminToken;

    if (isUnlocked && auth.currentUser) {
      const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(100));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreMsgs: Message[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreMsgs.push({
            id: data.id || docSnap.id,
            senderName: data.senderName,
            senderPosition: data.senderPosition,
            message: data.message,
            timestamp: data.timestamp,
          } as Message);
        });
        
        if (firestoreMsgs.length > 0) {
          firestoreMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setMessages(firestoreMsgs);
        }
      }, (error) => {
        console.warn("Firestore snapshot failed, checking credentials or fallback Sheets API:", error);
        fetchMessages();
      });
    } else {
      if (isUnlocked) {
        fetchMessages();
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab, auth.currentUser]);

  // Post new secure forum message
  const handleSendMessage = async (senderName: string, senderPosition: string, messageText: string) => {
    try {
      // 1. Post to Sheets API (Updates Sheets and Fallback Local DB)
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderPosition,
          message: messageText,
        }),
      });

      let savedMessage: Message | null = null;
      if (res.ok) {
        savedMessage = await res.json();
      }

      // 2. Post to Firebase Firestore
      const msgId = savedMessage?.id || `msg-${Date.now()}`;
      const msgObj = {
        id: msgId,
        senderName,
        senderPosition,
        message: messageText,
        timestamp: savedMessage?.timestamp || new Date().toISOString()
      };

      try {
        if (auth.currentUser) {
          await addDoc(collection(db, "messages"), msgObj);
        }
      } catch (fbErr) {
        console.error("Failed to write message to Firestore, but saved to Sheets:", fbErr);
        handleFirestoreError(fbErr, OperationType.CREATE, "messages");
      }

      if (savedMessage) {
        setMessages((prev) => {
          if (prev.some(m => m.id === savedMessage!.id)) return prev;
          return [...prev, savedMessage!];
        });
        return savedMessage;
      }
      throw new Error("Failed to send message to Google Sheets");
    } catch (error) {
      console.error("Message send error:", error);
      throw error;
    }
  };

  // Navigation Links
  const navItems = [
    { id: "home", label: "ข่าวสารกิจกรรม", icon: Home },
    { id: "members", label: "ทำเนียบสมาชิก", icon: Users },
    { id: "calendar", label: "ปฏิทินกิจกรรม", icon: CalendarIcon },
    { id: "forum", label: "ติดต่อสื่อสารภายใน", icon: MessageSquare, isSecure: true },
    { id: "admin", label: "ระบบแอดมิน", icon: Settings },
  ];

  const handleTabChange = (tabId: any) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* PEA Corporate Header Banner */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Left: PEA Brand Logo style */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-purple-100 p-0.5 overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <img 
                  src={clubLogo} 
                  alt="โลโก้ชมรมผู้จัดการ กฟฉ.1" 
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-tight">
                  ชมรมผู้จัดการ กฟฉ.1
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-light leading-none mt-0.5">
                  การไฟฟ้าส่วนภูมิภาค เขต 1 (ภาคตะวันออกเฉียงเหนือ) จังหวัดอุดรธานี
                </p>
              </div>
            </div>

            {/* Middle: Desktop Navigation links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                      isActive
                        ? "bg-purple-50 text-pea-purple"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-pea-purple" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {item.isSecure && (
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" title="ต้องการรหัสผ่านความปลอดภัย" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: Cloud Integration Status & Refresh */}
            <div className="flex items-center gap-3">

              <button
                onClick={fetchAllData}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-pea-purple hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                title="รีเฟรชข้อมูลทั้งหมด"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-slate-200 shadow-lg"
          >
            <div className="px-4 pt-2 pb-6 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full px-4 py-3 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-colors ${
                      isActive
                        ? "bg-purple-50 text-pea-purple"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.isSecure && <Lock className="w-3.5 h-3.5 text-rose-500 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body Stage Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && newsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-purple-100 p-1 relative">
              <img 
                src={clubLogo} 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -inset-1.5 border-2 border-pea-purple/10 border-t-pea-purple rounded-full animate-spin"></span>
            </div>
            <p className="text-xs font-light text-slate-400">กำลังเชื่อมโยงฐานข้อมูลข่าวสารและทำเนียบสมาชิกชมรม...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Active Workspace View Dispatcher */}
            {activeTab === "home" && (
              <HomeNews
                newsList={newsList}
                members={members}
                events={events}
                onTabChange={handleTabChange}
              />
            )}
            {activeTab === "members" && <MemberDirectory members={members} />}
            {activeTab === "calendar" && <CalendarDashboard events={events} />}
            {activeTab === "forum" && (
              <SecureForum
                messages={messages}
                onSendMessage={handleSendMessage}
                onRefresh={fetchMessages}
                isLoading={isForumLoading}
              />
            )}
            {activeTab === "admin" && (
              <AdminPanel
                newsList={newsList}
                members={members}
                events={events}
                config={config}
                onNewsChange={fetchAllData}
                onMembersChange={fetchAllData}
                onEventsChange={fetchAllData}
              />
            )}
          </motion.div>
        )}
      </main>

      {/* Corporate Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 text-center text-xs font-light space-y-2 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-300 font-normal">ชมรมผู้จัดการการไฟฟ้าส่วนภูมิภาค เขต 1 (ภาคตะวันออกเฉียงเหนือ) จังหวัดอุดรธานี (กฟฉ.1)</p>
          <p className="mt-1">
            ที่อยู่สำนักงาน: 123 หมู่ 5 บ้านหนองหัวหมู ตำบลนาดี อำเภอเมือง จังหวัดอุดรธานี 41000 • ช่องทางสื่อสารด่วนเฉพาะภายในชมรม
          </p>
          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-center gap-1.5 text-slate-500 text-[10px]">
            <Database className="w-3.5 h-3.5 text-pea-gold/40" />
            <span>เชื่อมโยงระบบฐานข้อมูลและคลังรูปภาพแบบคลาวด์เนทีฟผ่าน Google Sheet API และ Drive API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Lock, Unlock, Send, ShieldAlert, MessageSquare, AlertTriangle, RefreshCw, UserCheck } from "lucide-react";
import { Message } from "../types";

// @ts-ignore
import clubLogo from "../assets/images/regenerated_image_1783494444543.jpg";

interface SecureForumProps {
  messages: Message[];
  onSendMessage: (senderName: string, senderPosition: string, message: string) => Promise<any>;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function SecureForum({ messages, onSendMessage, onRefresh, isLoading }: SecureForumProps) {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Form State
  const [senderName, setSenderName] = useState("");
  const [senderPosition, setSenderPosition] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Try to read verification from session memory
  useEffect(() => {
    const token = sessionStorage.getItem("pea_member_token");
    if (token === "member-session-token-pea" || token === "admin-session-token-pea") {
      setIsUnlocked(true);
    }
  }, []);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (isUnlocked) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUnlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      const res = await fetch("/api/member/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("pea_member_token", data.token);
        setIsUnlocked(true);
        onRefresh(); // fetch fresh messages
      } else {
        setError(data.error || "รหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderPosition.trim() || !newMessage.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(senderName, senderPosition, newMessage);
      setNewMessage(""); // Clear message field
    } catch (err) {
      alert("ไม่สามารถส่งข้อความได้ในขณะนี้");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pea_member_token");
    setIsUnlocked(false);
    setPasscode("");
  };

  const formatThaiTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " น.";
    } catch {
      return "";
    }
  };

  const formatThaiDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit"
      });
    } catch {
      return "";
    }
  };

  // Locked UI View
  if (!isUnlocked) {
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
            <h2 className="text-xl font-bold text-slate-800">ระบบติดต่อสื่อสารภายในเฉพาะสมาชิก</h2>
            <p className="text-slate-400 text-xs font-light leading-relaxed px-4">
              ช่องทางการสนทนา ปรึกษาหารือ และสั่งการนี้มีความเป็นส่วนตัวและปลอดภัยสูงสุด กรุณากรอกรหัสผ่านสมาชิกชมรม กฟฉ.1 เพื่อดำเนินการต่อ
            </p>
          </div>

          {/* Unlock Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                placeholder="กรอกรหัสผ่านสมาชิก"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-pea-purple/20 focus:border-pea-purple"
                required
              />
              {error && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-pea-purple hover:bg-pea-darkpurple text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" /> ยืนยันรหัสผ่านเพื่อเข้าใช้งาน
                </>
              )}
            </button>
          </form>

          {/* Secure disclaimer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-light">
            <ShieldAlert className="w-3.5 h-3.5 text-pea-amber" />
            <span>ช่องทางนี้เข้ารหัสความปลอดภัยระดับเครือข่าย</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Unlocked Chat UI
  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-[75vh]">
      {/* Sidebar: Posting Guidelines & Info */}
      <div className="w-full md:w-80 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">เข้าถึงระบบสำเร็จ</h3>
              <p className="text-emerald-600 text-[10px] font-semibold">ช่องทางสนทนาภายใน</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-500 font-light leading-relaxed">
            <p className="font-semibold text-slate-700">ข้อควรปฏิบัติสำหรับสมาชิก:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>รักษามารยาทและความเป็นส่วนตัวของข้อมูลการไฟฟ้า</li>
              <li>ใช้ในการสั่งการหรือหารือเรื่องเร่งด่วนเท่านั้น</li>
              <li>ข้อมูลทั้งหมดจะถูกซิงก์เข้าระบบ Google Sheet แบบปลอดภัย</li>
              <li>เพื่อความปลอดภัย กรุณากดปุ่มออกจากระบบเมื่อใช้งานเสร็จ</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-500 text-xs font-semibold rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" /> ออกจากระบบความปลอดภัย
        </button>
      </div>

      {/* Main Board: Chat History and Text Input */}
      <div className="flex-grow bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
        {/* Board Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-pea-purple" />
            <h3 className="font-bold text-slate-800 text-sm">กระดานข้อความสื่อสารสมาชิก</h3>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-pea-purple hover:bg-slate-100 rounded-lg transition-all"
            title="รีเฟรชข้อความ"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Chat Bubbles List */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <p className="text-xs">กำลังโหลดข้อความเข้ารหัสความปลอดภัย...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-light">ยังไม่มีการส่งข้อความปรึกษาภายในชมรม</p>
              <p className="text-[10px] text-slate-400">ร่วมส่งข้อความเป็นคนแรกด้วยฟอร์มด้านล่าง</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col space-y-1.5 max-w-[85%] bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-bold text-slate-800 text-xs">{msg.senderName}</span>
                    <span className="text-[10px] text-pea-purple font-medium">{msg.senderPosition}</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed font-light break-words">{msg.message}</p>
                  <div className="flex justify-end gap-1.5 text-[9px] text-slate-400 font-light">
                    <span>{formatThaiDate(msg.timestamp)}</span>
                    <span>{formatThaiTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form Footer */}
        <form onSubmit={handleSubmitMessage} className="p-4 border-t border-slate-100 bg-white flex-shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="ชื่อผู้ส่ง (เช่น ผู้จัดการวิรุตม์)"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pea-purple focus:border-pea-purple font-light"
              required
            />
            <input
              type="text"
              placeholder="ตำแหน่ง/สาขา (เช่น ผู้จัดการ กฟส.อุดรธานี)"
              value={senderPosition}
              onChange={(e) => setSenderPosition(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pea-purple focus:border-pea-purple font-light"
              required
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="พิมพ์ข้อความด่วนที่ต้องการสื่อสารภายใน..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pea-purple/20 focus:border-pea-purple font-light"
              required
            />
            <button
              type="submit"
              disabled={isSending}
              className="px-4 bg-pea-purple hover:bg-pea-darkpurple text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold hidden sm:inline">ส่ง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

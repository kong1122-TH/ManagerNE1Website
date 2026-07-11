import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  User,
  ArrowRight,
  X,
  Sparkles,
  Search,
  MessageSquare,
  Users,
  Shield,
  Zap,
  Lock,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  Building,
  Share2,
  Check
} from "lucide-react";
import { News, Member, CalendarEvent } from "../types";

interface HomeNewsProps {
  newsList: News[];
  members: Member[];
  events: CalendarEvent[];
  onTabChange: (tabId: "home" | "members" | "calendar" | "forum" | "admin") => void;
}

export default function HomeNews({ newsList, members, events, onTabChange }: HomeNewsProps) {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedNewsId, setCopiedNewsId] = useState<string | null>(null);
  const [showAllNewsList, setShowAllNewsList] = useState<boolean>(false);
  const [memberStartIndex, setMemberStartIndex] = useState<number>(0);

  // Parse newsId from URL and open it if present
  React.useEffect(() => {
    if (newsList && newsList.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const newsId = params.get("newsId");
      if (newsId) {
        const found = newsList.find(n => String(n.id) === newsId);
        if (found) {
          setSelectedNews(found);
          setActiveImageIdx(0);
        }
      } else if (!sessionStorage.getItem("hasAutoOpenedLatestNews")) {
        setSelectedNews(newsList[0]);
        setActiveImageIdx(0);
        sessionStorage.setItem("hasAutoOpenedLatestNews", "true");
      }
    }
  }, [newsList]);

  // Auto slideshow for selected news images
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedNews) {
      const imagesCount = selectedNews.images && selectedNews.images.length > 0 
        ? selectedNews.images.length 
        : (selectedNews.imageUrl ? 1 : 1);
        
      if (imagesCount > 1) {
        interval = setInterval(() => {
          setActiveImageIdx((prev) => (prev === imagesCount - 1 ? 0 : prev + 1));
        }, 3500); // 3.5 seconds per slide
      }
    }
    return () => clearInterval(interval);
  }, [selectedNews]);

  // Auto-rotate quick members list
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (searchTerm === "" && members.length > 3) {
      interval = setInterval(() => {
        setMemberStartIndex((prev) => (prev + 1) % members.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [searchTerm, members.length]);

  const handleShare = (news: News) => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?newsId=${encodeURIComponent(news.id)}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedNewsId(news.id);
      setTimeout(() => {
        setCopiedNewsId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSelectNews = (news: News) => {
    setSelectedNews(news);
    setActiveImageIdx(0);
  };

  const formatThaiDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatThaiDateShort = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  // Featured / Hero News (Latest news item)
  const featuredNews = newsList[0] || {
    id: "welcome-hero",
    title: "ชมรมผู้จัดการ กฟภ. กฟฉ.1 ยินดีต้อนรับสมาชิกทุกท่าน",
    content: "ศูนย์กลางการสื่อสาร พัฒนาความร่วมมือ และยกระดับการบริหารงานการบริการจำหน่ายกระแสไฟฟ้าอย่างมีประสิทธิภาพและเสถียรภาพ เพื่อสร้างความพึงพอใจสูงสุดให้กับประชาชนในพื้นที่ 7 จังหวัดอีสานตอนบน",
    date: new Date().toISOString(),
    category: "กิจกรรมชมรม",
    author: "ฝ่ายประชาสัมพันธ์ชมรมผู้จัดการ กฟฉ.1",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"
  };

  // Recent Updates (Next 3 news items)
  const recentUpdates = newsList.slice(1, 4);

  // Quick Member Search list (rotating when empty, filtering when typing)
  let filteredMembers: Member[] = [];
  if (searchTerm) {
    filteredMembers = members
      .filter((member) => {
        const target = searchTerm.toLowerCase();
        return (
          member.name.toLowerCase().includes(target) ||
          member.position.toLowerCase().includes(target) ||
          member.peaOffice.toLowerCase().includes(target)
        );
      })
      .slice(0, 3);
  } else if (members.length > 0) {
    for (let i = 0; i < Math.min(3, members.length); i++) {
      filteredMembers.push(members[(memberStartIndex + i) % members.length]);
    }
  }

  // Dynamically generate a 14-day calendar view starting from the Sunday of the current week
  const todayDateObj = new Date();
  const currentDayOfWeek = todayDateObj.getDay();
  const startDate = new Date(todayDateObj);
  startDate.setDate(todayDateObj.getDate() - currentDayOfWeek);

  const calendarDays = Array.from({ length: 14 }).map((_, i) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const dayEvents = events.filter(e => e.date === dateStr);
    const hasEvent = dayEvents.length > 0;
    
    let isPurple = false;
    let isOrange = false;
    
    if (hasEvent) {
      const cat = dayEvents[0].category;
      if (cat === "CSR" || cat === "สัมมนา") isOrange = true;
      else isPurple = true;
    }
    
    const isToday = current.getDate() === todayDateObj.getDate() && 
                    current.getMonth() === todayDateObj.getMonth() && 
                    current.getFullYear() === todayDateObj.getFullYear();
                    
    return {
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === todayDateObj.getMonth(),
      hasEvent,
      isPurple,
      isOrange,
      isToday,
      dateStr
    };
  });

  // Filter and sort events to find upcoming/nearest ones chronologically starting from today
  const getUpcomingEvents = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const futureOrToday = events.filter(e => e.date >= todayStr);
    
    // Sort ascending (closest date/time first)
    const sorted = [...(futureOrToday.length > 0 ? futureOrToday : events)].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
    
    return sorted;
  };

  const miniEvents = getUpcomingEvents().slice(0, 2);

  // Find club president details dynamically
  const president = members.find(m => m.role === "ประธานชมรม" || m.role === "ประธานชมรมฯ") || {
    name: "นายสมภพ วรเดช",
    position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคจังหวัดอุดรธานี",
    peaOffice: "กฟจ.อุดรธานี",
    imageUrl: ""
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* HERO NEWS SECTION (Large Bento - col-span-8) */}
        <div 
          onClick={() => {
            if (newsList.length > 0) {
              handleSelectNews(newsList[0]);
            }
          }}
          className="lg:col-span-8 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 rounded-3xl overflow-hidden relative shadow-lg group cursor-pointer h-[400px] flex flex-col justify-end p-8 border border-purple-800/20"
        >
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0 opacity-45 group-hover:scale-102 transition-transform duration-700 ease-out">
            <img 
              src={featuredNews.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"} 
              alt={featuredNews.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Gradient protection shield */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
          
          {/* Sparkles glow effect */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-10 right-10 z-20">
            <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              ข่าวประชาสัมพันธ์ล่าสุด
            </span>
          </div>

          {/* Text details inside featured hero */}
          <div className="relative z-20 space-y-3">
            <div className="flex items-center gap-4 text-xs text-purple-200">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-pea-gold" />
                {formatThaiDate(featuredNews.date)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-pea-gold" />
                โดย {featuredNews.author}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight tracking-tight group-hover:text-pea-gold transition-colors">
              {featuredNews.title}
            </h2>

            <p className="text-purple-100/85 text-xs sm:text-sm font-light leading-relaxed max-w-2xl line-clamp-2">
              {featuredNews.content}
            </p>

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-pea-gold text-xs font-semibold group-hover:translate-x-1.5 transition-transform duration-300">
                <span>อ่านเนื้อหาข่าวฉบับเต็ม</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              
              {featuredNews.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(featuredNews as News);
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white hover:text-pea-gold text-xs font-medium rounded-xl flex items-center gap-1.5 border border-white/15 transition-all shadow-sm cursor-pointer z-30"
                  title="แชร์ลิงก์ข่าว"
                >
                  {copiedNewsId === featuredNews.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-pea-gold" />
                      <span className="text-pea-gold font-bold text-[11px]">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">แชร์ข่าว</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CLUB PRESIDENT PROFILE CARD (Small Bento - col-span-4) */}
        <div 
          onClick={() => onTabChange("members")}
          className="lg:col-span-4 bg-gradient-to-br from-white via-slate-50/50 to-purple-50/15 rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group relative overflow-hidden lg:h-[400px]"
        >
          {/* Decorative subtle background circle */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-100/30 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-pea-gold/10 rounded-full blur-xl pointer-events-none"></div>

          {/* President's Photo */}
          <div className="flex-shrink-0 relative mb-4">
            {president.imageUrl ? (
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-pea-purple/40 shadow-lg bg-slate-50 relative z-10 transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={president.imageUrl} 
                  alt={president.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-pea-purple/10 to-indigo-50 border-2 border-purple-100 flex items-center justify-center text-pea-purple shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-105">
                <Users className="w-16 h-16 opacity-60" />
              </div>
            )}
            {/* Crown or President badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pea-gold to-amber-500 text-purple-950 text-[10px] font-extrabold px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 z-20 whitespace-nowrap border border-white/40">
              👑 ประธานชมรมผู้จัดการ กฟฉ.1
            </div>
          </div>

          {/* President's Name and Details */}
          <div className="space-y-1.5 relative z-10 max-w-[240px]">
            <h4 className="text-lg font-extrabold text-slate-800 leading-snug group-hover:text-pea-purple transition-colors">
              {president.name}
            </h4>
            <p className="text-xs text-slate-500 font-semibold leading-tight line-clamp-2">
              {president.position}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              {president.peaOffice}
            </p>
          </div>
        </div>

        {/* RECENT UPDATES (Long Bento - col-span-4 row-span-2) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all duration-300">
          <div className="space-y-4 flex-grow">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-pea-purple" /> ข่าวสารและกิจกรรมถัดไป
              </h3>
              <button 
                onClick={() => setShowAllNewsList(true)}
                className="text-pea-purple text-xs font-bold hover:underline"
              >
                ทั้งหมด
              </button>
            </div>

            {recentUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-1">
                <Users className="w-8 h-8 opacity-25" />
                <p className="text-xs font-light">ยังไม่มีข่าวประชาสัมพันธ์เพิ่มเติม</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUpdates.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleSelectNews(item)}
                    className="flex gap-4 items-start group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  >
                    <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
                      <img 
                        src={item.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=150"} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[10px] font-bold text-pea-purple">
                          {formatThaiDateShort(item.date)}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                          className="text-[9px] text-slate-400 hover:text-pea-purple flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="คัดลอกลิงก์ข่าว"
                        >
                          {copiedNewsId === item.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">แชร์แล้ว</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-2.5 h-2.5" />
                              <span>แชร์</span>
                            </>
                          )}
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-pea-darkpurple transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secure Forum Link Box */}
          <div className="bg-gradient-to-r from-purple-950 to-indigo-950 rounded-2xl p-4 border border-purple-800/30 text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-pea-gold uppercase tracking-widest flex items-center gap-1">
                <Lock className="w-3 h-3 text-pea-gold" /> Secure Portal
              </span>
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
            </div>
            <p className="text-[11px] text-purple-100 font-light leading-relaxed">
              ช่องทางการสนทนา ปรึกษาหารือ และสั่งการภายในเฉพาะสมาชิกชมรม กฟฉ.1 เข้ารหัสความปลอดภัยสูงสุด
            </p>
            <button 
              onClick={() => onTabChange("forum")}
              className="w-full bg-pea-purple hover:bg-pea-darkpurple text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow transition-all duration-300"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>เข้าสู่ระบบสื่อสารภายใน</span>
            </button>
          </div>
        </div>

        {/* ACTIVITIES CALENDAR DASHBOARD (Medium Bento - col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                <CalendarIcon className="w-4.5 h-4.5 text-pea-purple" /> ปฏิทินกำหนดการ
              </h3>
              <button 
                onClick={() => onTabChange("calendar")}
                className="text-pea-purple text-xs font-semibold hover:underline flex items-center"
              >
                ดูปฏิทิน <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-50 pb-1">
              <span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2.5">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`h-7 sm:h-8 flex flex-col items-center justify-center text-xs font-semibold rounded-lg border transition-all ${
                    !day.isCurrentMonth 
                      ? "text-slate-300 border-transparent" 
                      : day.isPurple 
                      ? "bg-purple-100 text-purple-700 border-purple-200 shadow-sm font-bold" 
                      : day.isOrange 
                      ? "bg-orange-100 text-orange-700 border-orange-200 shadow-sm font-bold" 
                      : "text-slate-700 border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer"
                  }`}
                  title={day.hasEvent ? "มีกำหนดการประชุมในวันนี้" : ""}
                >
                  {day.day}
                  {day.hasEvent && <span className="w-1 h-1 bg-current rounded-full mt-0.5"></span>}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule list */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">กิจกรรมถัดไป:</p>
            {miniEvents.length === 0 ? (
              <p className="text-slate-400 text-xs font-light py-1">ไม่มีวาระกิจกรรมเร่งด่วนในสัปดาห์นี้</p>
            ) : (
              <div className="space-y-2">
                {miniEvents.map((event, idx) => (
                  <div 
                    key={event.id}
                    onClick={() => onTabChange("calendar")}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className={`w-1 h-8 rounded-full ${idx === 0 ? "bg-purple-600" : "bg-orange-500"}`}></div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-normal truncate group-hover:text-pea-purple transition-colors">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-light mt-1 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className="font-semibold text-pea-purple">{formatThaiDateShort(event.date)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {event.time} น.</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {event.location}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTION / MEMBER SEARCH (Medium Bento - col-span-3) */}
        <div className="lg:col-span-3 bg-purple-50 rounded-3xl border border-purple-100 p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300">
          <div className="space-y-3 flex-grow">
            <h3 className="font-bold text-base text-purple-950 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-pea-purple" /> ค้นหาทำเนียบด่วน
            </h3>
            
            {/* Search input inside bento */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ สังกัด..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-pea-purple/20 focus:border-pea-purple font-light"
              />
              <Search className="w-3.5 h-3.5 text-purple-400 absolute right-3 top-2.5" />
            </div>

            {/* Live Filter list */}
            <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1 scrollbar-none">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px] font-light">
                  ไม่พบรายชื่อตรงกัน
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div 
                    key={member.id}
                    onClick={() => onTabChange("members")}
                    className="bg-white p-2.5 rounded-xl border border-purple-100 flex items-center gap-2.5 hover:border-pea-purple cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-pea-purple text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        member.name.substring(0, 2)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{member.name}</p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">{member.peaOffice} • {member.position}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => onTabChange("members")}
            className="w-full bg-white border border-purple-300 text-pea-purple text-xs font-bold py-2 rounded-xl hover:bg-pea-purple hover:text-white hover:border-pea-purple transition-all shadow-sm"
          >
            เปิดทำเนียบผู้จัดการทั้งหมด
          </button>
        </div>

      </div>

      {/* Detail Modal Dialog for selected news */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Banner (Dynamic Slideshow with multiple images) */}
              {(() => {
                const slideshowImages = selectedNews.images && selectedNews.images.length > 0 
                  ? selectedNews.images 
                  : (selectedNews.imageUrl ? [selectedNews.imageUrl] : ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"]);
                
                return (
                  <>
                    <div className="relative h-64 sm:h-96 bg-slate-900 overflow-hidden flex-shrink-0 group">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={activeImageIdx}
                          src={slideshowImages[activeImageIdx]}
                          alt={`${selectedNews.title} - ภาพที่ ${activeImageIdx + 1}`}
                          initial={{ opacity: 0, scale: 1.02 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </AnimatePresence>

                      {/* Left/Right Navigation Arrows if there is more than 1 image */}
                      {slideshowImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx((prev) => (prev === 0 ? slideshowImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-md z-20"
                            title="ภาพก่อนหน้า"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx((prev) => (prev === slideshowImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-md z-20"
                            title="ภาพถัดไป"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 pointer-events-none"></div>
                      
                      {/* Dots indicator */}
                      {slideshowImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-25 bg-black/35 backdrop-blur-xs py-1 px-2.5 rounded-full">
                          {slideshowImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIdx(idx);
                              }}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                activeImageIdx === idx ? "bg-pea-gold w-3" : "bg-white/65 hover:bg-white"
                              }`}
                              title={`ไปที่ภาพที่ ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Title and Category Overlay */}
                      <div className="absolute bottom-5 left-5 right-5 text-white space-y-2 z-20 pointer-events-none">
                        <span className="inline-block px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                          {selectedNews.category}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight drop-shadow-md">
                          {selectedNews.title}
                        </h2>
                      </div>

                      {/* Indicator text (e.g. 1 / 3) */}
                      {slideshowImages.length > 1 && (
                        <div className="absolute top-4 right-14 z-20 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                          ภาพที่ {activeImageIdx + 1} / {slideshowImages.length}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail strip underneath slide if multiple images */}
                    {slideshowImages.length > 1 && (
                      <div className="bg-slate-50 p-3 border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-thin">
                        {slideshowImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                              activeImageIdx === idx 
                                ? "border-pea-purple ring-1 ring-pea-purple/30 scale-98" 
                                : "border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`Thumbnail ${idx + 1}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Modal Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-pea-purple" />
                    <span className="font-semibold text-slate-700">วันที่ข่าว:</span>
                    <span>{formatThaiDate(selectedNews.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-pea-purple" />
                    <span className="font-semibold text-slate-700">ผู้เผยแพร่:</span>
                    <span>{selectedNews.author}</span>
                  </div>
                </div>

                <div className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap font-light">
                  {selectedNews.content}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleShare(selectedNews)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-pea-purple text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-purple-200 cursor-pointer"
                  title="คัดลอกลิงก์แชร์ข่าว"
                >
                  {copiedNewsId === selectedNews.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                      <span className="text-emerald-600 font-extrabold">คัดลอกลิงก์ข่าวสำเร็จ!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-pea-purple" />
                      <span>คัดลอกลิงก์เพื่อแชร์ข่าว</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal Dialog for All News List */}
      <AnimatePresence>
        {showAllNewsList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 sticky top-0">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-pea-purple" />
                  ข่าวสารและกิจกรรมทั้งหมด
                </h2>
                <button
                  onClick={() => setShowAllNewsList(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  {newsList.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setShowAllNewsList(false);
                        handleSelectNews(item);
                      }}
                      className="flex gap-4 items-start group cursor-pointer bg-white hover:bg-purple-50 p-3 rounded-2xl transition-colors border border-slate-100 shadow-sm"
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
                        <img 
                          src={item.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=150"} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold text-pea-purple">
                            {formatThaiDate(item.date)}
                          </p>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-pea-darkpurple transition-colors mb-1.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {newsList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                      <Building className="w-10 h-10 opacity-25" />
                      <p className="text-sm font-light">ยังไม่มีข่าวประชาสัมพันธ์เพิ่มเติม</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

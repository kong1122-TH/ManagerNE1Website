import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Info, 
  Award, 
  Users, 
  BookOpen, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List as ListIcon
} from "lucide-react";
import { CalendarEvent } from "../types";

interface CalendarDashboardProps {
  events: CalendarEvent[];
}

export default function CalendarDashboard({ events }: CalendarDashboardProps) {
  const today = new Date();
  
  // App starts with the current year/month based on actual time
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const categories = ["ทั้งหมด", "ประชุม", "CSR", "กิจกรรม", "สัมมนา"];

  const filteredEvents = selectedCategory === "ทั้งหมด"
    ? events
    : events.filter((e) => e.category === selectedCategory);

  // Sorting events by date ascending
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculations for stats dashboard
  const totalEvents = events.length;
  
  // Events this viewed month
  const currentMonthEvents = events.filter((e) => {
    try {
      const eDate = new Date(e.date);
      return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
    } catch {
      return false;
    }
  }).length;

  const getNextEvent = () => {
    const now = new Date();
    const futureEvents = events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return futureEvents[0] || null;
  };

  const nextEvent = getNextEvent();

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "ประชุม":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "CSR":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "สัมมนา":
        return "bg-indigo-50 text-indigo-600 border-indigo-200";
      default:
        return "bg-amber-50 text-amber-600 border-amber-200";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "ประชุม":
        return <Users className="w-4 h-4" />;
      case "CSR":
        return <Award className="w-4 h-4" />;
      case "สัมมนา":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const formatThaiDateFull = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const thaiDaysOfWeek = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  const getThaiMonthYearLabel = (year: number, month: number) => {
    const thaiYear = year + 543;
    return `${thaiMonths[month]} ${thaiYear}`;
  };

  const checkIfToday = (y: number, m: number, d: number) => {
    return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDateStr(null);
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(null);
  };

  // Helper to generate the 42 days grid for full month view
  const getDaysInMonthGrid = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ...
    const numDays = new Date(year, month + 1, 0).getDate();
    const prevMonthNumDays = new Date(year, month, 0).getDate();

    const days: { day: number; monthOffset: number; dateStr: string; isToday: boolean }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthNumDays - i;
      const prevMonthVal = month === 0 ? 11 : month - 1;
      const prevYearVal = month === 0 ? year - 1 : year;
      const dateStr = `${prevYearVal}-${String(prevMonthVal + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
      days.push({
        day: prevDay,
        monthOffset: -1,
        dateStr,
        isToday: checkIfToday(prevYearVal, prevMonthVal, prevDay),
      });
    }

    // Current month days
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        day: d,
        monthOffset: 0,
        dateStr,
        isToday: checkIfToday(year, month, d),
      });
    }

    // Next month padding days to make grid full 7x6 (42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthVal = month === 11 ? 0 : month + 1;
      const nextYearVal = month === 11 ? year + 1 : year;
      const dateStr = `${nextYearVal}-${String(nextMonthVal + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        day: i,
        monthOffset: 1,
        dateStr,
        isToday: checkIfToday(nextYearVal, nextMonthVal, i),
      });
    }

    return days;
  };

  const gridDays = getDaysInMonthGrid(currentYear, currentMonth);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ปฏิทินกิจกรรมชมรม</h2>
          <p className="text-slate-500 text-xs">แดชบอร์ดแผนการดำเนินงาน ประชุม และกิจกรรมสาธารณประโยชน์</p>
        </div>
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Events count */}
        <div className="bg-gradient-to-br from-pea-purple to-purple-800 text-white p-6 rounded-3xl shadow-md flex flex-col justify-between h-44 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
          <div>
            <CalendarIcon className="w-8 h-8 text-pea-gold mb-2" />
            <h3 className="text-sm text-purple-100 font-light">กิจกรรมทั้งหมดในปีนี้</h3>
          </div>
          <div>
            <span className="text-4xl font-bold">{totalEvents}</span>
            <span className="text-xs text-purple-200 font-light ml-2">แผนงานกิจกรรมสะสม</span>
          </div>
        </div>

        {/* Current Month Events */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="inline-block px-3 py-1 bg-amber-50 text-pea-amber text-[10px] font-semibold rounded-full mb-3">
              กำหนดการด่วน
            </span>
            <h3 className="text-xs text-slate-400 font-medium">กิจกรรมในเดือนที่รับชม ({getThaiMonthYearLabel(currentYear, currentMonth)})</h3>
          </div>
          <div>
            <span className="text-4xl font-bold text-slate-800">{currentMonthEvents}</span>
            <span className="text-xs text-slate-500 font-light ml-2">กิจกรรมประจำเดือน</span>
          </div>
        </div>

        {/* Next Upcoming Event detail */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm md:col-span-1 h-44 flex flex-col justify-between">
          <div>
            <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">กิจกรรมถัดไป</h3>
            {nextEvent ? (
              <div className="mt-2 space-y-1">
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{nextEvent.title}</h4>
                <p className="text-[11px] text-pea-purple flex items-center gap-1 font-light">
                  <Clock className="w-3.5 h-3.5" /> {formatThaiDateFull(nextEvent.date)} เวลา {nextEvent.time} น.
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 font-light truncate">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {nextEvent.location}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs mt-2">ไม่มีกิจกรรมเร็วๆ นี้</p>
            )}
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-light">
            <span>โปรดจัดเตรียมกำหนดการและวาระ</span>
          </div>
        </div>
      </div>

      {/* Control panel: Category selectors & View toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs text-slate-400 font-light flex-shrink-0">กรองกิจกรรม:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-pea-purple text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-pea-purple shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>แบบปฏิทินเต็มเดือน</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-pea-purple shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>แบบรายการกิจกรรม</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Section */}
      {viewMode === "grid" ? (
        <div className="space-y-6">
          {/* Month Header and Navigator */}
          <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-pea-purple" />
              <span>{getThaiMonthYearLabel(currentYear, currentMonth)}</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-600"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold rounded-xl text-pea-purple border border-slate-200 transition-all cursor-pointer"
              >
                วันนี้
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-600"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Grid Calendar */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-3 sm:p-5">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {thaiDaysOfWeek.map((day, idx) => (
                <div 
                  key={day} 
                  className={`text-center font-semibold text-[11px] sm:text-xs py-2 rounded-xl ${
                    idx === 0 
                      ? "text-rose-500 bg-rose-50/50" 
                      : idx === 6 
                      ? "text-blue-500 bg-blue-50/50" 
                      : "text-slate-500 bg-slate-50/50"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {gridDays.map((day, index) => {
                const dayEvents = events.filter((e) => {
                  try {
                    // Check if event date exactly matches this day's date string
                    const matchesDate = e.date === day.dateStr;
                    const matchesCategory = selectedCategory === "ทั้งหมด" || e.category === selectedCategory;
                    return matchesDate && matchesCategory;
                  } catch {
                    return false;
                  }
                });

                const isDaySelected = selectedDateStr === day.dateStr;

                return (
                  <button
                    key={`${day.dateStr}-${index}`}
                    onClick={() => setSelectedDateStr(day.dateStr === selectedDateStr ? null : day.dateStr)}
                    className={`w-full min-h-[64px] sm:min-h-[105px] p-1.5 sm:p-2.5 border rounded-2xl flex flex-col justify-between items-start transition-all cursor-pointer group text-left relative ${
                      day.monthOffset !== 0
                        ? "bg-slate-50/50 border-slate-100/50 text-slate-300"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-purple-50/20"
                    } ${
                      day.isToday
                        ? "border-pea-purple ring-2 ring-pea-purple/10 bg-purple-50/10"
                        : ""
                    } ${
                      isDaySelected
                        ? "ring-2 ring-pea-purple border-transparent bg-purple-50/30 shadow-sm"
                        : ""
                    }`}
                  >
                    {/* Date Number Badge */}
                    <div className="w-full flex justify-between items-center mb-1">
                      <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${
                        day.isToday
                          ? "bg-pea-purple text-white shadow-sm"
                          : isDaySelected
                          ? "bg-purple-100 text-pea-purple"
                          : day.monthOffset !== 0
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}>
                        {day.day}
                      </span>
                      
                      {/* Active count badge */}
                      {dayEvents.length > 0 && (
                        <span className="sm:hidden text-[9px] font-bold bg-pea-purple text-white w-4.5 h-4.5 rounded-full flex items-center justify-center scale-90">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Desktop events preview */}
                    <div className="w-full hidden sm:block mt-1 space-y-1 overflow-y-auto max-h-[58px] scrollbar-none">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded-lg truncate border font-medium leading-none ${getCategoryColor(ev.category)}`}
                          title={`${ev.time} น. - ${ev.title}`}
                        >
                          {ev.time} {ev.title}
                        </div>
                      ))}
                    </div>

                    {/* Mobile event indicator dots */}
                    <div className="w-full sm:hidden flex flex-wrap gap-0.5 mt-auto justify-center">
                      {dayEvents.map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.category === "ประชุม" ? "bg-blue-500" :
                            ev.category === "CSR" ? "bg-emerald-500" :
                            ev.category === "สัมมนา" ? "bg-indigo-500" : "bg-amber-500"
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details panel */}
          <AnimatePresence>
            {selectedDateStr && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-purple-50/20 border border-purple-100/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="w-4.5 h-4.5 text-pea-purple" />
                    <span>กำหนดการสำหรับวันที่ {formatThaiDateFull(selectedDateStr)}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedDateStr(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                  >
                    ปิดรายละเอียด
                  </button>
                </div>

                {events.filter(e => e.date === selectedDateStr).length === 0 ? (
                  <p className="text-slate-400 text-xs font-light py-4 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    ไม่มีตารางกิจกรรมที่กำหนดไว้สำหรับวันนี้
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.filter(e => e.date === selectedDateStr).map((event) => (
                      <div key={event.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(event.category)}`}>
                            {getCategoryIcon(event.category)}
                            {event.category}
                          </span>
                          <span className="text-xs text-slate-400 font-light flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {event.time} น.
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm">{event.title}</h5>
                        <p className="text-slate-500 text-xs font-light leading-relaxed">{event.description}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-600 font-light pt-1 border-t border-slate-50">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Original Timeline List View */
        sortedEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-slate-400 text-sm font-light">ไม่พบกำหนดการและตารางกิจกรรมตามหมวดหมู่ที่เลือก</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => {
              const dateObj = new Date(event.date);
              const day = !isNaN(dateObj.getTime()) ? dateObj.getDate() : "?";
              const monthShort = !isNaN(dateObj.getTime()) 
                ? dateObj.toLocaleDateString("th-TH", { month: "short" }) 
                : "ก.ค.";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow duration-300"
                >
                  {/* Date Badge */}
                  <div className="flex-shrink-0 flex sm:flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-purple-50 rounded-2xl border border-purple-100 text-pea-purple">
                    <span className="text-xl sm:text-2xl font-bold">{day}</span>
                    <span className="text-[10px] sm:text-xs font-medium uppercase sm:mt-0.5">{monthShort}</span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(event.category)}`}>
                        {getCategoryIcon(event.category)}
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-400 font-light flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {event.time} น.
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base leading-tight">
                      {event.title}
                    </h3>
                    
                    <p className="text-slate-500 text-xs font-light leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-slate-600 font-light pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Status check (future vs past) */}
                  <div className="flex-shrink-0 flex items-center sm:self-center">
                    <span className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full font-medium">
                      {new Date(event.date) < new Date() ? "เสร็จสิ้นแล้ว" : "รอดำเนินการ"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

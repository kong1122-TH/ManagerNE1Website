import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Phone, Mail, UserCheck, Shield, Users, Building, Activity, X } from "lucide-react";
import { Member } from "../types";

interface MemberDirectoryProps {
  members: Member[];
}

export default function MemberDirectory({ members }: MemberDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<string>("ทั้งหมด");
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<string>("ทั้งหมด");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Extract unique offices and roles for filtering
  const offices = ["ทั้งหมด", ...Array.from(new Set(members.map((m) => m.peaOffice))).filter(Boolean)];
  
  // Custom role group mapping
  const roleGroups = ["ทั้งหมด", "คณะกรรมการ", "สมาชิกทั่วไป"];

  // Filter logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.peaOffice.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOffice = selectedOffice === "ทั้งหมด" || member.peaOffice === selectedOffice;

    const isCommittee = member.role !== "สมาชิกชมรม";

    let matchesRoleGroup = true;
    if (selectedRoleGroup === "คณะกรรมการ") {
      matchesRoleGroup = isCommittee;
    } else if (selectedRoleGroup === "สมาชิกทั่วไป") {
      matchesRoleGroup = !isCommittee;
    }

    return matchesSearch && matchesOffice && matchesRoleGroup;
  });

  // เรียงลำดับตามความสำคัญของตำแหน่ง
  const roleOrder: Record<string, number> = {
    "ประธานที่ปรึกษากิตติมศักดิ์": 1,
    "ที่ปรึกษากิตติมศักดิ์": 2,
    "ประธานที่ปรึกษา": 3,
    "รองประธานที่ปรึกษา": 4,
    "ที่ปรึกษา": 5,
    "ประธานชมรม": 6,
    "รองประธานชมรม": 7,
    "ประธานคณะกรรมการ": 8,
    "กรรมการ": 9,
    "กรรมการและเลขานุการ": 10,
    "เลขานุการ": 11,
    "ผู้ช่วยเลขานุการ": 12,
    "สมาชิกชมรม": 13,
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const orderA = roleOrder[a.role] || 99;
    const orderB = roleOrder[b.role] || 99;
    return orderA - orderB;
  });

  // Calculate statistics
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "Active").length;
  const uniqueBranchesCount = new Set(members.map((m) => m.peaOffice)).size;
  const committeeCount = members.filter((m) => m.role !== "สมาชิกชมรม").length;

  return (
    <div className="space-y-8">
      {/* Title & Stats Dashboard */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ฐานข้อมูลสมาชิกชมรม</h2>
          <p className="text-slate-500 text-xs">ทำเนียบผู้จัดการการไฟฟ้าส่วนภูมิภาคในสังกัด กฟฉ.1</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-pea-purple rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">สมาชิกทั้งหมด</p>
              <h4 className="text-xl font-bold text-slate-800">{totalCount} ท่าน</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-pea-amber rounded-xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">สำนักงานการไฟฟ้า</p>
              <h4 className="text-xl font-bold text-slate-800">{uniqueBranchesCount} สาขา</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">สถานะพร้อมใช้งาน</p>
              <h4 className="text-xl font-bold text-slate-800">{activeCount} ท่าน</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">คณะกรรมการชมรม</p>
              <h4 className="text-xl font-bold text-slate-800">{committeeCount} ท่าน</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ตำแหน่ง, สาขาการไฟฟ้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple/20 focus:border-pea-purple font-light"
            />
          </div>

          {/* Role Group Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-light flex-shrink-0">กลุ่มสมาชิก:</span>
            {roleGroups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedRoleGroup(group)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRoleGroup === group
                    ? "bg-pea-purple text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Office Filtering Tags */}
        <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-light flex-shrink-0 mr-1">การไฟฟ้าสาขา:</span>
          {offices.map((office) => (
            <button
              key={office}
              onClick={() => setSelectedOffice(office)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                selectedOffice === office
                  ? "bg-pea-amber text-slate-800 shadow-sm"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {office}
            </button>
          ))}
        </div>
      </div>

      {/* Members Cards Grid */}
      {sortedMembers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm font-light">ไม่พบรายชื่อสมาชิกที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMembers.map((member, index) => {
            const isCommittee = member.role !== "สมาชิกชมรม";

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className={`relative bg-white rounded-2xl p-6 border transition-all duration-300 shadow-sm flex flex-col justify-between ${
                  isCommittee 
                    ? "border-purple-200 ring-2 ring-pea-purple/5" 
                    : "border-slate-100"
                }`}
              >
                {/* Executive Badge */}
                {isCommittee && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-100 text-pea-purple text-[10px] font-semibold rounded-full">
                    <Shield className="w-3 h-3" /> {member.role}
                  </span>
                )}

                <div className="space-y-4">
                  {/* Name and Position Header with Profile Photo */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {member.imageUrl ? (
                        <div 
                          className="w-14 h-14 rounded-full overflow-hidden border border-purple-100 shadow-sm bg-slate-50 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(member.imageUrl || null)}
                        >
                          <img 
                            src={member.imageUrl} 
                            alt={member.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pea-purple/10 to-indigo-50 border border-purple-50 flex items-center justify-center text-pea-purple shadow-sm">
                          <Users className="w-6 h-6 opacity-60" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${member.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                        <h3 className="font-bold text-slate-800 text-base leading-tight truncate" title={member.name}>{member.name}</h3>
                      </div>
                      <p className="text-pea-purple font-medium text-xs leading-snug line-clamp-2" title={member.position}>{member.position}</p>
                    </div>
                  </div>

                  {/* Office & Contact Info */}
                  <div className="space-y-2 text-xs text-slate-600 font-light border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>สังกัด: <strong className="font-semibold text-slate-700">{member.peaOffice}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${member.phone}`} className="hover:text-pea-purple transition-colors">{member.phone || "-"}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${member.email}`} className="hover:text-pea-purple transition-colors truncate">{member.email || "-"}</a>
                    </div>
                  </div>
                </div>

                {/* Status indicator bottom bar */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">สถานะสมาชิก:</span>
                  <span className={`font-semibold ${member.status === "Active" ? "text-emerald-600" : "text-slate-400"}`}>
                    {member.status === "Active" ? "กำลังปฏิบัติงาน" : "เกษียณ/ย้าย"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 sm:right-4 p-2 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Profile Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

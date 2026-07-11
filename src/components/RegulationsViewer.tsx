import React from "react";
import { motion } from "motion/react";
import { BookOpen, Calendar, FileText, Download, ChevronRight } from "lucide-react";
import { Regulation } from "../types";

interface RegulationsViewerProps {
  regulations: Regulation[];
}

export default function RegulationsViewer({ regulations }: RegulationsViewerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-pea-purple">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">ระเบียบที่เกี่ยวข้อง</h2>
          <p className="text-sm text-slate-500">รวบรวมระเบียบและข้อบังคับที่เกี่ยวข้องกับการดำเนินงานของชมรม</p>
        </div>
      </div>

      {regulations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">ยังไม่มีข้อมูลระเบียบในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regulations.map((reg, index) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-pea-purple bg-purple-50 px-3 py-1.5 rounded-lg w-fit mb-4">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(reg.date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-3 leading-snug line-clamp-2">
                {reg.title}
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 flex-grow whitespace-pre-wrap line-clamp-4">
                {reg.content}
              </p>

              {reg.images && reg.images.length > 0 && (
                <div className={`mb-4 grid gap-2 ${reg.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {reg.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-100 shadow-sm hover:opacity-90 transition-opacity aspect-video">
                      <img src={img} alt={`Regulation ${reg.title} image ${i+1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {reg.pdfUrl ? (
                <a
                  href={reg.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  เปิดดูเอกสารอ้างอิง
                </a>
              ) : (
                <div className="mt-auto w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-400 py-2.5 rounded-xl text-sm font-medium border border-slate-100 cursor-not-allowed">
                  ไม่มีไฟล์เอกสารแนบ
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, Target, BookOpen, Clock, Download, ChevronRight, 
  TrendingUp, Award, FileText, CheckCircle2, AlertCircle, BarChart3,
  Calendar, Filter, UserCog, Briefcase
} from 'lucide-react';
import { exportToExcel, exportToPDF } from "@/lib/ExportUtils";

type ReportTab = "overview" | "users" | "exams" | "content";
type RoleFilter = "all" | "student" | "admin_staff";

export default function ReportManager() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced Filters State
  const [userRole, setUserRole] = useState<RoleFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Data States
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    passRate: 0,
    totalExams: 0,
    pendingProposals: 0,
    totalMaterials: 0
  });

  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [examPerformanceData, setExamPerformanceData] = useState<any[]>([]);
  const [contentCategoryData, setContentCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [userRole, startDate, endDate]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // 1. Base Query with Role & Date Filters
      let profileQuery = supabase.from('profiles').select('*', { count: 'exact' });
      let examQuery = supabase.from('user_exam_results').select('*, exam_tests(level_id, exam_levels(level_code))');

      // Apple Date Filters
      if (startDate) {
        profileQuery = profileQuery.gte('created_at', startDate);
        examQuery = examQuery.gte('created_at', startDate);
      }
      if (endDate) {
        profileQuery = profileQuery.lte('created_at', endDate + 'T23:59:59');
        examQuery = examQuery.lte('created_at', endDate + 'T23:59:59');
      }

      // Apple Role Filters
      if (userRole === 'student') {
        profileQuery = profileQuery.eq('is_admin', false).eq('is_teacher', false);
      } else if (userRole === 'admin_staff') {
        profileQuery = profileQuery.or('is_admin.eq.true,is_teacher.eq.true');
      }

      const { data: filteredProfiles, count: totalCount } = await profileQuery;
      const { data: filteredExams } = await examQuery;

      // Calculate Stats
      const premiumCount = filteredProfiles?.filter(p => p.is_premium).length || 0;
      const adminCount = filteredProfiles?.filter(p => p.is_admin).length || 0;
      const teacherCount = filteredProfiles?.filter(p => p.is_teacher).length || 0;
      
      const { count: materialCount } = await supabase.from('study_materials').select('*', { count: 'exact', head: true });
      const { count: pendingProps } = await supabase.from('teacher_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      const passCount = filteredExams?.filter(r => r.is_passed).length || 0;
      const totalExams = filteredExams?.length || 0;
      const passRate = totalExams > 0 ? (passCount / totalExams) * 100 : 0;

      setStats({
        totalUsers: totalCount || 0,
        premiumUsers: premiumCount,
        totalAdmins: adminCount,
        totalTeachers: teacherCount,
        passRate: Math.round(passRate),
        totalExams,
        pendingProposals: pendingProps || 0,
        totalMaterials: materialCount || 0
      });

      // 2. Growth Chart Data
      const growthMap: Record<string, number> = {};
      filteredProfiles?.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        growthMap[date] = (growthMap[date] || 0) + 1;
      });
      setUserGrowthData(Object.entries(growthMap).map(([name, value]) => ({ name, value })));

      // 3. Exam Performance by Level
      const perfMap: Record<string, { total: number, murni: number }> = {
        'N5': { total: 0, murni: 0 }, 'N4': { total: 0, murni: 0 }, 'N3': { total: 0, murni: 0 },
        'N2': { total: 0, murni: 0 }, 'N1': { total: 0, murni: 0 }
      };

      filteredExams?.forEach((r: any) => {
        const code = r.exam_tests?.exam_levels?.level_code?.toUpperCase();
        if (perfMap[code]) {
          perfMap[code].total += 1;
          perfMap[code].murni += r.score;
        }
      });

      setExamPerformanceData(Object.entries(perfMap).map(([name, data]) => ({
        name, avg: data.total > 0 ? Math.round(data.murni / data.total) : 0
      })));

      // 4. Content logs
      const { data: logs } = await supabase.from('user_exp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentActivity(logs || []);

    } catch (err) {
      console.error("Report Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getExportMetadata = () => {
    let meta = `Filter [Peran: ${userRole === 'all' ? 'Semua' : userRole === 'student' ? 'Siswa' : 'Admin/Guru'}]`;
    if (startDate || endDate) {
        meta += ` [Rentang: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}]`;
    }
    return meta;
  };

  const handleExportExcel = () => {
    const data = userGrowthData.map(d => ({ 'Tanggal': d.name, 'Jumlah Akun Baru': d.value }));
    exportToExcel(data, `Laporan_Sagara_${new Date().toISOString().split('T')[0]}`, 'Statistik', getExportMetadata());
  };

  const handleExportPDF = () => {
    const columns = ['Item', 'Statistik'];
    const rows = [
        ['Total Akun', stats.totalUsers],
        ['Premium', stats.premiumUsers],
        ['Staff Admin', stats.totalAdmins],
        ['Guru/Instructor', stats.totalTeachers],
        ['Tingkat Kelulusan', `${stats.passRate}%`],
        ['Total Ujian Selesai', stats.totalExams]
    ];
    exportToPDF('Laporan Dashboard Sagara Nihongo', columns, rows, `Laporan_PDF_${new Date().toISOString().split('T')[0]}`, getExportMetadata());
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading && userGrowthData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium italic">Sedang menyinkronkan data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Filter Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-1">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 italic uppercase tracking-tight">
                  <Filter className="w-5 h-5 text-indigo-600" />
                  Filter & Analysis
               </h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-7">Pilih Parameter Laporan Anda</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
               <div className="flex-1 lg:flex-none">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">Data Peran</label>
                  <select 
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full lg:w-40 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                     <option value="all">🌐 Semua Peran</option>
                     <option value="student">🎓 Hanya Siswa</option>
                     <option value="admin_staff">👔 Admin & Staff</option>
                  </select>
               </div>

               <div className="flex-1 lg:flex-none">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">Dari Tanggal</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full lg:w-44 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  />
               </div>

               <div className="flex-1 lg:flex-none">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">Sampai Tanggal</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full lg:w-44 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  />
               </div>

               <button 
                 onClick={() => { setStartDate(""); setEndDate(""); setUserRole("all"); }}
                 className="mt-5 p-3 text-slate-400 hover:text-rose-500 transition-colors"
                 title="Reset Filter"
               >
                  <Clock className="w-5 h-5" />
               </button>
            </div>
         </div>
      </div>

      {/* 2. Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-6 h-6" />} 
          label={userRole === 'admin_staff' ? "Total Staff" : "Total Siswa"} 
          value={stats.totalUsers.toLocaleString()} 
          subValue={userRole === 'all' ? `${stats.premiumUsers} Premium User` : `Terfilter`}
          color="bg-indigo-600" 
        />
        <StatCard 
          icon={<Award className="w-6 h-6" />} 
          label="Lulus Ujian" 
          value={`${stats.passRate}%`} 
          subValue={`${stats.totalExams} Total Selesai`}
          color="bg-emerald-600" 
        />
        {userRole === 'admin_staff' ? (
          <StatCard 
            icon={<UserCog className="w-6 h-6" />} 
            label="Admin / Staff" 
            value={stats.totalAdmins.toString()} 
            subValue="Akses Dashboard Penuh"
            color="bg-amber-600" 
          />
        ) : (
          <StatCard 
            icon={<BookOpen className="w-6 h-6" />} 
            label="Total Materi" 
            value={stats.totalMaterials.toLocaleString()} 
            subValue="Database N5 - N1"
            color="bg-amber-600" 
          />
        )}
        <StatCard 
          icon={<Briefcase className="w-6 h-6" />} 
          label="Guru Aktif" 
          value={stats.totalTeachers.toString()} 
          subValue={`${stats.pendingProposals} Usulan Pending`}
          color="bg-rose-600" 
        />
      </div>

      {/* 3. Charts & Sub-tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Growth Area Chart */}
            <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-700">
                  <TrendingUp className="w-32 h-32" />
               </div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <h4 className="text-lg font-black italic text-slate-800 tracking-tight">Timeline Analytics</h4>
                  <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ambil Data Laporan:</p>
            <div className="flex items-center gap-4">
                <button 
                  onClick={handleExportExcel}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline decoration-2 underline-offset-4 transition-all"
                >
                  DOWNLOAD EXCEL (.xlsx)
                </button>
                <div className="w-px h-3 bg-slate-200" />
                <button 
                  onClick={handleExportPDF}
                  className="text-xs font-black text-rose-500 hover:text-rose-700 underline decoration-2 underline-offset-4 transition-all"
                >
                  DOWNLOAD PDF (.pdf)
                </button>
            </div>
        </div>       </div>
<<<<<<< HEAD
               <div className="h-72 relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
=======
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Performance Bar Chart */}
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Target className="w-32 h-32 text-indigo-400" />
               </div>
               <h4 className="text-lg font-black italic text-white tracking-tight mb-8">Passing Rate by JLPT Level</h4>
<<<<<<< HEAD
               <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
=======
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                    <BarChart data={examPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }} 
                        itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="avg" fill="#818cf8" radius={[8, 8, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Right Column: Activity & Audit */}
         <div className="space-y-8">
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Real-time Stream</h4>
               <div className="space-y-4">
                  {recentActivity.map((log, i) => (
                    <div key={log.id} className="flex items-center gap-4 group">
                       <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {log.activity_type === 'test' ? '🎯' : '📚'}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-800 truncate">{log.user_email}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
                       </div>
                       <span className="text-[10px] font-black text-indigo-600">+{log.exp_amount} XP</span>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-4 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all">
                  Audit Activity Logs →
               </button>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] shadow-xl shadow-rose-100/30">
               <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest">Security Audit</h4>
                  <AlertCircle className="w-5 h-5 text-rose-500" />
               </div>
               <div className="p-4 bg-white/80 rounded-2xl border border-rose-100/50 mb-3">
                  <p className="text-[11px] font-black text-slate-800">Default Password Detected</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">3 akun staff menggunakan 'admin'. Tingkat resiko: <span className="text-rose-600 font-bold">TINGGI</span></p>
               </div>
               <div className="p-4 bg-white/80 rounded-2xl border border-rose-100/50">
                  <p className="text-[11px] font-black text-slate-800">Proposal Pending</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Ada {stats.pendingProposals} usulan materi guru menunggu persetujuan Anda.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color }: { icon: any, label: string, value: string, subValue: string, color: string }) {
  return (
    <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-100/50 group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-2 h-full ${color} opacity-20`} />
      <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center mb-6 shadow-2xl relative z-10 group-hover:rotate-6 transition-transform`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</h3>
      <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-tight flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        {subValue}
      </p>
    </div>
  );
}

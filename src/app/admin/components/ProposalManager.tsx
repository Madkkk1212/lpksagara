"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Proposal = {
  id: string;
  teacher_email: string;
  teacher_name: string;
  proposal_type: 'question' | 'material';
  title: string;
  content: { description: string };
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
};

export default function ProposalManager() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('teacher_proposals')
      .select('*')
      .order('created_at', { ascending: false });
    setProposals((data as Proposal[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      const { error } = await supabase.from('teacher_proposals').update({
        status,
        admin_note: adminNote || null,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (error) throw error;

      alert(`Sukses! Usulan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      setSelected(null);
      setAdminNote('');
      fetchProposals();
    } catch (e: any) {
      console.error("Proposal Update Error:", e);
      alert(`Gagal memperbarui status: ${e.message || "Error database"}`);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = proposals.filter(p => filter === 'all' ? true : p.status === filter);
  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">📝 Usulan Konten dari Guru</h3>
          <p className="text-sm text-slate-500 mt-1">Tinjau dan setujui/tolak usulan soal & materi yang dikirim oleh guru.</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full">
            {pendingCount} menunggu review
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'pending' ? '⏳ Menunggu' : f === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
            {f === 'pending' && pendingCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium text-sm">Memuat usulan...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-semibold text-slate-400">Tidak ada usulan dalam kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div
              key={p.id}
              className={`p-5 bg-white border rounded-2xl shadow-sm flex items-start justify-between gap-4 cursor-pointer hover:border-indigo-300 transition-all ${
                p.status === 'pending' ? 'border-amber-200' : p.status === 'approved' ? 'border-emerald-200' : 'border-rose-100'
              }`}
              onClick={() => { setSelected(p); setAdminNote(p.admin_note || ''); }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    p.proposal_type === 'question' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'
                  }`}>
                    {p.proposal_type === 'question' ? '📝 Soal' : '📖 Materi'}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    p.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-rose-50 text-rose-500'
                  }`}>
                    {p.status === 'pending' ? '⏳ Pending' : p.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                  </span>
                </div>
                <p className="font-bold text-slate-800 text-sm mb-1">{p.title}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{p.content?.description}</p>
                <p className="text-[10px] text-slate-300 mt-2 font-medium">
                  👨‍🏫 {p.teacher_name} · {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {p.status === 'pending' && (
                <div className="shrink-0 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700">
                  Review →
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Review Usulan</h3>
                <p className="text-xs text-slate-400 mt-1">dari {selected.teacher_name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Jenis</p>
                <p className="text-sm font-bold">{selected.proposal_type === 'question' ? '📝 Usulan Soal' : '📖 Usulan Materi'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Judul</p>
                <p className="text-sm font-bold">{selected.title}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Konten / Deskripsi</p>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                  {selected.content?.description}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Catatan Admin (opsional)</label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Berikan catatan feedback untuk guru..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium resize-none focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => updateStatus(selected.id, 'rejected')}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-bold hover:bg-rose-100 disabled:opacity-50 transition-all"
              >
                ❌ Tolak
              </button>
              <button
                onClick={() => updateStatus(selected.id, 'approved')}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
              >
                ✅ Setujui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

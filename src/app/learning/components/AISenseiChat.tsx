"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, Sparkles, User, BrainCircuit } from "lucide-react";

export default function AISenseiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([
    { role: 'ai', content: 'Halo! Saya Sagara Sensei. Ada kesulitan dengan tata bahasa atau kosakata hari ini? Tanyakan saja!' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setIsTyping(true);

    // Simulate AI response logic
    setTimeout(() => {
      let aiResponse = "";
      if (userMsg.toLowerCase().includes("arigatou")) {
        aiResponse = "Douitashimashite! (Sama-sama). Adakah hal lain yang ingin Anda pelajari?";
      } else if (userMsg.toLowerCase().includes("n5")) {
        aiResponse = "Untuk level N5, fokuslah pada partikel dasar seperti Wa, Ga, dan Wo, serta hafalkan sekitar 100 Kanji dasar.";
      } else {
        aiResponse = "Itu pertanyaan yang bagus! Sebagai AI Sensei, saya menyarankan Anda untuk sering berlatih shadowing agar pengucapan semakin alami. Ada pertanyaan spesifik tentang materi ini?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group"
        >
           <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20 group-hover:opacity-40" />
           <Bot className="w-8 h-8 relative z-10" />
           <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-[110] border border-slate-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
           {/* Header */}
           <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <BrainCircuit className="w-20 h-20" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black italic tracking-tight">Sagara Sensei</h4>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Tutor Online</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
           </div>

           {/* Messages Container */}
           <div 
             ref={scrollRef}
             className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scroll-smooth custom-scrollbar"
           >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium ${
                     msg.role === 'user' 
                     ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                     : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                   }`}>
                      {msg.content}
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                   </div>
                </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative flex items-center">
                 <input 
                   type="text"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="Tanya Sensei..."
                   className="w-full py-4 px-6 pr-14 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                 />
                 <button 
                   onClick={handleSend}
                   disabled={!input.trim()}
                   className="absolute right-2 p-3 bg-slate-900 text-white rounded-xl disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                 >
                    <Send className="w-4 h-4" />
                 </button>
              </div>
              <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1">
                 <Sparkles className="w-2.5 h-2.5" />
                 Powered by Sagara AI Core
              </p>
           </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </>
  );
}

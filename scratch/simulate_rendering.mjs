import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nomlygyroifeohnutjhn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const fixUrl = (url) => typeof url === 'string' ? url.replace(/^undefined\//, "https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev/") : undefined;

async function run() {
  const { data: materialData, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('id', 'd8944379-6f5b-41ba-b78b-ec7851651fd0')
    .single()
    
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const content = materialData.content || {}
  
  const normalizedQuestions = content.is_section_test
    ? (content.sections || []).flatMap((sec) => 
        (sec.questions || []).map((ex, idx) => ({
          id: ex.id || `quiz-${idx}`,
          question_text: ex.q,
          options: ex.options || [],
          correct_option: ex.answer !== undefined ? ex.answer : -1,
          explanation: ex.explanation || "Tidak ada pembahasan.",
          audio_url: fixUrl(ex.audio_url || ex.audioUrl || ex.audio),
          image_url: fixUrl(ex.image_url || ex.imageUrl || ex.image),
          video_url: fixUrl(ex.video_url || ex.videoUrl || ex.video),
          question_type: ex.question_type || (ex.options && ex.options.length > 0 ? "multiple_choice" : "essay"),
          section_title: sec.title,
          section_instructions: sec.instructions,
          section_audio_url: fixUrl(sec.media?.audio_url || sec.media?.audioUrl || sec.media?.audio),
          section_image_url: fixUrl(sec.media?.image_url || sec.media?.imageUrl || sec.media?.image),
          section_pdf_url: fixUrl(sec.media?.pdf_url || sec.media?.pdfUrl || sec.media?.pdf),
          section_ppt_url: fixUrl(sec.media?.ppt_url || sec.media?.pptUrl || sec.media?.ppt),
          section_video_url: fixUrl(sec.media?.video_url || sec.media?.videoUrl || sec.media?.video),
        }))
      )
    : (content.exercises || []).map((ex, idx) => ({
        id: `quiz-${idx}`,
        question_text: ex.q,
        options: ex.options || [],
        correct_option: ex.answer !== undefined ? ex.answer : -1,
        explanation: ex.explanation || "Tidak ada pembahasan.",
        audio_url: fixUrl(ex.audio_url || ex.audioUrl || ex.audio),
        image_url: fixUrl(ex.image_url || ex.imageUrl || ex.image),
        video_url: fixUrl(ex.video_url || ex.videoUrl || ex.video),
        question_type: ex.options && ex.options.length > 0 ? "multiple_choice" : "essay",
        section_title: "Evaluasi Utama",
        section_instructions: content.instructions || "Silakan jawab pertanyaan berikut dengan saksama.",
        section_audio_url: fixUrl(content.audio_url || content.audioUrl || content.audio || materialData.audio_url),
        section_image_url: fixUrl(content.image_url || content.imageUrl || content.image || materialData.image_url),
        section_video_url: fixUrl(content.video_url || content.videoUrl || content.video || materialData.video_url)
      }));
      
  console.log('SIMULATED NORMALIZED QUESTIONS (First 2):')
  console.log(JSON.stringify(normalizedQuestions.slice(0, 2), null, 2))
}

run()

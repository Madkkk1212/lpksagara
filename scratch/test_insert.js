const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://nomlygyroifeohnutjhn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWx5Z3lyb2lmZW9obnV0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI1NTIsImV4cCI6MjA5MTcxODU1Mn0.Ngz_4ldtJKWhu2aqQ4d8aZu-h7SKgBqbkOLdO9GruNU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Inserting dummy violation using anon key...");

  const { data, error } = await supabase
    .from("exam_violations")
    .insert({
      student_id: "dummy-student-id-123",
      student_email: "test.student@example.com",
      student_name: "Test Student",
      test_id: "test-quiz-id",
      test_title: "Test Quiz Title",
      violation_type: "none",
      violation_count: 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("FAIL: Error inserting violation:", error);
  } else {
    console.log("SUCCESS: Inserted violation successfully. Data:", data);
  }
}

runTest();

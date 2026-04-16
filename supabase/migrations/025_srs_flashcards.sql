-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 025
-- Spaced Repetition System (SRS) Flashcards
-- ============================================================

-- 1. Create User Flashcards table
CREATE TABLE IF NOT EXISTS user_flashcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  
  -- Flashcard content
  front text NOT NULL, -- e.g. "食べる"
  back text NOT NULL,  -- e.g. "Makan"
  example_sentence text DEFAULT '',
  tag text DEFAULT 'vocabulary', -- 'vocabulary', 'kanji', 'grammar'
  
  -- SRS Data (SM-2 Algorithm based)
  level integer DEFAULT 0, -- Current level (0-10)
  interval integer DEFAULT 0, -- Days until next review
  ease_factor real DEFAULT 2.5,
  next_review_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_email ON user_flashcards(user_email);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON user_flashcards(next_review_at);

-- Disable RLS (Demo Mode)
ALTER TABLE user_flashcards DISABLE ROW LEVEL SECURITY;

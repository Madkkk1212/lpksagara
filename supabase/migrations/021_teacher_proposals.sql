-- Teacher Content Proposal System
CREATE TABLE IF NOT EXISTS teacher_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('question', 'material')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

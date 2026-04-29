-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 026
-- Fix: Teacher Proposals RLS Policies
-- ============================================================

-- 1. Disable RLS for this table to support manual auth system
ALTER TABLE teacher_proposals DISABLE ROW LEVEL SECURITY;

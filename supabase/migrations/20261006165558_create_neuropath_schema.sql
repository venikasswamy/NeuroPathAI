/*
# NeuroPath AI — Complete Database Schema

## Overview
Creates the full relational schema for NeuroPath AI, an adaptive personalized learning platform.
All tables use multi-tenant isolation via user_id columns with Row Level Security.

## Tables Created
1. **profiles** — Basic user display info (name, avatar)
2. **learner_profiles** — Onboarding data (goal, level, availability, challenges)
3. **learning_preferences** — Learning style profile (dominant/secondary style, confidence)
4. **skills** — Global skill catalog (name, category, difficulty, target proficiency)
5. **skill_prerequisites** — Skill dependency graph (skill requires prerequisite)
6. **learner_skills** — Per-user skill proficiency tracking (0-100 scale, status)
7. **goals** — Learning goals (target role, deadline, status)
8. **resources** — Educational resource catalog (articles, videos, docs, courses, etc.)
9. **lessons** — Lesson content catalog (objectives, content, difficulty)
10. **assessment_questions** — Question bank (MC, T/F, short answer, with explanations)
11. **roadmaps** — Personalized learning plans (phases, estimated hours, version)
12. **roadmap_items** — Individual roadmap entries (lessons, practice, assessments, projects)
13. **learning_sessions** — Session tracking (topic, duration, completion, confidence)
14. **assessments** — Assessment instances per user (score, status)
15. **assessment_attempts** — Assessment submissions with answers and mastery state
16. **feedback** — Learner feedback (difficulty, confidence, satisfaction, usefulness)
17. **resource_interactions** — Per-user resource interactions (viewed, completed, skipped, bookmarked)
18. **cognitive_twins** — Digital learner model (knowledge, skills, style, consistency, pace)
19. **drift_records** — Learning drift tracking (score, status, factors, explanation)
20. **shadow_predictions** — Educational risk indicators (level, factors, intervention)
21. **retention_records** — Spaced repetition scheduling (next review, interval, performance)
22. **notifications** — User notifications (type, read status, link)
23. **agent_runs** — Agent execution traces (agent, status, duration, I/O summaries)

## Security
- RLS enabled on ALL tables
- Each user can only access their own rows (auth.uid() = user_id)
- Owner columns default to auth.uid() so inserts work when client omits user_id
- Global catalog tables (skills, skill_prerequisites, lessons, assessment_questions, resources) are readable by all authenticated users

## Important Notes
1. All user-scoped tables have user_id NOT NULL DEFAULT auth.uid()
2. Catalog tables (skills, resources, lessons, assessment_questions) are shared — authenticated users get SELECT only
3. Timestamps default to now() on all tables
4. Indexes created on frequently queried columns
*/

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- LEARNER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_career text NOT NULL,
  target_role text NOT NULL,
  goal_description text,
  current_level text NOT NULL DEFAULT 'beginner',
  hours_per_day numeric DEFAULT 2,
  days_per_week numeric DEFAULT 5,
  target_deadline date,
  previous_projects text,
  previous_courses text,
  previous_experience text,
  learning_challenges text[] DEFAULT '{}',
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_learner_profile" ON learner_profiles;
CREATE POLICY "select_own_learner_profile" ON learner_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_learner_profile" ON learner_profiles;
CREATE POLICY "insert_own_learner_profile" ON learner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_learner_profile" ON learner_profiles;
CREATE POLICY "update_own_learner_profile" ON learner_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- LEARNING PREFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  dominant_style text NOT NULL DEFAULT 'mixed',
  secondary_style text,
  style_confidence numeric DEFAULT 50,
  style_signals jsonb DEFAULT '{}',
  preferred_difficulty text DEFAULT 'intermediate',
  session_length_minutes numeric DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE learning_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_preferences" ON learning_preferences;
CREATE POLICY "select_own_preferences" ON learning_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_preferences" ON learning_preferences;
CREATE POLICY "insert_own_preferences" ON learning_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_preferences" ON learning_preferences;
CREATE POLICY "update_own_preferences" ON learning_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SKILLS (global catalog — shared, read-only for authenticated users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  difficulty text DEFAULT 'intermediate',
  target_proficiency numeric DEFAULT 80
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_skills" ON skills;
CREATE POLICY "select_skills" ON skills FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- SKILL PREREQUISITES
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_prerequisites (
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, prerequisite_id)
);
ALTER TABLE skill_prerequisites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_skill_prereqs" ON skill_prerequisites;
CREATE POLICY "select_skill_prereqs" ON skill_prerequisites FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- LEARNER SKILLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS learner_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency numeric DEFAULT 0 CHECK (proficiency >= 0 AND proficiency <= 100),
  status text DEFAULT 'missing',
  evidence text[] DEFAULT '{}',
  last_assessed timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
ALTER TABLE learner_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_learner_skills" ON learner_skills;
CREATE POLICY "select_own_learner_skills" ON learner_skills FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_learner_skills" ON learner_skills;
CREATE POLICY "insert_own_learner_skills" ON learner_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_learner_skills" ON learner_skills;
CREATE POLICY "update_own_learner_skills" ON learner_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_learner_skills" ON learner_skills;
CREATE POLICY "delete_own_learner_skills" ON learner_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_learner_skills_user ON learner_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_skills_skill ON learner_skills(skill_id);

-- ============================================================================
-- GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_role text,
  target_deadline date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- RESOURCES (global catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  resource_type text NOT NULL DEFAULT 'article',
  url text,
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  difficulty text DEFAULT 'intermediate',
  learning_styles text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  estimated_minutes numeric DEFAULT 15,
  is_internal boolean DEFAULT false,
  content text
);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_resources" ON resources;
CREATE POLICY "select_resources" ON resources FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_resources_skill ON resources(skill_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);

-- ============================================================================
-- LESSONS (global catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  objectives text[] DEFAULT '{}',
  content text,
  estimated_minutes numeric DEFAULT 30,
  difficulty text DEFAULT 'intermediate',
  prerequisites text[] DEFAULT '{}'
);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_lessons" ON lessons;
CREATE POLICY "select_lessons" ON lessons FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- ASSESSMENT QUESTIONS (global catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  question text NOT NULL,
  options text[] DEFAULT '{}',
  correct_answer text NOT NULL,
  explanation text,
  difficulty text DEFAULT 'intermediate'
);
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_assessment_questions" ON assessment_questions;
CREATE POLICY "select_assessment_questions" ON assessment_questions FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_aq_skill ON assessment_questions(skill_id);

-- ============================================================================
-- ROADMAPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  total_phases integer DEFAULT 1,
  estimated_hours numeric DEFAULT 0,
  status text DEFAULT 'active',
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_roadmaps" ON roadmaps;
CREATE POLICY "select_own_roadmaps" ON roadmaps FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_roadmaps" ON roadmaps;
CREATE POLICY "insert_own_roadmaps" ON roadmaps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_roadmaps" ON roadmaps;
CREATE POLICY "update_own_roadmaps" ON roadmaps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_roadmaps" ON roadmaps;
CREATE POLICY "delete_own_roadmaps" ON roadmaps FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id);

-- ============================================================================
-- ROADMAP ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  phase integer NOT NULL,
  phase_title text,
  order_index integer NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  item_type text NOT NULL DEFAULT 'lesson',
  mastery_state text NOT NULL DEFAULT 'NOT_STARTED',
  estimated_minutes numeric DEFAULT 30,
  prerequisites text[] DEFAULT '{}',
  depends_on text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'locked',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_roadmap_items" ON roadmap_items;
CREATE POLICY "select_own_roadmap_items" ON roadmap_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_roadmap_items" ON roadmap_items;
CREATE POLICY "insert_own_roadmap_items" ON roadmap_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_roadmap_items" ON roadmap_items;
CREATE POLICY "update_own_roadmap_items" ON roadmap_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_roadmap_items" ON roadmap_items;
CREATE POLICY "delete_own_roadmap_items" ON roadmap_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap ON roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_user ON roadmap_items(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_phase ON roadmap_items(phase, order_index);

-- ============================================================================
-- LEARNING SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_item_id uuid REFERENCES roadmap_items(id) ON DELETE SET NULL,
  topic text NOT NULL,
  lesson_title text,
  objectives text[] DEFAULT '{}',
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration_minutes numeric DEFAULT 0,
  completion_percentage numeric DEFAULT 0,
  self_confidence numeric,
  difficulty_rating numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_sessions" ON learning_sessions;
CREATE POLICY "select_own_sessions" ON learning_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sessions" ON learning_sessions;
CREATE POLICY "insert_own_sessions" ON learning_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sessions" ON learning_sessions;
CREATE POLICY "update_own_sessions" ON learning_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sessions" ON learning_sessions;
CREATE POLICY "delete_own_sessions" ON learning_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON learning_sessions(start_time DESC);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  roadmap_item_id uuid REFERENCES roadmap_items(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  difficulty text DEFAULT 'intermediate',
  status text DEFAULT 'pending',
  score numeric,
  max_score numeric DEFAULT 100,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
CREATE POLICY "select_own_assessments" ON assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
CREATE POLICY "insert_own_assessments" ON assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
CREATE POLICY "update_own_assessments" ON assessments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
CREATE POLICY "delete_own_assessments" ON assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_skill ON assessments(skill_id);

-- ============================================================================
-- ASSESSMENT ATTEMPTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}',
  score numeric DEFAULT 0,
  max_score numeric DEFAULT 100,
  mastery_state text DEFAULT 'NEEDS_REVISION',
  time_taken_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_attempts" ON assessment_attempts;
CREATE POLICY "select_own_attempts" ON assessment_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_attempts" ON assessment_attempts;
CREATE POLICY "insert_own_attempts" ON assessment_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_attempts" ON assessment_attempts;
CREATE POLICY "update_own_attempts" ON assessment_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON assessment_attempts(user_id);

-- ============================================================================
-- FEEDBACK
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES learning_sessions(id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  roadmap_item_id uuid REFERENCES roadmap_items(id) ON DELETE SET NULL,
  difficulty_rating numeric DEFAULT 3 CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  confidence numeric DEFAULT 3 CHECK (confidence >= 1 AND confidence <= 5),
  satisfaction numeric DEFAULT 3 CHECK (satisfaction >= 1 AND satisfaction <= 5),
  resource_usefulness numeric CHECK (resource_usefulness >= 1 AND resource_usefulness <= 5),
  comments text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_feedback" ON feedback;
CREATE POLICY "update_own_feedback" ON feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_feedback" ON feedback;
CREATE POLICY "delete_own_feedback" ON feedback FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- ============================================================================
-- RESOURCE INTERACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS resource_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  interaction_type text NOT NULL DEFAULT 'viewed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE resource_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_interactions" ON resource_interactions;
CREATE POLICY "select_own_interactions" ON resource_interactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_interactions" ON resource_interactions;
CREATE POLICY "insert_own_interactions" ON resource_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_interactions" ON resource_interactions;
CREATE POLICY "delete_own_interactions" ON resource_interactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ri_user ON resource_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ri_resource ON resource_interactions(resource_id);

-- ============================================================================
-- COGNITIVE TWIN
-- ============================================================================
CREATE TABLE IF NOT EXISTS cognitive_twins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_profile jsonb DEFAULT '{}',
  skill_profile jsonb DEFAULT '{}',
  dominant_style text DEFAULT 'mixed',
  secondary_style text,
  consistency_score numeric DEFAULT 50,
  recent_performance numeric DEFAULT 50,
  confidence_score numeric DEFAULT 50,
  weak_areas text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  completed_topics text[] DEFAULT '{}',
  retention_state jsonb DEFAULT '{}',
  preferred_resource_types text[] DEFAULT '{}',
  learning_pace numeric DEFAULT 1.0,
  pace_label text DEFAULT 'Normal',
  retention_status numeric DEFAULT 50,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cognitive_twins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_twin" ON cognitive_twins;
CREATE POLICY "select_own_twin" ON cognitive_twins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_twin" ON cognitive_twins;
CREATE POLICY "insert_own_twin" ON cognitive_twins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_twin" ON cognitive_twins;
CREATE POLICY "update_own_twin" ON cognitive_twins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- DRIFT RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS drift_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  drift_score numeric DEFAULT 0,
  status text DEFAULT 'STABLE',
  factors jsonb DEFAULT '[]',
  explanation text,
  period_days integer DEFAULT 7,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE drift_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_drift" ON drift_records;
CREATE POLICY "select_own_drift" ON drift_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_drift" ON drift_records;
CREATE POLICY "insert_own_drift" ON drift_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_drift" ON drift_records;
CREATE POLICY "delete_own_drift" ON drift_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_drift_user ON drift_records(user_id, created_at DESC);

-- ============================================================================
-- SHADOW PREDICTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS shadow_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_level text DEFAULT 'LOW',
  risk_factors jsonb DEFAULT '[]',
  evidence text[] DEFAULT '{}',
  recommended_intervention text,
  confidence numeric DEFAULT 50,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shadow_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_shadow" ON shadow_predictions;
CREATE POLICY "select_own_shadow" ON shadow_predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_shadow" ON shadow_predictions;
CREATE POLICY "insert_own_shadow" ON shadow_predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_shadow" ON shadow_predictions;
CREATE POLICY "delete_own_shadow" ON shadow_predictions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_shadow_user ON shadow_predictions(user_id, created_at DESC);

-- ============================================================================
-- RETENTION RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS retention_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  topic text NOT NULL,
  last_studied timestamptz,
  last_assessed timestamptz,
  retention_state text DEFAULT 'new',
  next_review timestamptz DEFAULT now(),
  review_count integer DEFAULT 0,
  performance numeric DEFAULT 50,
  interval_days integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, skill_id, topic)
);
ALTER TABLE retention_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_retention" ON retention_records;
CREATE POLICY "select_own_retention" ON retention_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_retention" ON retention_records;
CREATE POLICY "insert_own_retention" ON retention_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_retention" ON retention_records;
CREATE POLICY "update_own_retention" ON retention_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_retention" ON retention_records;
CREATE POLICY "delete_own_retention" ON retention_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_retention_user ON retention_records(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_next_review ON retention_records(next_review);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ============================================================================
-- AGENT RUNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  input_summary jsonb DEFAULT '{}',
  output_summary jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  error text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_agent_runs" ON agent_runs;
CREATE POLICY "select_own_agent_runs" ON agent_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_agent_runs" ON agent_runs;
CREATE POLICY "insert_own_agent_runs" ON agent_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_agent_runs" ON agent_runs;
CREATE POLICY "update_own_agent_runs" ON agent_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_agent_runs" ON agent_runs;
CREATE POLICY "delete_own_agent_runs" ON agent_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs(user_id, created_at DESC);

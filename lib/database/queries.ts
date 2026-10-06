// ============================================================================
// Database access layer — typed queries for learner data
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type {
  Profile,
  LearnerProfile,
  LearningPreferences,
  LearnerSkill,
  Skill,
  Goal,
  Roadmap,
  RoadmapItem,
  LearningSession,
  Assessment,
  AssessmentAttempt,
  Feedback,
  Resource,
  ResourceInteraction,
  CognitiveTwin,
  DriftRecord,
  ShadowPrediction,
  RetentionRecord,
  Notification,
  AgentRun,
} from '@/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as Profile | null;
}

export async function getLearnerProfile(userId: string): Promise<LearnerProfile | null> {
  const { data } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as LearnerProfile | null;
}

export async function getLearningPreferences(userId: string): Promise<LearningPreferences | null> {
  const { data } = await supabase
    .from('learning_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as LearningPreferences | null;
}

export async function getLearnerSkills(userId: string): Promise<LearnerSkill[]> {
  const { data } = await supabase
    .from('learner_skills')
    .select('*, skill:skills(*)')
    .eq('user_id', userId);
  return (data || []) as unknown as LearnerSkill[];
}

export async function getAllSkills(): Promise<Skill[]> {
  const { data } = await supabase.from('skills').select('*').order('category, name');
  return (data || []) as Skill[];
}

export async function getSkillPrerequisites(): Promise<{ skill_id: string; prerequisite_id: string }[]> {
  const { data } = await supabase.from('skill_prerequisites').select('*');
  return data || [];
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data || []) as Goal[];
}

export async function getActiveRoadmap(userId: string): Promise<{ roadmap: Roadmap | null; items: RoadmapItem[] }> {
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('version', { ascending: false })
    .maybeSingle();

  if (!roadmap) return { roadmap: null, items: [] };

  const { data: items } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('roadmap_id', roadmap.id)
    .order('phase', { ascending: true })
    .order('order_index', { ascending: true });

  return { roadmap: roadmap as Roadmap, items: (items || []) as RoadmapItem[] };
}

export async function getLearningSessions(userId: string, limit = 10): Promise<LearningSession[]> {
  const { data } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(limit);
  return (data || []) as LearningSession[];
}

export async function getAssessments(userId: string): Promise<Assessment[]> {
  const { data } = await supabase
    .from('assessments')
    .select('*, skill:skills(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data || []) as unknown as Assessment[];
}

export async function getAssessmentAttempts(userId: string): Promise<AssessmentAttempt[]> {
  const { data } = await supabase
    .from('assessment_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data || []) as AssessmentAttempt[];
}

export async function getFeedback(userId: string): Promise<Feedback[]> {
  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data || []) as Feedback[];
}

export async function getResources(): Promise<Resource[]> {
  const { data } = await supabase.from('resources').select('*').order('title');
  return (data || []) as Resource[];
}

export async function getResourceInteractions(userId: string): Promise<ResourceInteraction[]> {
  const { data } = await supabase
    .from('resource_interactions')
    .select('*')
    .eq('user_id', userId);
  return (data || []) as ResourceInteraction[];
}

export async function getCognitiveTwin(userId: string): Promise<CognitiveTwin | null> {
  const { data } = await supabase
    .from('cognitive_twins')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as CognitiveTwin | null;
}

export async function getDriftRecords(userId: string, limit = 5): Promise<DriftRecord[]> {
  const { data } = await supabase
    .from('drift_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as DriftRecord[];
}

export async function getShadowPredictions(userId: string, limit = 3): Promise<ShadowPrediction[]> {
  const { data } = await supabase
    .from('shadow_predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as ShadowPrediction[];
}

export async function getRetentionRecords(userId: string): Promise<RetentionRecord[]> {
  const { data } = await supabase
    .from('retention_records')
    .select('*, skill:skills(*)')
    .eq('user_id', userId)
    .order('next_review', { ascending: true });
  return (data || []) as unknown as RetentionRecord[];
}

export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as Notification[];
}

export async function getAgentRuns(userId: string, limit = 20): Promise<AgentRun[]> {
  const { data } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as AgentRun[];
}

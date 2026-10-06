// ============================================================================
// Cognitive Twin Engine — Layer 2: Cognitive Intelligence
// Digital learner model tracking knowledge, skills, style, pace, retention
// ============================================================================

import type {
  CognitiveTwin,
  LearnerSkill,
  LearningPreferences,
  LearningSession,
  AssessmentAttempt,
  RetentionRecord,
  ResourceInteraction,
  Skill,
  ResourceType,
} from '@/types';

export interface CognitiveTwinInput {
  learnerSkills: (LearnerSkill & { skill?: Skill })[];
  allSkills: Skill[];
  preferences: LearningPreferences | null;
  sessions: LearningSession[];
  attempts: AssessmentAttempt[];
  retention: RetentionRecord[];
  interactions: ResourceInteraction[];
  resources: { id: string; resource_type: ResourceType }[];
}

export function runCognitiveTwin(
  userId: string,
  input: CognitiveTwinInput
): CognitiveTwin {
  const skillProfile: Record<string, number> = {};
  const knowledgeProfile: Record<string, number> = {};

  for (const ls of input.learnerSkills) {
    const skillName = ls.skill?.name || ls.skill_id;
    skillProfile[skillName] = ls.proficiency;
    knowledgeProfile[ls.skill?.category || 'general'] =
      Math.max(knowledgeProfile[ls.skill?.category || 'general'] || 0, ls.proficiency);
  }

  // Consistency: based on session regularity over last 14 days
  const now = Date.now();
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
  const recentSessions = input.sessions.filter(
    (s) => new Date(s.start_time).getTime() > fourteenDaysAgo
  );
  const uniqueDays = new Set(
    recentSessions.map((s) => new Date(s.start_time).toDateString())
  ).size;
  const consistencyScore = Math.min(100, Math.round((uniqueDays / 14) * 100));

  // Recent performance: average of last 5 attempts
  const recentAttempts = input.attempts.slice(0, 5);
  const recentPerformance = recentAttempts.length > 0
    ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / recentAttempts.length)
    : 50;

  // Confidence: average self_confidence from recent sessions
  const confidentSessions = recentSessions.filter((s) => s.self_confidence !== null);
  const confidenceScore = confidentSessions.length > 0
    ? Math.round(confidentSessions.reduce((sum, s) => sum + (s.self_confidence! * 20), 0) / confidentSessions.length)
    : 50;

  // Weak areas and strengths
  const weakAreas: string[] = [];
  const strengths: string[] = [];
  for (const ls of input.learnerSkills) {
    const name = ls.skill?.name || ls.skill_id;
    if (ls.proficiency < 40) weakAreas.push(name);
    else if (ls.proficiency >= 70) strengths.push(name);
  }

  // Completed topics
  const completedTopics = input.sessions
    .filter((s) => s.completion_percentage >= 100)
    .map((s) => s.topic);

  // Preferred resource types from interactions
  const resourceTypeCounts: Record<string, number> = {};
  const resourceMap = new Map(input.resources.map((r) => [r.id, r.resource_type]));
  for (const interaction of input.interactions) {
    const rType = resourceMap.get(interaction.resource_id);
    if (rType) {
      resourceTypeCounts[rType] = (resourceTypeCounts[rType] || 0) + 1;
    }
  }
  const preferredResourceTypes = Object.entries(resourceTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type as ResourceType);

  // Learning pace: compare estimated vs actual session duration
  const completedWithDuration = recentSessions.filter((s) => s.duration_minutes > 0);
  const avgDuration = completedWithDuration.length > 0
    ? completedWithDuration.reduce((sum, s) => sum + s.duration_minutes, 0) / completedWithDuration.length
    : 30;
  const learningPace = avgDuration > 45 ? 1.3 : avgDuration > 25 ? 1.0 : 0.7;
  const paceLabel = learningPace > 1.2 ? 'Fast' : learningPace < 0.9 ? 'Careful' : 'Normal';

  // Retention status
  const retentionState: Record<string, import('@/types').RetentionState> = {};
  let retentionTotal = 0;
  for (const r of input.retention) {
    retentionState[r.topic] = r.retention_state;
    retentionTotal += r.performance;
  }
  const retentionStatus = input.retention.length > 0
    ? Math.round(retentionTotal / input.retention.length)
    : 50;

  return {
    id: '',
    user_id: userId,
    knowledge_profile: knowledgeProfile,
    skill_profile: skillProfile,
    dominant_style: input.preferences?.dominant_style || 'mixed',
    secondary_style: input.preferences?.secondary_style || null,
    consistency_score: consistencyScore,
    recent_performance: recentPerformance,
    confidence_score: confidenceScore,
    weak_areas: weakAreas,
    strengths: strengths,
    completed_topics: completedTopics,
    retention_state: retentionState,
    preferred_resource_types: preferredResourceTypes,
    learning_pace: learningPace,
    pace_label: paceLabel,
    retention_status: retentionStatus,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export async function persistCognitiveTwin(
  userId: string,
  twin: CognitiveTwin,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  await supabase.from('cognitive_twins').upsert({
    user_id: userId,
    knowledge_profile: twin.knowledge_profile,
    skill_profile: twin.skill_profile,
    dominant_style: twin.dominant_style,
    secondary_style: twin.secondary_style,
    consistency_score: twin.consistency_score,
    recent_performance: twin.recent_performance,
    confidence_score: twin.confidence_score,
    weak_areas: twin.weak_areas,
    strengths: twin.strengths,
    completed_topics: twin.completed_topics,
    retention_state: twin.retention_state,
    preferred_resource_types: twin.preferred_resource_types,
    learning_pace: twin.learning_pace,
    pace_label: twin.pace_label,
    retention_status: twin.retention_status,
    updated_at: new Date().toISOString(),
  });
}

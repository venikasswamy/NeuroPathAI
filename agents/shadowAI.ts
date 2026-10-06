// ============================================================================
// Shadow AI — Layer 4: Adaptive Intelligence
// Educational risk indicator (NOT a medical system)
// ============================================================================

import type {
  ShadowPrediction,
  RiskLevel,
  RiskFactor,
  DriftRecord,
  CognitiveTwin,
  LearnerSkill,
  Skill,
  RoadmapItem,
} from '@/types';

export interface ShadowAIInput {
  drift: DriftRecord | null;
  twin: CognitiveTwin | null;
  learnerSkills: (LearnerSkill & { skill?: Skill })[];
  roadmapItems: RoadmapItem[];
  daysUntilDeadline: number;
  totalRoadmapItems: number;
  completedItems: number;
}

export function runShadowAI(userId: string, input: ShadowAIInput): ShadowPrediction {
  const riskFactors: RiskFactor[] = [];
  const evidence: string[] = [];

  // Factor 1: Drift status
  if (input.drift && input.drift.status !== 'STABLE') {
    const level: RiskLevel = input.drift.status === 'DRIFTING' ? 'HIGH' : 'MEDIUM';
    riskFactors.push({
      factor: 'learning_drift',
      level,
      description: `Drift monitor detected ${input.drift.status.toLowerCase()} behavior: ${input.drift.explanation}`,
    });
    evidence.push(`Drift score: ${input.drift.drift_score}/100 (${input.drift.status})`);
  }

  // Factor 2: Low consistency
  if (input.twin && input.twin.consistency_score < 40) {
    riskFactors.push({
      factor: 'low_consistency',
      level: input.twin.consistency_score < 20 ? 'HIGH' : 'MEDIUM',
      description: `Learning consistency is ${input.twin.consistency_score}%. Irregular study pattern detected.`,
    });
    evidence.push(`Consistency score: ${input.twin.consistency_score}%`);
  }

  // Factor 3: Weak skills count
  const weakSkills = input.learnerSkills.filter((ls) => ls.proficiency < 40);
  if (weakSkills.length >= 3) {
    riskFactors.push({
      factor: 'repeated_weak_skills',
      level: weakSkills.length >= 5 ? 'HIGH' : 'MEDIUM',
      description: `${weakSkills.length} skills below 40% proficiency: ${weakSkills.slice(0, 3).map((s) => s.skill?.name || s.skill_id).join(', ')}${weakSkills.length > 3 ? '...' : ''}`,
    });
    evidence.push(`${weakSkills.length} weak skills identified`);
  }

  // Factor 4: Deadline pressure
  if (input.daysUntilDeadline < 30 && input.completedItems < input.totalRoadmapItems * 0.7) {
    riskFactors.push({
      factor: 'deadline_pressure',
      level: input.daysUntilDeadline < 14 ? 'HIGH' : 'MEDIUM',
      description: `${input.daysUntilDeadline} days until deadline but only ${input.completedItems}/${input.totalRoadmapItems} roadmap items completed.`,
    });
    evidence.push(`Progress: ${input.completedItems}/${input.totalRoadmapItems} items, ${input.daysUntilDeadline} days left`);
  }

  // Factor 5: Poor recent performance
  if (input.twin && input.twin.recent_performance < 50) {
    riskFactors.push({
      factor: 'poor_performance',
      level: input.twin.recent_performance < 30 ? 'HIGH' : 'MEDIUM',
      description: `Recent assessment performance is ${input.twin.recent_performance}%. Below the mastery threshold.`,
    });
    evidence.push(`Recent performance: ${input.twin.recent_performance}%`);
  }

  // Factor 6: Retention weakness
  if (input.twin && input.twin.retention_status < 40) {
    riskFactors.push({
      factor: 'retention_weakness',
      level: 'MEDIUM',
      description: `Retention status is ${input.twin.retention_status}%. Topics may need more frequent review.`,
    });
    evidence.push(`Retention status: ${input.twin.retention_status}%`);
  }

  // Factor 7: Insufficient practice (no practice items completed)
  const practiceItems = input.roadmapItems.filter((i) => i.item_type === 'practice');
  const completedPractice = practiceItems.filter((i) => i.status === 'completed');
  if (practiceItems.length > 0 && completedPractice.length === 0) {
    riskFactors.push({
      factor: 'insufficient_practice',
      level: 'MEDIUM',
      description: 'No practice exercises completed yet. Practice is essential for skill mastery.',
    });
    evidence.push('0 practice items completed');
  }

  // Determine overall risk level
  const highCount = riskFactors.filter((f) => f.level === 'HIGH').length;
  const mediumCount = riskFactors.filter((f) => f.level === 'MEDIUM').length;
  let riskLevel: RiskLevel = 'LOW';
  if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) riskLevel = 'HIGH';
  else if (highCount >= 1 || mediumCount >= 2) riskLevel = 'MEDIUM';

  // Recommended intervention
  let intervention = 'Continue your current learning pace. No intervention needed.';
  if (riskLevel === 'HIGH') {
    intervention = 'Immediate intervention recommended: review weak skills, schedule extra practice sessions, and consider adjusting your roadmap deadline.';
  } else if (riskLevel === 'MEDIUM') {
    intervention = 'Recommended: increase study frequency, focus on weak skills, and complete pending practice exercises.';
  }

  const confidence = Math.min(95, 40 + riskFactors.length * 12);

  return {
    id: '',
    user_id: userId,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    evidence,
    recommended_intervention: intervention,
    confidence,
    created_at: new Date().toISOString(),
  };
}

export async function persistShadowPrediction(
  userId: string,
  prediction: ShadowPrediction,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  await supabase.from('shadow_predictions').insert({
    user_id: userId,
    risk_level: prediction.risk_level,
    risk_factors: prediction.risk_factors,
    evidence: prediction.evidence,
    recommended_intervention: prediction.recommended_intervention,
    confidence: prediction.confidence,
  });
}

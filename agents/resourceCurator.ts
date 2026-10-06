// ============================================================================
// Resource Curator — Layer 3: Execution
// Recommends resources based on skill gaps, style, difficulty, and interactions
// ============================================================================

import type {
  Resource,
  LearnerSkill,
  LearningPreferences,
  ResourceInteraction,
  Skill,
  LearningStyle,
  Difficulty,
  RecommendationResult,
} from '@/types';

export interface ResourceCurationInput {
  resources: Resource[];
  learnerSkills: (LearnerSkill & { skill?: Skill })[];
  interactions: ResourceInteraction[];
  preferences: LearningPreferences | null;
  gapSkillIds: string[];
}

export function runResourceCurator(input: ResourceCurationInput): RecommendationResult[] {
  const { resources, learnerSkills, interactions, preferences, gapSkillIds } = input;

  const interactedResourceIds = new Set(interactions.map((i) => i.resource_id));
  const completedResourceIds = new Set(
    interactions.filter((i) => i.interaction_type === 'completed').map((i) => i.resource_id)
  );
  const skippedResourceIds = new Set(
    interactions.filter((i) => i.interaction_type === 'skipped').map((i) => i.resource_id)
  );

  const dominantStyle = preferences?.dominant_style || 'mixed';
  const preferredDifficulty: Difficulty = preferences?.preferred_difficulty || 'intermediate';

  const results: RecommendationResult[] = [];

  for (const resource of resources) {
    // Skip completed or skipped resources
    if (completedResourceIds.has(resource.id) || skippedResourceIds.has(resource.id)) continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. Skill gap match (highest weight)
    if (resource.skill_id && gapSkillIds.includes(resource.skill_id)) {
      score += 40;
      reasons.push('matches a skill gap');
    }

    // 2. Learning style match
    if (resource.learning_styles.includes(dominantStyle as any)) {
      score += 25;
      reasons.push('matches your learning style');
    }
    if (preferences?.secondary_style && resource.learning_styles.includes(preferences.secondary_style as any)) {
      score += 10;
      reasons.push('matches secondary style');
    }

    // 3. Difficulty match
    if (resource.difficulty === preferredDifficulty) {
      score += 15;
      reasons.push('appropriate difficulty');
    } else if (resource.difficulty === 'beginner' && preferredDifficulty === 'intermediate') {
      score += 8;
      reasons.push('foundational resource');
    }

    // 4. Resource type variety (prefer types not yet interacted with)
    const typeInteractions = interactions.filter((i) => {
      const r = resources.find((res) => res.id === i.resource_id);
      return r?.resource_type === resource.resource_type;
    }).length;
    if (typeInteractions === 0) {
      score += 10;
      reasons.push('new resource type for you');
    }

    // 5. Not yet viewed bonus
    if (!interactedResourceIds.has(resource.id)) {
      score += 5;
      reasons.push('unviewed');
    }

    if (score > 0) {
      results.push({
        resourceId: resource.id,
        title: resource.title,
        reason: reasons.join(', '),
        score,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

export async function recordResourceInteraction(
  userId: string,
  resourceId: string,
  interactionType: 'viewed' | 'completed' | 'skipped' | 'bookmarked',
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  await supabase.from('resource_interactions').insert({
    user_id: userId,
    resource_id: resourceId,
    interaction_type: interactionType,
  });
}

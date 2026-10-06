// ============================================================================
// Feedback Engine — Subsystem used by the adaptive loop (NOT a tenth agent)
// Collects and applies learner feedback to influence recommendations & planning
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type { LearningStyle } from '@/types';

export interface FeedbackInput {
  userId: string;
  sessionId?: string | null;
  assessmentId?: string | null;
  resourceId?: string | null;
  roadmapItemId?: string | null;
  difficultyRating: number; // 1-5
  confidence: number; // 1-5
  satisfaction: number; // 1-5
  resourceUsefulness?: number | null;
  comments?: string | null;
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    user_id: input.userId,
    session_id: input.sessionId || null,
    assessment_id: input.assessmentId || null,
    resource_id: input.resourceId || null,
    roadmap_item_id: input.roadmapItemId || null,
    difficulty_rating: input.difficultyRating,
    confidence: input.confidence,
    satisfaction: input.satisfaction,
    resource_usefulness: input.resourceUsefulness || null,
    comments: input.comments || null,
  });

  if (error) throw error;

  // Adjust learning style profile based on resource feedback
  if (input.resourceId && input.resourceUsefulness !== null) {
    const { data: resource } = await supabase
      .from('resources')
      .select('learning_styles')
      .eq('id', input.resourceId)
      .maybeSingle();

    if (resource?.learning_styles && input.resourceUsefulness != null && input.resourceUsefulness >= 4) {
      // Positive feedback on a resource with specific styles — reinforce style preference
      const { data: prefs } = await supabase
        .from('learning_preferences')
        .select('*')
        .eq('user_id', input.userId)
        .maybeSingle();

      if (prefs) {
        const signals = (prefs.style_signals as Record<string, string[]>) || {};
        const behaviorSignals = [...(signals.behavior || [])];
        for (const style of resource.learning_styles) {
          behaviorSignals.push(`positive_feedback: ${style}`);
        }

        const newConfidence = Math.min(95, (prefs.style_confidence || 40) + 5);

        await supabase
          .from('learning_preferences')
          .update({
            style_signals: { ...signals, behavior: behaviorSignals },
            style_confidence: newConfidence,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', input.userId);
      }
    }
  }

  // High difficulty feedback → signal roadmap pace adjustment
  if (input.difficultyRating >= 4 && input.roadmapItemId) {
    await supabase.from('notifications').insert({
      user_id: input.userId,
      type: 'revision_needed',
      title: 'Difficulty Reported',
      message: 'You reported high difficulty. Consider reviewing prerequisites or slowing down.',
      link: '/roadmap',
    });
  }
}

export async function getAverageFeedback(userId: string): Promise<{
  avgDifficulty: number;
  avgConfidence: number;
  avgSatisfaction: number;
  count: number;
}> {
  const { data } = await supabase
    .from('feedback')
    .select('difficulty_rating, confidence, satisfaction')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) {
    return { avgDifficulty: 3, avgConfidence: 3, avgSatisfaction: 3, count: 0 };
  }

  return {
    avgDifficulty: data.reduce((s, f) => s + f.difficulty_rating, 0) / data.length,
    avgConfidence: data.reduce((s, f) => s + f.confidence, 0) / data.length,
    avgSatisfaction: data.reduce((s, f) => s + f.satisfaction, 0) / data.length,
    count: data.length,
  };
}

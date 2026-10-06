// ============================================================================
// Style Profiler — Layer 1: Perception
// Determines dominant/secondary learning style from onboarding and behavior
// ============================================================================

import type { LearningPreferences, LearningStyle, ResourceInteraction } from '@/types';

export interface StyleProfileOutput {
  dominantStyle: LearningStyle;
  secondaryStyle: LearningStyle | null;
  confidence: number;
  signals: Record<string, string[]>;
}

const STYLE_MAP: Record<string, LearningStyle> = {
  hands_on: 'hands_on',
  visual: 'visual',
  reading: 'reading',
  video: 'video',
  project_based: 'project_based',
  mixed: 'mixed',
};

export function runStyleProfiler(
  currentPreferences: LearningPreferences | null,
  onboardingStyles: LearningStyle[],
  interactions: { resource_type: string; learning_styles: string[] }[] = []
): StyleProfileOutput {
  const signals: Record<string, string[]> = {
    onboarding: onboardingStyles.map((s) => s),
    behavior: [],
  };

  // Start with onboarding styles
  const styleScores: Record<string, number> = {};
  for (const style of onboardingStyles) {
    styleScores[style] = (styleScores[style] || 0) + 3;
  }

  // Adjust based on resource interactions (behavior signals)
  const behaviorCounts: Record<string, number> = {};
  for (const interaction of interactions) {
    for (const style of interaction.learning_styles) {
      const mapped = STYLE_MAP[style];
      if (mapped) {
        behaviorCounts[mapped] = (behaviorCounts[mapped] || 0) + 1;
        signals.behavior.push(`${interaction.resource_type} → ${mapped}`);
      }
    }
  }

  for (const [style, count] of Object.entries(behaviorCounts)) {
    styleScores[style] = (styleScores[style] || 0) + count;
  }

  // Merge with current preferences (if re-profiling)
  if (currentPreferences) {
    styleScores[currentPreferences.dominant_style] = (styleScores[currentPreferences.dominant_style] || 0) + 2;
    if (currentPreferences.secondary_style) {
      styleScores[currentPreferences.secondary_style] = (styleScores[currentPreferences.secondary_style] || 0) + 1;
    }
  }

  const sorted = Object.entries(styleScores).sort((a, b) => b[1] - a[1]);
  const dominantStyle = (sorted[0]?.[0] as LearningStyle) || 'mixed';
  const secondaryStyle = sorted[1]?.[0] as LearningStyle | null || null;

  // Confidence based on margin between top two styles
  const topScore = sorted[0]?.[1] || 0;
  const secondScore = sorted[1]?.[1] || 0;
  const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0);
  const confidence = totalScore > 0
    ? Math.min(95, Math.round(40 + ((topScore - secondScore) / totalScore) * 55))
    : 50;

  return {
    dominantStyle,
    secondaryStyle,
    confidence,
    signals,
  };
}

export async function persistStyleProfile(
  userId: string,
  output: StyleProfileOutput,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  await supabase.from('learning_preferences').upsert({
    user_id: userId,
    dominant_style: output.dominantStyle,
    secondary_style: output.secondaryStyle,
    style_confidence: output.confidence,
    style_signals: output.signals,
    updated_at: new Date().toISOString(),
  });
}

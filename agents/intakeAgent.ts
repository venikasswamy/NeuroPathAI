// ============================================================================
// Intake Agent — Layer 1: Perception
// Validates onboarding data, normalizes learner info, prepares learner context
// ============================================================================

import type {
  LearnerContext,
  LearnerProfile,
  LearningPreferences,
  ProficiencyLevel,
} from '@/types';

export interface IntakeOutput {
  learner: LearnerContext;
  validated: boolean;
  constraints: {
    hoursPerDay: number;
    daysPerWeek: number;
    weeklyHours: number;
    totalDaysUntilDeadline: number;
  };
  normalized: {
    targetRole: string;
    currentLevel: ProficiencyLevel;
    challenges: string[];
  };
}

export function runIntakeAgent(
  profile: LearnerProfile,
  preferences: LearningPreferences | null,
  name: string,
  userId: string
): IntakeOutput {
  const now = new Date();
  const deadline = new Date(profile.target_deadline);
  const totalDays = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const weeklyHours = profile.hours_per_day * profile.days_per_week;

  const learner: LearnerContext = {
    userId,
    name,
    goal: profile.target_career,
    targetRole: profile.target_role,
    currentLevel: profile.current_level,
    hoursPerDay: profile.hours_per_day,
    daysPerWeek: profile.days_per_week,
    targetDeadline: profile.target_deadline,
    learningChallenges: profile.learning_challenges || [],
    preferences,
  };

  return {
    learner,
    validated: true,
    constraints: {
      hoursPerDay: profile.hours_per_day,
      daysPerWeek: profile.days_per_week,
      weeklyHours,
      totalDaysUntilDeadline: totalDays,
    },
    normalized: {
      targetRole: profile.target_role.trim(),
      currentLevel: profile.current_level,
      challenges: profile.learning_challenges || [],
    },
  };
}

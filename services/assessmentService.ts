// ============================================================================
// Assessment Service — Question selection, scoring, mastery calculation
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type { AssessmentQuestion, MasteryState, AssessmentAttempt } from '@/types';

const MASTERY_THRESHOLD = 70;
const DEVELOPING_THRESHOLD = 50;

export function calculateMastery(scorePercent: number): MasteryState {
  if (scorePercent >= MASTERY_THRESHOLD) return 'MASTERED';
  if (scorePercent >= DEVELOPING_THRESHOLD) return 'IN_PROGRESS';
  return 'NEEDS_REVISION';
}

export function calculateScore(
  answers: Record<string, string>,
  questions: AssessmentQuestion[]
): { correct: number; total: number; percent: number } {
  let correct = 0;
  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (userAnswer && userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
      correct++;
    }
  }
  const total = questions.length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, percent };
}

export async function getQuestionsForSkill(skillId: string, limit = 5): Promise<AssessmentQuestion[]> {
  const { data } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('skill_id', skillId)
    .limit(limit);

  return (data || []) as AssessmentQuestion[];
}

export async function createAssessment(
  userId: string,
  skillId: string,
  skillName: string,
  roadmapItemId?: string | null
): Promise<string | null> {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id: userId,
      skill_id: skillId,
      roadmap_item_id: roadmapItemId || null,
      title: `${skillName} Assessment`,
      description: `Assessment for ${skillName}`,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return null;
  return data.id;
}

export async function submitAssessment(
  userId: string,
  assessmentId: string,
  answers: Record<string, string>,
  questions: AssessmentQuestion[],
  timeTakenSeconds: number
): Promise<{ attempt: AssessmentAttempt; mastery: MasteryState; percent: number }> {
  const { correct, total, percent } = calculateScore(answers, questions);
  const mastery = calculateMastery(percent);

  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      user_id: userId,
      answers,
      score: correct,
      max_score: total,
      mastery_state: mastery,
      time_taken_seconds: timeTakenSeconds,
    })
    .select()
    .single();

  if (error) throw error;

  // Update assessment status
  await supabase
    .from('assessments')
    .update({
      status: 'completed',
      score: correct,
      completed_at: new Date().toISOString(),
    })
    .eq('id', assessmentId);

  // Update learner skill proficiency
  const assessment = await supabase
    .from('assessments')
    .select('skill_id')
    .eq('id', assessmentId)
    .maybeSingle();

  if (assessment.data?.skill_id) {
    const { data: existingSkill } = await supabase
      .from('learner_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', assessment.data.skill_id)
      .maybeSingle();

    const currentProf = existingSkill?.proficiency ?? 0;
    // Blend: 60% new assessment, 40% previous knowledge
    const newProf = Math.round(currentProf * 0.4 + percent * 0.6);
    const status = newProf >= 70 ? 'mastered' : newProf >= 40 ? 'developing' : newProf > 0 ? 'weak' : 'missing';

    await supabase.from('learner_skills').upsert({
      user_id: userId,
      skill_id: assessment.data.skill_id,
      proficiency: newProf,
      status,
      last_assessed: new Date().toISOString(),
      evidence: [...(existingSkill?.evidence || []), `assessment:${percent}%`],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,skill_id' });

    // Generate notifications based on result
    if (mastery === 'NEEDS_REVISION') {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'revision_needed',
        title: 'Revision Needed',
        message: `Your assessment score was ${percent}%. Review the material and try again.`,
        link: '/assessments',
      });
    } else if (mastery === 'MASTERED') {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'upcoming_milestone',
        title: 'Skill Mastered!',
        message: `You scored ${percent}% on your assessment. This skill is now marked as mastered.`,
        link: '/skills',
      });
    }
  }

  return { attempt: data as AssessmentAttempt, mastery, percent };
}

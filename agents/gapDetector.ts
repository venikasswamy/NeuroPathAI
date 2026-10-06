// ============================================================================
// Gap Detector — Layer 1: Perception
// Compares target role requirements vs learner current skills
// Identifies mastered, developing, weak, missing, and prerequisite gaps
// ============================================================================

import type {
  Skill,
  LearnerSkill,
  SkillGapResult,
  SkillGapItem,
  PrerequisiteGap,
  SkillStatus,
} from '@/types';

const MASTERY_THRESHOLD = 70;
const DEVELOPING_THRESHOLD = 40;

export function classifySkill(proficiency: number, target: number): SkillStatus {
  if (proficiency >= target) return 'mastered';
  if (proficiency >= MASTERY_THRESHOLD) return 'developing';
  if (proficiency > 0) return 'weak';
  return 'missing';
}

export function runGapDetector(
  allSkills: Skill[],
  learnerSkills: (LearnerSkill & { skill?: Skill })[],
  prerequisites: { skill_id: string; prerequisite_id: string }[],
  skillIdMap: Map<string, Skill>
): SkillGapResult {
  const learnerSkillMap = new Map<string, LearnerSkill>();
  for (const ls of learnerSkills) {
    learnerSkillMap.set(ls.skill_id, ls);
  }

  const mastered: SkillGapItem[] = [];
  const developing: SkillGapItem[] = [];
  const weak: SkillGapItem[] = [];
  const missing: SkillGapItem[] = [];
  const prerequisiteGaps: PrerequisiteGap[] = [];

  // For each skill in the catalog, determine its status
  for (const skill of allSkills) {
    const ls = learnerSkillMap.get(skill.id);
    const proficiency = ls?.proficiency ?? 0;
    const target = skill.target_proficiency;
    const gap = Math.max(0, target - proficiency);

    const item: SkillGapItem = {
      skillId: skill.id,
      skillName: skill.name,
      proficiency,
      targetProficiency: target,
      gap,
    };

    const status = classifySkill(proficiency, target);
    if (status === 'mastered') mastered.push(item);
    else if (status === 'developing') developing.push(item);
    else if (status === 'weak') weak.push(item);
    else missing.push(item);

    // Check prerequisite gaps for skills the learner is attempting
    if (ls && proficiency > 0) {
      const prereqs = prerequisites.filter((p) => p.skill_id === skill.id);
      for (const prereq of prereqs) {
        const prereqSkill = skillIdMap.get(prereq.prerequisite_id);
        const prereqLs = learnerSkillMap.get(prereq.prerequisite_id);
        const prereqProf = prereqLs?.proficiency ?? 0;

        if (prereqProf < DEVELOPING_THRESHOLD && prereqSkill) {
          prerequisiteGaps.push({
            skillId: skill.id,
            skillName: skill.name,
            missingPrerequisite: prereq.prerequisite_id,
            missingPrerequisiteName: prereqSkill.name,
          });
        }
      }
    }
  }

  // Overall score: average of all proficiencies weighted by target
  const allItems = [...mastered, ...developing, ...weak, ...missing];
  const overallScore = allItems.length > 0
    ? Math.round(allItems.reduce((sum, item) => sum + (item.proficiency / item.targetProficiency) * 100, 0) / allItems.length)
    : 0;

  return {
    mastered,
    developing,
    weak,
    missing,
    prerequisiteGaps,
    overallScore,
  };
}

export async function persistLearnerSkills(
  userId: string,
  gapResult: SkillGapResult,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  const all = [...gapResult.mastered, ...gapResult.developing, ...gapResult.weak, ...gapResult.missing];
  for (const item of all) {
    const status = classifySkill(item.proficiency, item.targetProficiency);
    await supabase.from('learner_skills').upsert({
      user_id: userId,
      skill_id: item.skillId,
      proficiency: item.proficiency,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,skill_id' });
  }
}

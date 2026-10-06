// ============================================================================
// Adaptive Planner — Layer 3: Execution
// Generates personalized roadmaps using prerequisites, study time, and deadline
// ============================================================================

import type {
  Skill,
  LearnerSkill,
  Roadmap,
  RoadmapItem,
  Goal,
  MasteryState,
  SkillGapResult,
  Difficulty,
  LearningPreferences,
} from '@/types';

export interface RoadmapPlanInput {
  goal: Goal;
  allSkills: Skill[];
  learnerSkills: (LearnerSkill & { skill?: Skill })[];
  prerequisites: { skill_id: string; prerequisite_id: string }[];
  gapResult: SkillGapResult;
  preferences: LearningPreferences | null;
  weeklyHours: number;
  totalDays: number;
}

export interface RoadmapPlanOutput {
  roadmap: Omit<Roadmap, 'id' | 'created_at' | 'updated_at'>;
  items: Array<Omit<RoadmapItem, 'id' | 'created_at' | 'updated_at' | 'roadmap_id' | 'user_id'>>;
}

const ITEM_TEMPLATES: {
  type: RoadmapItem['item_type'];
  titleSuffix: string;
  minutes: number;
}[] = [
  { type: 'lesson', titleSuffix: 'Fundamentals', minutes: 45 },
  { type: 'practice', titleSuffix: 'Practice Exercises', minutes: 30 },
  { type: 'assessment', titleSuffix: 'Assessment', minutes: 20 },
  { type: 'project', titleSuffix: 'Applied Project', minutes: 60 },
];

// Topological sort respecting prerequisites
function sortSkillsByPrerequisites(
  skills: Skill[],
  prerequisites: { skill_id: string; prerequisite_id: string }[]
): Skill[] {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const s of skills) {
    adj.set(s.id, []);
    inDegree.set(s.id, 0);
  }

  for (const p of prerequisites) {
    if (adj.has(p.skill_id) && adj.has(p.prerequisite_id)) {
      adj.get(p.prerequisite_id)!.push(p.skill_id);
      inDegree.set(p.skill_id, (inDegree.get(p.skill_id) || 0) + 1);
    }
  }

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sorted: Skill[] = [];
  const skillMap = new Map(skills.map((s) => [s.id, s]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const skill = skillMap.get(id);
    if (skill) sorted.push(skill);
    for (const next of adj.get(id) || []) {
      inDegree.set(next, (inDegree.get(next) || 0) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  // Add any remaining (circular or disconnected)
  for (const s of skills) {
    if (!sorted.find((x) => x.id === s.id)) sorted.push(s);
  }

  return sorted;
}

export function runAdaptivePlanner(input: RoadmapPlanInput): RoadmapPlanOutput {
  const { goal, allSkills, learnerSkills, prerequisites, gapResult, weeklyHours, totalDays } = input;

  // Skills that need to be learned (not mastered)
  const learnerSkillMap = new Map(learnerSkills.map((ls) => [ls.skill_id, ls]));
  const skillsToLearn = allSkills.filter((s) => {
    const ls = learnerSkillMap.get(s.id);
    return !ls || ls.proficiency < s.target_proficiency;
  });

  // Sort by prerequisites (topological order)
  const sortedSkills = sortSkillsByPrerequisites(skillsToLearn, prerequisites);

  // Determine number of phases based on skill count and time
  const totalSkillItems = sortedSkills.length;
  const skillsPerPhase = Math.max(2, Math.ceil(totalSkillItems / Math.max(1, Math.ceil(totalDays / 30))));
  const phases = Math.max(1, Math.ceil(totalSkillItems / skillsPerPhase));

  // Estimated hours
  const estimatedHours = sortedSkills.length * 2.5; // ~2.5 hours per skill on average

  const items: Array<Omit<RoadmapItem, 'id' | 'created_at' | 'updated_at' | 'roadmap_id' | 'user_id'>> = [];
  let orderIndex = 0;
  let currentPhase = 1;
  let itemsInPhase = 0;
  let phaseTitle = `Phase ${currentPhase}: Foundation`;

  for (const skill of sortedSkills) {
    if (itemsInPhase >= skillsPerPhase) {
      currentPhase++;
      itemsInPhase = 0;
      phaseTitle = `Phase ${currentPhase}: ${currentPhase === 2 ? 'Core Skills' : currentPhase === 3 ? 'Advanced Topics' : 'Specialization'}`;
    }

    const ls = learnerSkillMap.get(skill.id);
    const currentProf = ls?.proficiency ?? 0;
    const isWeak = currentProf > 0 && currentProf < 40;

    // Generate items for this skill
    const prereqNames = prerequisites
      .filter((p) => p.skill_id === skill.id)
      .map((p) => allSkills.find((s) => s.id === p.prerequisite_id)?.name || p.prerequisite_id);

    for (const template of ITEM_TEMPLATES) {
      orderIndex++;
      itemsInPhase++;

      let masteryState: MasteryState = 'NOT_STARTED';
      let status: RoadmapItem['status'] = 'available';

      // First item is available, subsequent are locked until previous is done
      if (orderIndex > 1) {
        status = 'locked';
      }

      // If learner already has some proficiency, adjust
      if (template.type === 'lesson' && currentProf >= 40) {
        masteryState = 'IN_PROGRESS';
        if (orderIndex === 1) status = 'available';
      }
      if (template.type === 'assessment' && currentProf >= 70) {
        masteryState = 'MASTERED';
        status = 'completed';
      }

      // If skill is weak, add revision marker
      if (isWeak && template.type === 'practice') {
        masteryState = 'NEEDS_REVISION';
      }

      items.push({
        phase: currentPhase,
        phase_title: phaseTitle,
        order_index: orderIndex,
        skill_id: skill.id,
        title: `${skill.name}: ${template.titleSuffix}`,
        description: `${template.titleSuffix} for ${skill.name}. ${skill.description || ''}`,
        item_type: template.type,
        mastery_state: masteryState,
        estimated_minutes: template.minutes,
        prerequisites: prereqNames,
        depends_on: orderIndex > 1 ? [String(orderIndex - 1)] : [],
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      });
    }
  }

  // Add a final revision/capstone item
  if (sortedSkills.length > 0) {
    orderIndex++;
    items.push({
      phase: currentPhase,
      phase_title: phaseTitle,
      order_index: orderIndex,
      skill_id: null,
      title: 'Capstone Review & Revision',
      description: 'Comprehensive review of all topics covered in the roadmap.',
      item_type: 'revision',
      mastery_state: 'NOT_STARTED',
      estimated_minutes: 90,
      prerequisites: [],
      depends_on: [String(orderIndex - 1)],
      status: 'locked',
      completed_at: null,
    });
  }

  const roadmap: Omit<Roadmap, 'id' | 'created_at' | 'updated_at'> = {
    user_id: goal.user_id,
    goal_id: goal.id,
    title: goal.title,
    description: goal.description || `Personalized roadmap for ${goal.target_role}`,
    total_phases: phases,
    estimated_hours: Math.round(estimatedHours),
    status: 'active',
    version: 1,
  };

  return { roadmap, items };
}

export async function persistRoadmap(
  userId: string,
  plan: RoadmapPlanOutput,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<{ roadmap: Roadmap; items: RoadmapItem[] } | null> {
  // Archive old roadmaps
  await supabase
    .from('roadmaps')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data: roadmapData, error: roadmapError } = await supabase
    .from('roadmaps')
    .insert(plan.roadmap)
    .select()
    .single();

  if (roadmapError || !roadmapData) return null;

  const itemsToInsert = plan.items.map((item) => ({
    ...item,
    roadmap_id: roadmapData.id,
    user_id: userId,
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from('roadmap_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) return null;

  return {
    roadmap: roadmapData as Roadmap,
    items: (itemsData || []) as RoadmapItem[],
  };
}

/**
 * Adapts the roadmap after a weak assessment result.
 * Marks the assessed item as NEEDS_REVISION, adds revision practice,
 * and delays dependent items.
 */
export async function adaptRoadmapAfterFailure(
  userId: string,
  roadmapId: string,
  failedItemId: string,
  failedSkillName: string,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  // Mark the failed item as NEEDS_REVISION
  await supabase
    .from('roadmap_items')
    .update({ mastery_state: 'NEEDS_REVISION', updated_at: new Date().toISOString() })
    .eq('id', failedItemId);

  // Insert a revision practice item after the failed item
  const { data: failedItem } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('id', failedItemId)
    .single();

  if (failedItem) {
    await supabase.from('roadmap_items').insert({
      roadmap_id: roadmapId,
      user_id: userId,
      phase: failedItem.phase,
      phase_title: failedItem.phase_title,
      order_index: failedItem.order_index + 0.5,
      skill_id: failedItem.skill_id,
      title: `Revision: ${failedSkillName}`,
      description: `Targeted revision practice for ${failedSkillName} based on weak assessment performance.`,
      item_type: 'revision',
      mastery_state: 'NOT_STARTED',
      estimated_minutes: 30,
      prerequisites: [],
      depends_on: [failedItemId],
      status: 'available',
      completed_at: null,
    });

    // Delay dependent items in later phases
    await supabase
      .from('roadmap_items')
      .update({ status: 'delayed', updated_at: new Date().toISOString() })
      .eq('roadmap_id', roadmapId)
      .eq('user_id', userId)
      .gt('phase', failedItem.phase)
      .eq('status', 'locked');
  }
}

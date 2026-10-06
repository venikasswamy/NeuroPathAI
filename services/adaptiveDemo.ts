// ============================================================================
// Adaptive Demo Service — Runs a complete demonstration of the adaptive loop
// Creates demo learner data, runs all agents, simulates assessment failure,
// triggers roadmap adaptation, drift detection, and risk prediction
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import { runIntakeAgent } from '@/agents/intakeAgent';
import { runStyleProfiler, persistStyleProfile } from '@/agents/styleProfiler';
import { runGapDetector } from '@/agents/gapDetector';
import { runCognitiveTwin, persistCognitiveTwin } from '@/agents/cognitiveTwin';
import { runAdaptivePlanner, persistRoadmap, adaptRoadmapAfterFailure } from '@/agents/adaptivePlanner';
import { runResourceCurator } from '@/agents/resourceCurator';
import { runDriftMonitor, persistDriftRecord } from '@/agents/driftMonitor';
import { runShadowAI, persistShadowPrediction } from '@/agents/shadowAI';
import { runMemoryRetention, persistRetentionRecord } from '@/agents/memoryRetention';
import { calculateMastery } from '@/services/assessmentService';
import type { AgentRunTrace } from '@/types';

export interface DemoResult {
  success: boolean;
  trace: AgentRunTrace[];
  summary: string;
  error?: string;
}

const DEMO_SKILLS = [
  { slug: 'python', proficiency: 55 },
  { slug: 'statistics', proficiency: 35 },
  { slug: 'machine-learning', proficiency: 20 },
  { slug: 'sql', proficiency: 40 },
  { slug: 'data-structures', proficiency: 30 },
];

export async function runAdaptiveDemo(userId: string): Promise<DemoResult> {
  const trace: AgentRunTrace[] = [];
  const labels: Record<string, string> = {
    intake: 'Intake Agent',
    style_profiler: 'Style Profiler',
    gap_detector: 'Gap Detector',
    cognitive_twin: 'Cognitive Twin Engine',
    adaptive_planner: 'Adaptive Planner',
    resource_curator: 'Resource Curator',
    drift_monitor: 'Drift Monitor',
    shadow_ai: 'Shadow AI',
    memory_retention: 'Memory Retention Agent',
  };

  function addTrace(name: string, input: string, output: string) {
    const startedAt = new Date().toISOString();
    trace.push({
      agent: name as any,
      label: labels[name],
      status: 'completed',
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Math.floor(Math.random() * 150) + 30,
      inputSummary: input,
      outputSummary: output,
    });
  }

  try {
    // Load all catalog data
    const { data: allSkills } = await supabase.from('skills').select('*');
    const { data: prereqs } = await supabase.from('skill_prerequisites').select('*');
    const { data: resources } = await supabase.from('resources').select('*');
    const { data: questions } = await supabase.from('assessment_questions').select('*');
    if (!allSkills) throw new Error('Skills not found. Ensure database is seeded.');

    const skillMap = new Map(allSkills.map((s) => [s.slug, s]));
    const skillIdMap = new Map(allSkills.map((s) => [s.id, s]));

    // Step 1: Setup demo learner profile (overwrite with demo values)
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 4);

    await supabase.from('learner_profiles').upsert({
      user_id: userId,
      target_career: 'Machine Learning Engineer',
      target_role: 'ML Engineer',
      goal_description: 'Become a Machine Learning Engineer — DEMO DATA',
      current_level: 'beginner',
      hours_per_day: 2,
      days_per_week: 5,
      target_deadline: deadline.toISOString().split('T')[0],
      learning_challenges: ['consistency', 'retention'],
      onboarded: true,
      updated_at: new Date().toISOString(),
    });

    // Create demo goal
    const { data: existingGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    let goalId: string;
    if (existingGoals && existingGoals.length > 0) {
      goalId = existingGoals[0].id;
      await supabase.from('goals').update({
        title: 'Become a ML Engineer',
        description: 'Become a Machine Learning Engineer — DEMO DATA',
        target_role: 'ML Engineer',
        target_deadline: deadline.toISOString().split('T')[0],
      }).eq('id', goalId);
    } else {
      const { data: newGoal } = await supabase.from('goals').insert({
        user_id: userId,
        title: 'Become a ML Engineer',
        description: 'Become a Machine Learning Engineer — DEMO DATA',
        target_role: 'ML Engineer',
        target_deadline: deadline.toISOString().split('T')[0],
        status: 'active',
      }).select().single();
      goalId = newGoal.id;
    }

    // Step 2: Set demo skills
    for (const demoSkill of DEMO_SKILLS) {
      const skill = skillMap.get(demoSkill.slug);
      if (!skill) continue;
      const status = demoSkill.proficiency >= 70 ? 'mastered' : demoSkill.proficiency >= 40 ? 'developing' : 'weak';
      await supabase.from('learner_skills').upsert({
        user_id: userId,
        skill_id: skill.id,
        proficiency: demoSkill.proficiency,
        status,
        evidence: ['demo_data'],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,skill_id' });
    }

    // Set preferences to hands-on (demo style)
    await supabase.from('learning_preferences').upsert({
      user_id: userId,
      dominant_style: 'hands_on',
      secondary_style: 'visual',
      style_confidence: 60,
      style_signals: { onboarding: ['hands_on', 'visual'], demo: true },
      preferred_difficulty: 'beginner',
      session_length_minutes: 120,
      updated_at: new Date().toISOString(),
    });

    // Load the updated data
    const { data: learnerProfile } = await supabase.from('learner_profiles').select('*').eq('user_id', userId).maybeSingle();
    const { data: prefs } = await supabase.from('learning_preferences').select('*').eq('user_id', userId).maybeSingle();
    const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    const { data: learnerSkillsData } = await supabase.from('learner_skills').select('*, skill:skills(*)').eq('user_id', userId);
    const learnerSkills = (learnerSkillsData || []) as any[];
    const goal = { id: goalId, user_id: userId, title: 'Become a ML Engineer', description: 'DEMO DATA', target_role: 'ML Engineer', target_deadline: deadline.toISOString().split('T')[0], status: 'active', created_at: new Date().toISOString() };

    // Step 3: Run Intake Agent
    const intakeOutput = runIntakeAgent(learnerProfile!, prefs!, profileData?.name || 'Demo Learner', userId);
    addTrace('intake', 'Demo learner profile', `Goal: ML Engineer, ${intakeOutput.constraints.weeklyHours} hrs/week, ${intakeOutput.constraints.totalDaysUntilDeadline} days`);

    // Step 4: Run Style Profiler
    const styleOutput = runStyleProfiler(prefs, ['hands_on', 'visual'], []);
    await persistStyleProfile(userId, styleOutput, supabase);
    addTrace('style_profiler', 'Onboarding styles: hands_on, visual', `Dominant: ${styleOutput.dominantStyle}, confidence: ${styleOutput.confidence}%`);

    // Step 5: Run Gap Detector
    const gapResult = runGapDetector(allSkills, learnerSkills, prereqs || [], skillIdMap);
    addTrace('gap_detector', `${learnerSkills.length} learner skills`, `Mastered: ${gapResult.mastered.length}, Weak: ${gapResult.weak.length}, Missing: ${gapResult.missing.length}`);

    // Step 6: Update Cognitive Twin
    const twin = runCognitiveTwin(userId, {
      learnerSkills,
      allSkills,
      preferences: prefs,
      sessions: [],
      attempts: [],
      retention: [],
      interactions: [],
      resources: (resources || []).map((r) => ({ id: r.id, resource_type: r.resource_type })),
    });
    await persistCognitiveTwin(userId, twin, supabase);
    addTrace('cognitive_twin', 'Learner data snapshot', `Consistency: ${twin.consistency_score}%, Pace: ${twin.pace_label}`);

    // Step 7: Generate Roadmap
    const plan = runAdaptivePlanner({
      goal: goal as any,
      allSkills,
      learnerSkills,
      prerequisites: prereqs || [],
      gapResult,
      preferences: prefs,
      weeklyHours: intakeOutput.constraints.weeklyHours,
      totalDays: intakeOutput.constraints.totalDaysUntilDeadline,
    });
    const persistedRoadmap = await persistRoadmap(userId, plan, supabase);
    addTrace('adaptive_planner', `Gap result: ${gapResult.missing.length} missing skills`, `Roadmap: ${persistedRoadmap?.items.length || 0} items, ${plan.roadmap.total_phases} phases`);

    // Step 8: Simulate an assessment with a WEAK result
    // Pick a skill that has questions — target the first skill in the roadmap
    const firstAssessmentSkill = allSkills.find(s => questions?.some(q => q.skill_id === s.id));
    if (firstAssessmentSkill) {
      const skillQuestions = questions!.filter(q => q.skill_id === firstAssessmentSkill.id);
      // Deliberately answer wrong to produce a weak result
      const wrongAnswers: Record<string, string> = {};
      for (const q of skillQuestions) {
        // Pick the wrong answer
        const wrongOption = q.options.find((o: string) => o !== q.correct_answer) || 'wrong';
        wrongAnswers[q.id] = wrongOption;
      }

      const { data: assessment } = await supabase.from('assessments').insert({
        user_id: userId,
        skill_id: firstAssessmentSkill.id,
        title: `${firstAssessmentSkill.name} Assessment (Demo)`,
        description: 'Demo assessment — intentionally weak result',
        status: 'completed',
        score: 0,
        max_score: skillQuestions.length,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }).select().single();

      const scorePercent = 0;
      const mastery = calculateMastery(scorePercent);

      const { data: attempt } = await supabase.from('assessment_attempts').insert({
        assessment_id: assessment.id,
        user_id: userId,
        answers: wrongAnswers,
        score: 0,
        max_score: skillQuestions.length,
        mastery_state: mastery,
        time_taken_seconds: 120,
      }).select().single();

      // Update skill proficiency to reflect weak assessment
      await supabase.from('learner_skills').upsert({
        user_id: userId,
        skill_id: firstAssessmentSkill.id,
        proficiency: 15,
        status: 'weak',
        last_assessed: new Date().toISOString(),
        evidence: ['demo_weak_assessment'],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,skill_id' });

      // Step 9: Mark topic NEEDS_REVISION, add revision practice, delay dependents
      if (persistedRoadmap) {
        const failedItem = persistedRoadmap.items.find(
          (i) => i.skill_id === firstAssessmentSkill.id && i.item_type === 'assessment'
        );
        if (failedItem) {
          await adaptRoadmapAfterFailure(userId, persistedRoadmap.roadmap.id, failedItem.id, firstAssessmentSkill.name, supabase);
        }
      }

      addTrace('adaptive_planner', `Weak assessment: ${firstAssessmentSkill.name} (0%)`, `Marked NEEDS_REVISION, revision added, dependents delayed`);
    }

    // Step 10: Simulate missed learning sessions (create gaps in session history)
    const oldDate1 = new Date();
    oldDate1.setDate(oldDate1.getDate() - 10);
    const oldDate2 = new Date();
    oldDate2.setDate(oldDate2.getDate() - 20);

    await supabase.from('learning_sessions').insert([
      {
        user_id: userId,
        topic: 'Python Basics (Demo)',
        lesson_title: 'Python Fundamentals',
        objectives: ['demo'],
        start_time: oldDate2.toISOString(),
        end_time: new Date(oldDate2.getTime() + 30 * 60000).toISOString(),
        duration_minutes: 30,
        completion_percentage: 80,
        self_confidence: 3,
        difficulty_rating: 3,
      },
      {
        user_id: userId,
        topic: 'Statistics (Demo)',
        lesson_title: 'Descriptive Statistics',
        objectives: ['demo'],
        start_time: oldDate1.toISOString(),
        end_time: new Date(oldDate1.getTime() + 20 * 60000).toISOString(),
        duration_minutes: 20,
        completion_percentage: 50,
        self_confidence: 2,
        difficulty_rating: 4,
      },
    ]);

    // Step 11: Run Drift Monitor (with the simulated session gaps)
    const { data: sessionsData } = await supabase.from('learning_sessions').select('*').eq('user_id', userId).order('start_time', { ascending: false });
    const { data: attemptsData } = await supabase.from('assessment_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const driftRecord = runDriftMonitor(userId, { sessions: sessionsData || [], attempts: attemptsData || [] });
    await persistDriftRecord(userId, driftRecord, supabase);
    addTrace('drift_monitor', `Session gap analysis`, `Drift: ${driftRecord.drift_score}/100 (${driftRecord.status})`);

    // Step 12: Run Shadow AI
    const { data: updatedRoadmapItems } = await supabase.from('roadmap_items').select('*').eq('user_id', userId);
    const completedItems = (updatedRoadmapItems || []).filter((i: any) => i.status === 'completed').length;
    const shadow = runShadowAI(userId, {
      drift: driftRecord,
      twin,
      learnerSkills,
      roadmapItems: updatedRoadmapItems || [],
      daysUntilDeadline: intakeOutput.constraints.totalDaysUntilDeadline,
      totalRoadmapItems: (updatedRoadmapItems || []).length,
      completedItems,
    });
    await persistShadowPrediction(userId, shadow, supabase);
    addTrace('shadow_ai', `Drift: ${driftRecord.status}, weak skills: ${gapResult.weak.length}`, `Risk: ${shadow.risk_level}, factors: ${shadow.risk_factors.length}`);

    // Step 13: Schedule Memory Retention
    for (const ls of learnerSkills) {
      if (ls.proficiency > 0) {
        const rRecord = runMemoryRetention(userId, {
          skillId: ls.skill_id,
          skillName: ls.skill?.name || '',
          topic: ls.skill?.name || '',
          performance: ls.proficiency,
        });
        await persistRetentionRecord(userId, rRecord, supabase);
      }
    }
    addTrace('memory_retention', `${learnerSkills.length} skills`, `Retention records scheduled`);

    // Step 14: Run Resource Curator
    const { data: interactions } = await supabase.from('resource_interactions').select('*').eq('user_id', userId);
    const gapSkillIds = [...gapResult.weak, ...gapResult.missing].map((g) => g.skillId);
    const recs = runResourceCurator({
      resources: (resources || []) as any[],
      learnerSkills,
      interactions: interactions || [],
      preferences: prefs,
      gapSkillIds,
    });
    addTrace('resource_curator', `${gapSkillIds.length} gap skills`, `${recs.length} recommendations generated`);

    // Create demo notifications
    await supabase.from('notifications').insert([
      {
        user_id: userId,
        type: 'assessment_due',
        title: 'Demo: Assessment Result Recorded',
        message: 'A weak assessment result was simulated. The roadmap has been adapted with revision practice.',
        link: '/roadmap',
      },
      {
        user_id: userId,
        type: 'learning_drift',
        title: `Demo: Drift Detected (${driftRecord.status})`,
        message: driftRecord.explanation,
        link: '/insights',
      },
      {
        user_id: userId,
        type: 'recommended_resource',
        title: 'Demo: Resources Recommended',
        message: `${recs.length} resources matched to your skill gaps. Check the Resources page.`,
        link: '/resources',
      },
    ]);

    // Record all agent runs in database
    for (const t of trace) {
      await supabase.from('agent_runs').insert({
        user_id: userId,
        agent_name: t.agent,
        status: 'completed',
        input_summary: { summary: t.inputSummary },
        output_summary: { summary: t.outputSummary },
        started_at: t.startedAt,
        completed_at: t.completedAt,
        duration_ms: t.durationMs,
      });
    }

    return {
      success: true,
      trace,
      summary: `Adaptive demo completed. ${trace.length} agents executed. Roadmap adapted with revision practice. Drift: ${driftRecord.status}. Risk: ${shadow.risk_level}.`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, trace, summary: 'Demo failed', error: errorMsg };
  }
}

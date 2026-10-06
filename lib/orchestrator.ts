// ============================================================================
// Agent Orchestrator — LangGraph-like workflow/state graph
// Agents communicate through structured shared state
// ============================================================================

import type {
  AgentSharedState,
  AgentRunTrace,
  AgentName,
  LearnerContext,
} from '@/types';
import { supabase } from '@/lib/supabase/client';

const AGENT_LABELS: Record<AgentName, string> = {
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

export function getAgentLabel(name: AgentName): string {
  return AGENT_LABELS[name];
}

export function createInitialState(): AgentSharedState {
  return {
    learner: null,
    goal: '',
    skills: [],
    skillGaps: null,
    learningStyle: null,
    cognitiveTwin: null,
    roadmap: null,
    roadmapItems: [],
    currentTopic: null,
    assessmentResult: null,
    feedback: [],
    drift: null,
    shadowRisk: null,
    retention: [],
    recommendations: [],
    agentRuns: [],
  };
}

export async function recordAgentRun(
  userId: string,
  agentName: AgentName,
  status: 'running' | 'completed' | 'failed',
  inputSummary: Record<string, unknown>,
  outputSummary: Record<string, unknown>,
  startedAt: string,
  error?: string
): Promise<AgentRunTrace> {
  const completedAt = status !== 'running' ? new Date().toISOString() : null;
  const durationMs = completedAt
    ? Date.now() - new Date(startedAt).getTime()
    : null;

  if (status !== 'running') {
    await supabase.from('agent_runs').insert({
      user_id: userId,
      agent_name: agentName,
      status,
      input_summary: inputSummary,
      output_summary: outputSummary,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      error: error || null,
    });
  }

  return {
    agent: agentName,
    label: AGENT_LABELS[agentName],
    status: status as 'pending' | 'running' | 'completed' | 'failed',
    startedAt,
    completedAt,
    durationMs,
    inputSummary: JSON.stringify(inputSummary).slice(0, 200),
    outputSummary: JSON.stringify(outputSummary).slice(0, 200),
    error,
  };
}

/**
 * Runs a sequence of agents, threading shared state through each one.
 * Each agent receives the current state and returns a partial state update.
 */
export async function runAgentPipeline(
  userId: string,
  learner: LearnerContext,
  agents: Array<{
    name: AgentName;
    fn: (state: AgentSharedState) => Promise<Partial<AgentSharedState>>;
  }>
): Promise<AgentSharedState> {
  const state = createInitialState();
  state.learner = learner;
  state.goal = learner.goal;

  for (const agent of agents) {
    const startedAt = new Date().toISOString();
    const inputSummary: Record<string, unknown> = {
      learner: learner.name,
      goal: learner.goal,
      hasSkills: state.skills.length > 0,
      hasRoadmap: !!state.roadmap,
    };

    try {
      const updates = await agent.fn(state);
      Object.assign(state, updates);

      state.agentRuns.push(
        await recordAgentRun(
          userId,
          agent.name,
          'completed',
          inputSummary,
          { updated: Object.keys(updates) },
          startedAt
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      state.agentRuns.push(
        await recordAgentRun(
          userId,
          agent.name,
          'failed',
          inputSummary,
          {},
          startedAt,
          errorMsg
        )
      );
    }
  }

  return state;
}

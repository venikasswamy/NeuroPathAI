// ============================================================================
// Drift Monitor — Layer 3: Execution
// Monitors learning behavior changes: missed sessions, declining scores, inactivity
// ============================================================================

import type {
  LearningSession,
  AssessmentAttempt,
  DriftRecord,
  DriftFactor,
  DriftStatus,
} from '@/types';

export interface DriftMonitorInput {
  sessions: LearningSession[];
  attempts: AssessmentAttempt[];
  periodDays?: number;
}

const MASTERY_THRESHOLD = 60;

export function runDriftMonitor(userId: string, input: DriftMonitorInput): DriftRecord {
  const { sessions, attempts, periodDays = 14 } = input;
  const now = Date.now();
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
  const prevPeriodStart = now - 2 * periodDays * 24 * 60 * 60 * 1000;

  const factors: DriftFactor[] = [];
  let totalScore = 0;

  // Factor 1: Session frequency
  const recentSessions = sessions.filter((s) => new Date(s.start_time).getTime() > periodStart);
  const prevSessions = sessions.filter((s) => {
    const t = new Date(s.start_time).getTime();
    return t > prevPeriodStart && t <= periodStart;
  });
  const sessionDecline = prevSessions.length - recentSessions.length;
  if (sessionDecline > 0) {
    const severity = sessionDecline >= 3 ? 'high' : sessionDecline >= 2 ? 'medium' : 'low';
    const value = Math.min(100, sessionDecline * 20);
    factors.push({
      factor: 'session_frequency',
      value,
      description: `Study sessions decreased from ${prevSessions.length} to ${recentSessions.length} over the last ${periodDays} days.`,
      severity,
    });
    totalScore += value;
  }

  // Factor 2: Inactivity gap
  if (sessions.length > 0) {
    const lastSession = new Date(sessions[0].start_time).getTime();
    const daysSinceLast = Math.floor((now - lastSession) / (1000 * 60 * 60 * 1000));
    if (daysSinceLast > 5) {
      const value = Math.min(100, daysSinceLast * 10);
      factors.push({
        factor: 'inactivity',
        value,
        description: `No learning activity for ${daysSinceLast} days.`,
        severity: daysSinceLast > 14 ? 'high' : daysSinceLast > 7 ? 'medium' : 'low',
      });
      totalScore += value;
    }
  }

  // Factor 3: Assessment score decline
  const recentAttempts = attempts.filter((a) => new Date(a.created_at).getTime() > periodStart);
  const prevAttempts = attempts.filter((a) => {
    const t = new Date(a.created_at).getTime();
    return t > prevPeriodStart && t <= periodStart;
  });
  if (recentAttempts.length > 0 && prevAttempts.length > 0) {
    const recentAvg = recentAttempts.reduce((s, a) => s + (a.score / a.max_score) * 100, 0) / recentAttempts.length;
    const prevAvg = prevAttempts.reduce((s, a) => s + (a.score / a.max_score) * 100, 0) / prevAttempts.length;
    const decline = prevAvg - recentAvg;
    if (decline > 10) {
      const value = Math.min(100, Math.round(decline));
      factors.push({
        factor: 'score_decline',
        value,
        description: `Average assessment score dropped from ${Math.round(prevAvg)}% to ${Math.round(recentAvg)}%.`,
        severity: decline > 30 ? 'high' : decline > 20 ? 'medium' : 'low',
      });
      totalScore += value;
    }
  }

  // Factor 4: Repeated failures
  const failedRecent = recentAttempts.filter((a) => (a.score / a.max_score) * 100 < MASTERY_THRESHOLD);
  if (failedRecent.length >= 2) {
    const value = Math.min(100, failedRecent.length * 25);
    factors.push({
      factor: 'repeated_failures',
      value,
      description: `${failedRecent.length} assessments below mastery threshold in the last ${periodDays} days.`,
      severity: failedRecent.length >= 3 ? 'high' : 'medium',
    });
    totalScore += value;
  }

  // Factor 5: No sessions at all in period (new learner with sessions in prev)
  if (recentSessions.length === 0 && prevSessions.length > 0) {
    factors.push({
      factor: 'complete_inactivity',
      value: 80,
      description: `No learning sessions recorded in the last ${periodDays} days.`,
      severity: 'high',
    });
    totalScore += 80;
  }

  const driftScore = Math.min(100, Math.round(totalScore / Math.max(1, factors.length)));
  let status: DriftStatus = 'STABLE';
  if (driftScore >= 50) status = 'DRIFTING';
  else if (driftScore >= 25) status = 'WATCH';

  const explanation = factors.length > 0
    ? factors.map((f) => f.description).join(' ')
    : 'Learning behavior is stable. No drift detected.';

  return {
    id: '',
    user_id: userId,
    drift_score: driftScore,
    status,
    factors,
    explanation,
    period_days: periodDays,
    created_at: new Date().toISOString(),
  };
}

export async function persistDriftRecord(
  userId: string,
  record: DriftRecord,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  await supabase.from('drift_records').insert({
    user_id: userId,
    drift_score: record.drift_score,
    status: record.status,
    factors: record.factors,
    explanation: record.explanation,
    period_days: record.period_days,
  });

  // Create notification if drifting
  if (record.status !== 'STABLE') {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'learning_drift',
      title: `Learning Drift: ${record.status}`,
      message: record.explanation,
      link: '/insights',
    });
  }
}

// ============================================================================
// Memory Retention Agent — Layer 4: Adaptive Intelligence
// Spaced-repetition scheduling with transparent review intervals
// ============================================================================

import type { RetentionRecord, Skill, AssessmentAttempt } from '@/types';

// Spaced repetition intervals (in days)
const INTERVALS = [1, 3, 7, 14, 30, 60, 90];

export interface RetentionInput {
  skillId: string;
  skillName: string;
  topic: string;
  performance: number; // 0-100
  existingRecord?: RetentionRecord;
}

export function runMemoryRetention(userId: string, input: RetentionInput): RetentionRecord {
  const now = new Date();

  const existing = input.existingRecord;
  const reviewCount = existing ? existing.review_count + 1 : 1;

  // Determine next interval based on performance and review count
  let intervalIndex = Math.min(reviewCount - 1, INTERVALS.length - 1);
  let intervalDays = INTERVALS[intervalIndex];

  // Performance modifier: poor performance shortens interval, good extends it
  if (input.performance < 40) {
    intervalDays = Math.max(1, Math.round(intervalDays * 0.5));
  } else if (input.performance < 60) {
    intervalDays = Math.max(1, Math.round(intervalDays * 0.75));
  } else if (input.performance >= 85 && reviewCount > 1) {
    intervalIndex = Math.min(intervalIndex + 1, INTERVALS.length - 1);
    intervalDays = INTERVALS[intervalIndex];
  }

  const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  // Determine retention state
  let state: RetentionRecord['retention_state'] = 'new';
  if (existing) {
    if (input.performance >= 85 && reviewCount >= 4) state = 'mastered';
    else if (input.performance >= 60) state = 'reviewing';
    else if (input.performance < 40) state = 'needs_review';
    else state = 'learning';
  }

  return {
    id: existing?.id || '',
    user_id: userId,
    skill_id: input.skillId,
    topic: input.topic,
    last_studied: now.toISOString(),
    last_assessed: now.toISOString(),
    retention_state: state,
    next_review: nextReview.toISOString(),
    review_count: reviewCount,
    performance: input.performance,
    interval_days: intervalDays,
    created_at: existing?.created_at || now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export async function persistRetentionRecord(
  userId: string,
  record: RetentionRecord,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<void> {
  await supabase.from('retention_records').upsert({
    user_id: userId,
    skill_id: record.skill_id,
    topic: record.topic,
    last_studied: record.last_studied,
    last_assessed: record.last_assessed,
    retention_state: record.retention_state,
    next_review: record.next_review,
    review_count: record.review_count,
    performance: record.performance,
    interval_days: record.interval_days,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,skill_id,topic' });

  // Create notification if review is due soon (within 1 day)
  const hoursUntilReview = (new Date(record.next_review).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilReview <= 24 && record.retention_state !== 'mastered') {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'retention_review',
      title: 'Retention Review Due',
      message: `Time to review: ${record.topic}`,
      link: '/retention',
    });
  }
}

export function getRetentionBuckets(records: RetentionRecord[]): {
  dueToday: RetentionRecord[];
  upcoming: RetentionRecord[];
  mastered: RetentionRecord[];
  needsReview: RetentionRecord[];
} {
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dueToday: RetentionRecord[] = [];
  const upcoming: RetentionRecord[] = [];
  const mastered: RetentionRecord[] = [];
  const needsReview: RetentionRecord[] = [];

  for (const r of records) {
    if (r.retention_state === 'mastered') {
      mastered.push(r);
    } else if (r.retention_state === 'needs_review') {
      needsReview.push(r);
    } else {
      const reviewTime = new Date(r.next_review).getTime();
      if (reviewTime <= todayEnd.getTime()) {
        dueToday.push(r);
      } else {
        upcoming.push(r);
      }
    }
  }

  return { dueToday, upcoming, mastered, needsReview };
}

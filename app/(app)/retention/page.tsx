'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertCircle, Clock, Calendar, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader, EmptyState, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { runMemoryRetention, persistRetentionRecord, getRetentionBuckets } from '@/agents/memoryRetention';
import { toast } from 'sonner';
import type { RetentionRecord } from '@/types';

export default function RetentionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RetentionRecord[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('retention_records')
      .select('*, skill:skills(*)')
      .eq('user_id', user.id)
      .order('next_review', { ascending: true });
    setRecords((data || []) as unknown as RetentionRecord[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function markRemembered(record: RetentionRecord) {
    if (!user) return;
    const updated = runMemoryRetention(user.id, {
      skillId: record.skill_id,
      skillName: (record as any).skill?.name || record.topic,
      topic: record.topic,
      performance: Math.min(100, record.performance + 20),
      existingRecord: record,
    });
    await persistRetentionRecord(user.id, updated, supabase);
    toast.success(`"${record.topic}" marked as remembered. Next review in ${updated.interval_days} days.`);
    await load();
  }

  async function markDifficult(record: RetentionRecord) {
    if (!user) return;
    const updated = runMemoryRetention(user.id, {
      skillId: record.skill_id,
      skillName: (record as any).skill?.name || record.topic,
      topic: record.topic,
      performance: Math.max(0, record.performance - 20),
      existingRecord: record,
    });
    await persistRetentionRecord(user.id, updated, supabase);
    toast.success(`"${record.topic}" marked as difficult. Review scheduled sooner.`);
    await load();
  }

  async function reschedule(record: RetentionRecord, days: number) {
    if (!user) return;
    const next = new Date();
    next.setDate(next.getDate() + days);
    await supabase.from('retention_records').update({
      next_review: next.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', record.id);
    toast.success(`Rescheduled to ${days} days from now`);
    await load();
  }

  if (loading) return <LoadingState message="Loading retention records..." />;

  const { dueToday, upcoming, mastered, needsReview } = getRetentionBuckets(records);
  const avgPerformance = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.performance, 0) / records.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Memory Retention" description="Spaced-repetition scheduling for long-term retention" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Clock} label="Due Today" count={dueToday.length} color="text-blue-600" />
        <SummaryCard icon={Calendar} label="Upcoming" count={upcoming.length} color="text-purple-600" />
        <SummaryCard icon={Check} label="Mastered" count={mastered.length} color="text-green-600" />
        <SummaryCard icon={AlertCircle} label="Needs Review" count={needsReview.length} color="text-orange-600" />
      </div>

      {/* Retention Progress */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-electric" /> Retention Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Average Performance</span>
            <span className="font-medium">{avgPerformance}%</span>
          </div>
          <Progress value={avgPerformance} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Review intervals: 1 day → 3 days → 7 days → 14 days → 30 days. Performance modifies the next interval.
          </p>
        </CardContent>
      </Card>

      {/* Due Today */}
      {dueToday.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-blue-600"><Clock className="w-5 h-5" /> Due Today</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dueToday.map((r) => <RetentionCard key={r.id} record={r} onRemembered={() => markRemembered(r)} onDifficult={() => markDifficult(r)} onReschedule={(d) => reschedule(r, d)} />)}
          </CardContent>
        </Card>
      )}

      {/* Needs Review */}
      {needsReview.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-orange-600"><AlertCircle className="w-5 h-5" /> Needs Review</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {needsReview.map((r) => <RetentionCard key={r.id} record={r} onRemembered={() => markRemembered(r)} onDifficult={() => markDifficult(r)} onReschedule={(d) => reschedule(r, d)} />)}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-purple-600"><Calendar className="w-5 h-5" /> Upcoming Reviews</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((r) => <RetentionCard key={r.id} record={r} onRemembered={() => markRemembered(r)} onDifficult={() => markDifficult(r)} onReschedule={(d) => reschedule(r, d)} />)}
          </CardContent>
        </Card>
      )}

      {/* Mastered */}
      {mastered.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-green-600"><Check className="w-5 h-5" /> Mastered</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mastered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.topic}</p>
                  <p className="text-xs text-muted-foreground">Reviewed {r.review_count} times · Performance: {r.performance}%</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Mastered</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {records.length === 0 && (
        <Card><CardContent>
          <EmptyState icon={RefreshCw} title="No retention records yet" description="Retention reviews are scheduled automatically after assessments." />
        </CardContent></Card>
      )}
    </div>
  );
}

function RetentionCard({ record, onRemembered, onDifficult, onReschedule }: {
  record: RetentionRecord;
  onRemembered: () => void;
  onDifficult: () => void;
  onReschedule: (days: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <RefreshCw className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{record.topic}</p>
        <p className="text-xs text-muted-foreground">
          {record.review_count} reviews · {record.performance}% · Next: {new Date(record.next_review).toLocaleDateString()}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onRemembered} className="text-green-600 border-green-200 hover:bg-green-50">
        <Check className="w-3 h-3 mr-1" /> Remembered
      </Button>
      <Button size="sm" variant="outline" onClick={onDifficult} className="text-orange-600 border-orange-200 hover:bg-orange-50">
        <AlertCircle className="w-3 h-3 mr-1" /> Difficult
      </Button>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, count, color }: { icon: React.ComponentType<{ className?: string }>; label: string; count: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Icon className={`w-5 h-5 ${color} mb-2`} />
        <p className="text-2xl font-bold font-display">{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

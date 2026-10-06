'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, Brain, RefreshCw, Target, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader, EmptyState, LoadingState, StatusBadge } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import type { Insight, DriftRecord, ShadowPrediction, CognitiveTwin, LearnerSkill, Skill, RetentionRecord } from '@/types';

export default function InsightsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drift, setDrift] = useState<DriftRecord | null>(null);
  const [shadow, setShadow] = useState<ShadowPrediction | null>(null);
  const [twin, setTwin] = useState<CognitiveTwin | null>(null);
  const [skills, setSkills] = useState<LearnerSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [retention, setRetention] = useState<RetentionRecord[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [d, s, ct, ls, all, ret] = await Promise.all([
      supabase.from('drift_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('shadow_predictions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('cognitive_twins').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('learner_skills').select('*, skill:skills(*)').eq('user_id', user.id),
      supabase.from('skills').select('*'),
      supabase.from('retention_records').select('*').eq('user_id', user.id),
    ]);
    setDrift(d.data as DriftRecord | null);
    setShadow(s.data as ShadowPrediction | null);
    setTwin(ct.data as CognitiveTwin | null);
    setSkills((ls.data || []) as unknown as LearnerSkill[]);
    setAllSkills((all.data || []) as Skill[]);
    setRetention((ret.data || []) as RetentionRecord[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading insights..." />;

  // Generate insights from data
  const insights: Insight[] = [];

  if (drift && drift.status !== 'STABLE') {
    insights.push({
      id: 'drift',
      title: `Learning Drift: ${drift.status}`,
      explanation: drift.explanation,
      evidence: drift.factors?.map((f: any) => f.description) || [],
      recommendedAction: drift.status === 'DRIFTING' ? 'Resume learning sessions immediately and review your study schedule.' : 'Monitor your learning pattern and try to maintain consistency.',
      category: 'drift',
      severity: drift.status === 'DRIFTING' ? 'critical' : 'warning',
    });
  }

  if (shadow && shadow.risk_level !== 'LOW') {
    insights.push({
      id: 'shadow',
      title: `Educational Risk: ${shadow.risk_level}`,
      explanation: shadow.evidence.join(' '),
      evidence: shadow.risk_factors?.map((f: any) => `${f.factor}: ${f.description}`) || [],
      recommendedAction: shadow.recommended_intervention,
      category: 'shadow',
      severity: shadow.risk_level === 'HIGH' ? 'critical' : 'warning',
    });
  }

  if (twin) {
    if (twin.consistency_score < 40) {
      insights.push({
        id: 'consistency',
        title: 'Low Learning Consistency',
        explanation: `Your consistency score is ${twin.consistency_score}%. You have gaps in your study pattern.`,
        evidence: [`Consistency score: ${twin.consistency_score}%`],
        recommendedAction: 'Set a regular study schedule and aim for at least 3-4 sessions per week.',
        category: 'learning',
        severity: 'warning',
      });
    }
    if (twin.recent_performance < 50) {
      insights.push({
        id: 'performance',
        title: 'Below-Average Assessment Performance',
        explanation: `Your recent assessment average is ${twin.recent_performance}%, below the mastery threshold of 70%.`,
        evidence: [`Recent performance: ${twin.recent_performance}%`],
        recommendedAction: 'Review weak skills and complete practice exercises before taking new assessments.',
        category: 'learning',
        severity: 'warning',
      });
    }
  }

  const weakSkills = skills.filter((s) => s.proficiency < 40);
  if (weakSkills.length > 0) {
    insights.push({
      id: 'weak-skills',
      title: `${weakSkills.length} Skills Need Attention`,
      explanation: `These skills are below 40% proficiency: ${weakSkills.slice(0, 3).map((s) => (s as any).skill?.name).join(', ')}${weakSkills.length > 3 ? '...' : ''}`,
      evidence: weakSkills.map((s) => `${(s as any).skill?.name}: ${s.proficiency}%`),
      recommendedAction: 'Focus on these skills in your next learning sessions. Use the Resources page for targeted practice.',
      category: 'skill',
      severity: 'warning',
    });
  }

  const dueRetention = retention.filter((r) => new Date(r.next_review).getTime() <= Date.now() && r.retention_state !== 'mastered');
  if (dueRetention.length > 0) {
    insights.push({
      id: 'retention-due',
      title: `${dueRetention.length} Retention Reviews Due`,
      explanation: 'You have retention reviews scheduled that are overdue.',
      evidence: dueRetention.map((r) => `${r.topic} (due ${new Date(r.next_review).toLocaleDateString()})`),
      recommendedAction: 'Visit the Retention page to review these topics before you forget them.',
      category: 'retention',
      severity: 'info',
    });
  }

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    drift: AlertTriangle,
    shadow: Target,
    learning: TrendingUp,
    skill: Brain,
    retention: RefreshCw,
    recommendation: BookOpen,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" description="AI-generated insights from your learning data" />

      {/* Drift & Shadow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-electric" /> Drift Monitor</CardTitle></CardHeader>
          <CardContent>
            {drift ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={drift.status} />
                  <span className="text-sm text-muted-foreground">Score: {drift.drift_score}/100</span>
                </div>
                <p className="text-sm text-muted-foreground">{drift.explanation}</p>
                {drift.factors && drift.factors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Factors:</p>
                    {drift.factors.map((f: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                        <span className="font-medium capitalize">{f.factor.replace(/_/g, ' ')}:</span> {f.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState icon={AlertTriangle} title="No drift data" description="Run the adaptive loop to generate drift insights." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-violet" /> Shadow AI Risk</CardTitle></CardHeader>
          <CardContent>
            {shadow ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={shadow.risk_level} />
                  <span className="text-sm text-muted-foreground">Confidence: {shadow.confidence}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{shadow.recommended_intervention}</p>
                {shadow.risk_factors && shadow.risk_factors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Risk Factors:</p>
                    {shadow.risk_factors.map((f: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                        <StatusBadge status={f.level} /> <span>{f.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground italic mt-2">
                  Shadow AI is an educational planning tool — it does not diagnose medical conditions.
                </p>
              </div>
            ) : (
              <EmptyState icon={Target} title="No risk assessment" description="Run the adaptive loop to generate risk predictions." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-electric" /> All Insights</CardTitle></CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((ins) => {
                const Icon = categoryIcons[ins.category] || Lightbulb;
                return (
                  <div key={ins.id} className={`p-4 rounded-lg border ${ins.severity === 'critical' ? 'border-red-200 bg-red-50' : ins.severity === 'warning' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ins.severity === 'critical' ? 'text-red-500' : ins.severity === 'warning' ? 'text-orange-500' : 'text-blue-500'}`} />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{ins.title}</h4>
                          <Badge variant="outline" className="text-xs capitalize">{ins.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ins.explanation}</p>
                        {ins.evidence.length > 0 && (
                          <div>
                            <p className="text-xs font-medium">Evidence:</p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                              {ins.evidence.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="pt-1">
                          <p className="text-xs font-medium">Recommended Action:</p>
                          <p className="text-xs text-muted-foreground">{ins.recommendedAction}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Lightbulb} title="No insights yet" description="As you learn and take assessments, insights will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

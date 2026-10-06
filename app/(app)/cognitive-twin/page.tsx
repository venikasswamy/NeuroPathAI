'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, Clock, TrendingUp, Target, Zap, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader, EmptyState, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import type { CognitiveTwin, LearnerProfile } from '@/types';

export default function CognitiveTwinPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [twin, setTwin] = useState<CognitiveTwin | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ct }, { data: lp }] = await Promise.all([
      supabase.from('cognitive_twins').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    setTwin(ct as CognitiveTwin | null);
    setLearnerProfile(lp as LearnerProfile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading Cognitive Twin..." />;

  if (!twin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cognitive Twin" description="Your digital learner model" />
        <Card><CardContent>
          <EmptyState icon={BrainCircuit} title="No Cognitive Twin yet" description="Generate a roadmap to create your Cognitive Twin model." />
        </CardContent></Card>
      </div>
    );
  }

  const skillData = Object.entries(twin.skill_profile).map(([name, val]) => ({
    name: name.length > 15 ? name.slice(0, 12) + '...' : name,
    value: val,
  }));

  const knowledgeData = Object.entries(twin.knowledge_profile).map(([name, val]) => ({
    name,
    value: val,
  }));

  const metrics = [
    { label: 'Consistency', value: twin.consistency_score, icon: Clock, color: 'text-blue-600' },
    { label: 'Recent Performance', value: twin.recent_performance, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Confidence', value: twin.confidence_score, icon: Target, color: 'text-violet' },
    { label: 'Retention Status', value: twin.retention_status, icon: BookOpen, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cognitive Twin"
        description="A digital model of your learning profile — NOT biometric identification"
      />

      {learnerProfile?.goal_description?.includes('DEMO DATA') && (
        <div className="p-3 rounded-lg bg-violet/10 border border-violet/20 text-sm text-violet">
          <Badge className="bg-violet text-white mr-2">DEMO</Badge>
          This Cognitive Twin contains demo data from the Adaptive Demo run.
        </div>
      )}

      {/* Learner Profile Section */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Learner Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfileItem label="Learning Style" value={twin.dominant_style.replace(/_/g, ' ')} />
            <ProfileItem label="Secondary Style" value={twin.secondary_style?.replace(/_/g, ' ') || 'None'} />
            <ProfileItem label="Learning Pace" value={twin.pace_label} />
            <ProfileItem label="Pace Value" value={`${twin.learning_pace.toFixed(1)}x`} />
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-5">
              <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
              <p className="text-2xl font-bold font-display">{m.value}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              <Progress value={m.value} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {skillData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Skill Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar dataKey="value" stroke="hsl(var(--electric))" fill="hsl(var(--electric))" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {knowledgeData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Knowledge Profile by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={knowledgeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--violet))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Strengths</CardTitle></CardHeader>
          <CardContent>
            {twin.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {twin.strengths.map((s) => <Badge key={s} className="bg-green-100 text-green-700 border-green-200">{s}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No strengths identified yet. Continue learning to build your strengths.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-500" /> Weak Areas</CardTitle></CardHeader>
          <CardContent>
            {twin.weak_areas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {twin.weak_areas.map((w) => <Badge key={w} className="bg-orange-100 text-orange-700 border-orange-200">{w}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No weak areas detected. Great job!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Topics */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Completed Topics</CardTitle></CardHeader>
        <CardContent>
          {twin.completed_topics.length > 0 ? (
            <div className="space-y-1">
              {Array.from(new Set(twin.completed_topics)).map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> {t}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No topics completed yet. Start a learning session to track your progress.</p>
          )}
        </CardContent>
      </Card>

      {/* Preferred Resource Types */}
      {twin.preferred_resource_types.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-electric" /> Preferred Resource Types</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {twin.preferred_resource_types.map((r) => (
                <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground capitalize">{label}</p>
      <p className="text-sm font-medium capitalize mt-0.5">{value}</p>
    </div>
  );
}

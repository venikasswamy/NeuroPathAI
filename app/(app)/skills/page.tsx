'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PageHeader, EmptyState, LoadingState, StatusBadge } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Skill, LearnerSkill } from '@/types';

export default function SkillsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<LearnerSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [prereqs, setPrereqs] = useState<{ skill_id: string; prerequisite_id: string }[]>([]);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ls }, { data: all }, { data: pr }] = await Promise.all([
      supabase.from('learner_skills').select('*, skill:skills(*)').eq('user_id', user.id),
      supabase.from('skills').select('*'),
      supabase.from('skill_prerequisites').select('*'),
    ]);
    setSkills((ls || []) as unknown as LearnerSkill[]);
    setAllSkills((all || []) as Skill[]);
    setPrereqs(pr || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading skills..." />;

  const chartData = skills.map((ls) => ({
    name: (ls as any).skill?.name?.slice(0, 12) || 'Unknown',
    proficiency: ls.proficiency,
    target: (ls as any).skill?.target_proficiency || 80,
  }));

  const mastered = skills.filter((s) => s.status === 'mastered');
  const developing = skills.filter((s) => s.status === 'developing');
  const weak = skills.filter((s) => s.status === 'weak');
  const missing = allSkills.filter((s) => !skills.find((ls) => ls.skill_id === s.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Skills" description="Track your skill proficiency and identify gaps" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Mastered" count={mastered.length} color="text-green-600" bg="bg-green-50" />
        <SummaryCard label="Developing" count={developing.length} color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard label="Weak" count={weak.length} color="text-orange-600" bg="bg-orange-50" />
        <SummaryCard label="Missing" count={missing.length} color="text-gray-600" bg="bg-gray-50" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-electric" /> Skill Proficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="proficiency" fill="hsl(var(--electric))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="target" fill="hsl(var(--border))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Skills List */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Your Skills</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {skills.length === 0 ? (
            <EmptyState icon={BarChart3} title="No skills tracked yet" description="Complete onboarding to start tracking your skills." />
          ) : (
            skills.map((ls) => {
              const skill = (ls as any).skill as Skill | undefined;
              const skillPrereqs = prereqs.filter((p) => p.skill_id === ls.skill_id);
              const prereqSkills = skillPrereqs.map((p) => allSkills.find((s) => s.id === p.prerequisite_id)).filter(Boolean) as Skill[];
              const isExpanded = expandedSkill === ls.skill_id;
              return (
                <div key={ls.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSkill(isExpanded ? null : ls.skill_id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{skill?.name || 'Unknown'}</span>
                        <StatusBadge status={ls.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={ls.proficiency} className="h-1.5 w-32" />
                        <span className="text-xs text-muted-foreground">{ls.proficiency}/{skill?.target_proficiency || 80}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-sm text-muted-foreground">{skill?.description}</p>
                      <div>
                        <p className="text-xs font-medium mb-1">Why this skill is {ls.status}:</p>
                        <p className="text-xs text-muted-foreground">
                          {ls.status === 'mastered' && `Proficiency ${ls.proficiency} meets the target of ${skill?.target_proficiency}. Evidence: ${(ls.evidence || []).join(', ') || 'self-assessment'}.`}
                          {ls.status === 'developing' && `Proficiency ${ls.proficiency} is above 40 but below target ${skill?.target_proficiency}. Continue practicing.`}
                          {ls.status === 'weak' && `Proficiency ${ls.proficiency} is below 40. Focus on fundamentals and practice exercises.`}
                          {ls.status === 'missing' && `This skill has not been assessed yet. Start learning to track progress.`}
                        </p>
                      </div>
                      {prereqSkills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Prerequisites:</p>
                          <div className="flex flex-wrap gap-1">
                            {prereqSkills.map((p) => <Badge key={p.id} variant="outline" className="text-xs">{p.name}</Badge>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${bg} ${color} mb-2`}>{label}</div>
        <p className="text-2xl font-bold font-display">{count}</p>
      </CardContent>
    </Card>
  );
}

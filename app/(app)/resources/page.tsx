'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookMarked, ExternalLink, Check, SkipForward, Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, EmptyState, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { runResourceCurator, recordResourceInteraction } from '@/agents/resourceCurator';
import { toast } from 'sonner';
import type { Resource, ResourceInteraction, LearnerSkill, Skill, LearningPreferences, ResourceType, Difficulty } from '@/types';

export default function ResourcesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [interactions, setInteractions] = useState<ResourceInteraction[]>([]);
  const [recommendations, setRecommendations] = useState<{ resourceId: string; title: string; reason: string; score: number }[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: rsc }, { data: ri }, { data: ls }, { data: all }, { data: prefs }, { data: skills }] = await Promise.all([
      supabase.from('resources').select('*'),
      supabase.from('resource_interactions').select('*').eq('user_id', user.id),
      supabase.from('learner_skills').select('*, skill:skills(*)').eq('user_id', user.id),
      supabase.from('skills').select('*'),
      supabase.from('learning_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('skills').select('*'),
    ]);
    const allResources = (rsc || []) as Resource[];
    const allInteractions = (ri || []) as ResourceInteraction[];
    setResources(allResources);
    setInteractions(allInteractions);
    setAllSkills((skills || []) as Skill[]);

    // Compute recommendations
    const learnerSkills = (ls || []) as unknown as (LearnerSkill & { skill?: Skill })[];
    const gapSkillIds = learnerSkills.filter((l) => l.proficiency < 40).map((l) => l.skill_id);
    const recs = runResourceCurator({
      resources: allResources,
      learnerSkills,
      interactions: allInteractions,
      preferences: prefs as LearningPreferences | null,
      gapSkillIds,
    });
    setRecommendations(recs.slice(0, 6));

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleInteraction(resourceId: string, type: 'viewed' | 'completed' | 'skipped' | 'bookmarked') {
    if (!user) return;
    await recordResourceInteraction(user.id, resourceId, type, supabase);
    toast.success(type === 'completed' ? 'Resource completed' : type === 'bookmarked' ? 'Bookmarked' : type === 'skipped' ? 'Skipped' : 'Opened');
    await load();
  }

  if (loading) return <LoadingState message="Loading resources..." />;

  const filtered = resources.filter((r) => {
    if (typeFilter !== 'all' && r.resource_type !== typeFilter) return false;
    if (skillFilter !== 'all' && r.skill_id !== skillFilter) return false;
    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) return false;
    return true;
  });

  const interactedMap = new Map(interactions.map((i) => [i.resource_id, i.interaction_type]));

  return (
    <div className="space-y-6">
      <PageHeader title="Resources" description="Recommended learning materials tailored to your profile" />

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recommended for You</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec) => {
                const resource = resources.find((r) => r.id === rec.resourceId);
                if (!resource) return null;
                return (
                  <div key={rec.resourceId} className="flex items-center gap-3 p-3 border rounded-lg bg-electric/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{resource.resource_type}</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleInteraction(rec.resourceId, 'viewed')}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="text-lg">All Resources</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Skill" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((r) => {
                const interaction = interactedMap.get(r.id);
                return (
                  <div key={r.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{r.resource_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{r.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground">{r.estimated_minutes}min</span>
                      {interaction && (
                        <Badge className="text-xs capitalize bg-green-100 text-green-700">{interaction}</Badge>
                      )}
                    </div>
                    {r.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t">{r.content}</p>
                    )}
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" variant="outline" onClick={() => handleInteraction(r.id, 'viewed')}>
                        <ExternalLink className="w-3 h-3 mr-1" /> Open
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleInteraction(r.id, 'completed')}>
                        <Check className="w-3 h-3 mr-1" /> Complete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleInteraction(r.id, 'bookmarked')}>
                        <Bookmark className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleInteraction(r.id, 'skipped')}>
                        <SkipForward className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={BookMarked} title="No resources found" description="Try adjusting your filters." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

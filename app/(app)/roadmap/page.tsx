'use client';

import { useState, useEffect, useCallback } from 'react';
import { Map, Lock, CheckCircle2, Circle, AlertCircle, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader, EmptyState, LoadingState, StatusBadge } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { generateRoadmap } from '@/services/roadmapService';
import { toast } from 'sonner';
import type { Roadmap, RoadmapItem } from '@/types';

export default function RoadmapPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rm } = await supabase
      .from('roadmaps').select('*').eq('user_id', user.id).eq('status', 'active')
      .order('version', { ascending: false }).maybeSingle();
    if (rm) {
      const { data: ri } = await supabase
        .from('roadmap_items').select('*').eq('roadmap_id', rm.id)
        .order('phase, order_index');
      setRoadmap(rm as Roadmap);
      setItems((ri || []) as RoadmapItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    try {
      await generateRoadmap(user.id);
      toast.success('Roadmap generated successfully!');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  }

  async function markItemComplete(itemId: string) {
    if (!user) return;
    await supabase.from('roadmap_items').update({
      mastery_state: 'DEVELOPING',
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', itemId);
    toast.success('Item marked as complete');
    await load();
  }

  if (loading) return <LoadingState message="Loading roadmap..." />;

  const completed = items.filter((i) => i.status === 'completed').length;
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  // Group by phase
  const phases = items.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = { title: item.phase_title, items: [] };
    acc[item.phase].items.push(item);
    return acc;
  }, {} as Record<number, { title: string; items: RoadmapItem[] }>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Roadmap"
        description={roadmap ? `${roadmap.title} · ${roadmap.total_phases} phases · ${roadmap.estimated_hours}h` : 'Your personalized learning path'}
        action={!roadmap ? (
          <Button onClick={handleGenerate} disabled={generating} className="bg-electric hover:bg-electric/90">
            {generating ? 'Generating...' : 'Generate Roadmap'}
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={generating} variant="outline">
            {generating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        )}
      />

      {!roadmap ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Map}
              title="No roadmap exists yet"
              description="Generate your personalized roadmap based on your skills, goals, and available study time."
              action={<Button onClick={handleGenerate} disabled={generating} className="bg-electric hover:bg-electric/90">Generate Now</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{completed}/{items.length} items ({progress}%)</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Completed: {completed}</span>
                <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-blue-500" /> Available: {items.filter(i => i.status === 'available').length}</span>
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-gray-400" /> Locked: {items.filter(i => i.status === 'locked').length}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-500" /> Delayed: {items.filter(i => i.status === 'delayed').length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Phases */}
          {Object.entries(phases).map(([phase, data]) => (
            <div key={phase}>
              <h2 className="font-display text-lg font-semibold mb-3">{data.title}</h2>
              <div className="space-y-2">
                {data.items.map((item) => (
                  <RoadmapItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                    onComplete={() => markItemComplete(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Detail Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedItem(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">{selectedItem.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              <div className="flex gap-2 flex-wrap">
                <StatusBadge status={selectedItem.mastery_state} />
                <StatusBadge status={selectedItem.status} />
                <Badge variant="outline" className="text-xs capitalize">{selectedItem.item_type}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" /> {selectedItem.estimated_minutes} minutes
              </div>
              {selectedItem.prerequisites.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prerequisites</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.prerequisites.map((p) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                  </div>
                </div>
              )}
              {selectedItem.status === 'available' && selectedItem.mastery_state !== 'MASTERED' && (
                <Button onClick={() => { markItemComplete(selectedItem.id); setSelectedItem(null); }} className="w-full bg-electric hover:bg-electric/90">
                  Mark Complete
                </Button>
              )}
              {selectedItem.status === 'delayed' && (
                <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">This item is delayed because a prerequisite assessment needs revision.</p>
              )}
              {selectedItem.status === 'locked' && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">Complete previous items to unlock this.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RoadmapItemCard({ item, onClick, onComplete }: { item: RoadmapItem; onClick: () => void; onComplete: () => void }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    completed: CheckCircle2,
    available: Play,
    locked: Lock,
    delayed: AlertCircle,
    in_progress: Circle,
  };
  const Icon = icons[item.status] || Circle;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-electric/50 ${item.status === 'delayed' ? 'border-orange-200 bg-orange-50' : ''}`} onClick={onClick}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${
        item.status === 'completed' ? 'text-green-500' :
        item.status === 'available' ? 'text-blue-500' :
        item.status === 'delayed' ? 'text-orange-500' : 'text-gray-400'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground capitalize">{item.item_type} · {item.estimated_minutes}min</p>
      </div>
      <StatusBadge status={item.mastery_state} />
    </div>
  );
}

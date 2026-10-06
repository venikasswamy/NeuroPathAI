'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Play, Square, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { submitFeedback } from '@/services/feedbackEngine';
import { toast } from 'sonner';
import type { RoadmapItem, LearningSession } from '@/types';

export default function LearningPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availableItems, setAvailableItems] = useState<RoadmapItem[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: items }, { data: sess }] = await Promise.all([
      supabase.from('roadmap_items').select('*').eq('user_id', user.id).in('status', ['available', 'in_progress']).order('phase, order_index'),
      supabase.from('learning_sessions').select('*').eq('user_id', user.id).order('start_time', { ascending: false }).limit(10),
    ]);
    setAvailableItems((items || []) as RoadmapItem[]);
    setSessions((sess || []) as LearningSession[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function startSession(item: RoadmapItem) {
    if (!user) return;
    setSelectedItem(item);
    const { data, error } = await supabase.from('learning_sessions').insert({
      user_id: user.id,
      roadmap_item_id: item.id,
      topic: item.title,
      lesson_title: item.title,
      objectives: [item.description],
      start_time: new Date().toISOString(),
      completion_percentage: 0,
    }).select().single();

    if (error) { toast.error('Failed to start session'); return; }
    setActiveSession(data as LearningSession);
    await supabase.from('roadmap_items').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', item.id);
    toast.success('Session started');
  }

  async function completeSession() {
    if (!user || !activeSession || !selectedItem) return;
    setCompleting(true);
    try {
      const endTime = new Date();
      const durationMin = Math.round((endTime.getTime() - new Date(activeSession.start_time).getTime()) / 60000);

      await supabase.from('learning_sessions').update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMin,
        completion_percentage: 100,
        self_confidence: confidence,
        difficulty_rating: difficulty,
        notes,
      }).eq('id', activeSession.id);

      await submitFeedback({
        userId: user.id,
        sessionId: activeSession.id,
        roadmapItemId: selectedItem.id,
        difficultyRating: difficulty,
        confidence,
        satisfaction: 4,
        comments: notes,
      });

      await supabase.from('roadmap_items').update({
        mastery_state: 'DEVELOPING',
        status: 'completed',
        completed_at: endTime.toISOString(),
        updated_at: endTime.toISOString(),
      }).eq('id', selectedItem.id);

      toast.success('Session completed!');
      setActiveSession(null);
      setSelectedItem(null);
      setNotes('');
      setConfidence(3);
      setDifficulty(3);
      await load();
    } catch (err) {
      toast.error('Failed to complete session');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return <LoadingState message="Loading learning items..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Sessions" description="Start a session and track your learning progress" />

      {activeSession ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" /> Active Session: {selectedItem?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Session started at {new Date(activeSession.start_time).toLocaleTimeString()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Learning Objectives</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-electric mt-0.5 flex-shrink-0" /> {selectedItem?.description}</li>
              </ul>
            </div>
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label className="text-sm">Self-Confidence: {confidence}/5</Label>
                <input type="range" min="1" max="5" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full accent-electric mt-1" />
              </div>
              <div>
                <Label className="text-sm">Difficulty: {difficulty}/5</Label>
                <input type="range" min="1" max="5" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full accent-electric mt-1" />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you learn?" rows={3} />
              </div>
              <Button onClick={completeSession} disabled={completing} className="w-full bg-electric hover:bg-electric/90">
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
                Complete Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Available Learning Items */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Available Learning Items</CardTitle></CardHeader>
            <CardContent>
              {availableItems.length > 0 ? (
                <div className="space-y-2">
                  {availableItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.item_type} · {item.estimated_minutes}min · Phase {item.phase}</p>
                      </div>
                      <Button size="sm" onClick={() => startSession(item)} className="bg-electric hover:bg-electric/90">
                        <Play className="w-3 h-3 mr-1" /> Start
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BookOpen} title="No available learning items" description="Generate a roadmap or complete prerequisite items first." />
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Sessions</CardTitle></CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.topic}</p>
                        <p className="text-xs text-muted-foreground">{s.duration_minutes}min · {new Date(s.start_time).toLocaleDateString()}</p>
                      </div>
                      {s.self_confidence && <Badge variant="outline" className="text-xs">Confidence: {s.self_confidence}/5</Badge>}
                      <span className="text-sm font-medium">{s.completion_percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Clock} title="No sessions yet" description="Start your first learning session above." />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

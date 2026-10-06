'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Save, Loader2, Target, Clock, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { LearnerProfile, LearningPreferences, ProficiencyLevel, LearningStyle } from '@/types';

const STYLES: { value: LearningStyle; label: string }[] = [
  { value: 'hands_on', label: 'Hands-on' },
  { value: 'visual', label: 'Visual' },
  { value: 'reading', label: 'Reading' },
  { value: 'video', label: 'Video' },
  { value: 'project_based', label: 'Project-based' },
  { value: 'mixed', label: 'Mixed' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [prefs, setPrefs] = useState<LearningPreferences | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<LearnerProfile>>({});
  const [editedPrefs, setEditedPrefs] = useState<Partial<LearningPreferences>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [p, lp, pr] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('learning_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    setName(p.data?.name || '');
    setProfile(lp.data as LearnerProfile | null);
    setPrefs(pr.data as LearningPreferences | null);
    setEditedProfile(lp.data || {});
    setEditedPrefs(pr.data || {});
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      if (name) {
        await supabase.from('profiles').update({ name, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      }
      if (profile) {
        await supabase.from('learner_profiles').update({
          target_career: editedProfile.target_career,
          target_role: editedProfile.target_role,
          goal_description: editedProfile.goal_description,
          current_level: editedProfile.current_level,
          hours_per_day: editedProfile.hours_per_day,
          days_per_week: editedProfile.days_per_week,
          target_deadline: editedProfile.target_deadline,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }
      if (prefs) {
        await supabase.from('learning_preferences').update({
          dominant_style: editedPrefs.dominant_style,
          secondary_style: editedPrefs.secondary_style,
          preferred_difficulty: editedPrefs.preferred_difficulty,
          session_length_minutes: editedPrefs.session_length_minutes,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }
      toast.success('Profile updated successfully');
      await load();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading profile..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your learner profile and preferences"
        action={
          <Button onClick={handleSave} disabled={saving} className="bg-electric hover:bg-electric/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        }
      />

      {/* Personal Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-electric" /> Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted/50" />
          </div>
        </CardContent>
      </Card>

      {/* Learning Goal */}
      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-electric" /> Learning Goal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="career">Target Career</Label>
                <Input id="career" value={editedProfile.target_career || ''} onChange={(e) => setEditedProfile({ ...editedProfile, target_career: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Target Role</Label>
                <Input id="role" value={editedProfile.target_role || ''} onChange={(e) => setEditedProfile({ ...editedProfile, target_role: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal Description</Label>
              <Textarea id="goal" value={editedProfile.goal_description || ''} onChange={(e) => setEditedProfile({ ...editedProfile, goal_description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as ProficiencyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setEditedProfile({ ...editedProfile, current_level: level })}
                  className={`p-3 rounded-lg border-2 text-center text-sm font-medium capitalize transition-all ${
                    editedProfile.current_level === level ? 'border-electric bg-electric/10 text-electric' : 'border-border'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability */}
      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-electric" /> Availability</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hpd">Hours/day</Label>
                <Input id="hpd" type="number" min="0.5" max="12" step="0.5" value={editedProfile.hours_per_day || 2} onChange={(e) => setEditedProfile({ ...editedProfile, hours_per_day: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dpw">Days/week</Label>
                <Input id="dpw" type="number" min="1" max="7" value={editedProfile.days_per_week || 5} onChange={(e) => setEditedProfile({ ...editedProfile, days_per_week: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={editedProfile.target_deadline || ''} onChange={(e) => setEditedProfile({ ...editedProfile, target_deadline: e.target.value })} />
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              Weekly study time: <span className="font-bold text-foreground">{(editedProfile.hours_per_day || 0) * (editedProfile.days_per_week || 0)} hours</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Preferences */}
      {prefs && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-electric" /> Learning Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Dominant Style</Label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setEditedPrefs({ ...editedPrefs, dominant_style: s.value })}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      editedPrefs.dominant_style === s.value ? 'border-electric bg-electric/10 text-electric' : 'border-border'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Secondary Style</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEditedPrefs({ ...editedPrefs, secondary_style: null })}
                  className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    !editedPrefs.secondary_style ? 'border-electric bg-electric/10 text-electric' : 'border-border'
                  }`}
                >
                  None
                </button>
                {STYLES.filter((s) => s.value !== editedPrefs.dominant_style).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setEditedPrefs({ ...editedPrefs, secondary_style: s.value })}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      editedPrefs.secondary_style === s.value ? 'border-electric bg-electric/10 text-electric' : 'border-border'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Preferred Difficulty</Label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setEditedPrefs({ ...editedPrefs, preferred_difficulty: d })}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                      editedPrefs.preferred_difficulty === d ? 'border-electric bg-electric/10 text-electric' : 'border-border'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {prefs.style_confidence !== undefined && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Style Confidence: <span className="font-bold text-foreground">{prefs.style_confidence}%</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Challenges */}
      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Learning Challenges</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.learning_challenges?.map((c) => (
                <Badge key={c} variant="outline" className="capitalize">{c}</Badge>
              )) || <p className="text-sm text-muted-foreground">No challenges recorded.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

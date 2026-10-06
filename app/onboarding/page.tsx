'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { getAllSkills } from '@/lib/database/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Target,
  GraduationCap,
  Clock,
  Calendar,
  Palette,
  Briefcase,
  AlertCircle,
  Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Skill, LearningStyle, ProficiencyLevel } from '@/types';

const STEPS = [
  { label: 'Personal', icon: Brain },
  { label: 'Goal', icon: Target },
  { label: 'Level', icon: GraduationCap },
  { label: 'Skills', icon: BarChartIcon },
  { label: 'Availability', icon: Clock },
  { label: 'Deadline', icon: Calendar },
  { label: 'Preferences', icon: Palette },
  { label: 'Experience', icon: Briefcase },
  { label: 'Challenges', icon: AlertCircle },
  { label: 'Review', icon: Rocket },
];

function BarChartIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="8" />
      <rect x="12" y="6" width="3" height="12" />
      <rect x="17" y="13" width="3" height="5" />
    </svg>
  );
}

const LEARNING_STYLES: { value: LearningStyle; label: string }[] = [
  { value: 'hands_on', label: 'Hands-on' },
  { value: 'visual', label: 'Visual' },
  { value: 'reading', label: 'Reading' },
  { value: 'video', label: 'Video' },
  { value: 'project_based', label: 'Project-based' },
  { value: 'mixed', label: 'Mixed' },
];

const CHALLENGES = [
  'consistency',
  'difficulty understanding concepts',
  'lack of practice',
  'time management',
  'retention',
  'motivation',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);

  const [form, setForm] = useState({
    name: '',
    target_career: '',
    target_role: '',
    goal_description: '',
    current_level: 'beginner' as ProficiencyLevel,
    selected_skills: {} as Record<string, number>,
    hours_per_day: 2,
    days_per_week: 5,
    target_deadline: '',
    learning_styles: ['hands_on'] as LearningStyle[],
    previous_projects: '',
    previous_courses: '',
    previous_experience: '',
    challenges: [] as string[],
  });

  useEffect(() => {
    if (initialized && !user) {
      router.push('/login');
    }
  }, [user, initialized, router]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.user_metadata?.name || '' }));
    }
  }, [user]);

  useEffect(() => {
    getAllSkills().then(setSkills);
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  function toggleSkill(skillId: string) {
    setForm((f) => {
      const next = { ...f.selected_skills };
      if (next[skillId] !== undefined) {
        delete next[skillId];
      } else {
        next[skillId] = 30;
      }
      return { ...f, selected_skills: next };
    });
  }

  function setSkillProficiency(skillId: string, value: number) {
    setForm((f) => ({
      ...f,
      selected_skills: { ...f.selected_skills, [skillId]: value },
    }));
  }

  function toggleChallenge(challenge: string) {
    setForm((f) => ({
      ...f,
      challenges: f.challenges.includes(challenge)
        ? f.challenges.filter((c) => c !== challenge)
        : [...f.challenges, challenge],
    }));
  }

  function toggleStyle(style: LearningStyle) {
    setForm((f) => ({
      ...f,
      learning_styles: f.learning_styles.includes(style)
        ? f.learning_styles.filter((s) => s !== style)
        : [...f.learning_styles, style],
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!form.name;
      case 1: return !!form.target_career && !!form.target_role;
      case 2: return !!form.current_level;
      case 3: return Object.keys(form.selected_skills).length > 0;
      case 4: return form.hours_per_day > 0 && form.days_per_week > 0;
      case 5: return !!form.target_deadline;
      case 6: return form.learning_styles.length > 0;
      case 7: return true;
      case 8: return true;
      case 9: return true;
      default: return false;
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error: lpError } = await supabase.from('learner_profiles').upsert({
        user_id: user.id,
        target_career: form.target_career,
        target_role: form.target_role,
        goal_description: form.goal_description,
        current_level: form.current_level,
        hours_per_day: form.hours_per_day,
        days_per_week: form.days_per_week,
        target_deadline: form.target_deadline,
        previous_projects: form.previous_projects || null,
        previous_courses: form.previous_courses || null,
        previous_experience: form.previous_experience || null,
        learning_challenges: form.challenges,
        onboarded: true,
        updated_at: new Date().toISOString(),
      });
      if (lpError) throw lpError;

      const dominantStyle = form.learning_styles[0] || 'mixed';
      const secondaryStyle = form.learning_styles[1] || null;

      const { error: prefError } = await supabase.from('learning_preferences').upsert({
        user_id: user.id,
        dominant_style: dominantStyle,
        secondary_style: secondaryStyle,
        style_confidence: 40,
        style_signals: { onboarding: form.learning_styles },
        preferred_difficulty: form.current_level === 'advanced' ? 'advanced' : form.current_level === 'beginner' ? 'beginner' : 'intermediate',
        session_length_minutes: Math.min(form.hours_per_day * 60, 120),
        updated_at: new Date().toISOString(),
      });
      if (prefError) throw prefError;

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: `Become a ${form.target_role}`,
          description: form.goal_description,
          target_role: form.target_role,
          target_deadline: form.target_deadline,
          status: 'active',
        })
        .select()
        .single();
      if (goalError) throw goalError;

      for (const [skillId, proficiency] of Object.entries(form.selected_skills)) {
        let status = 'missing';
        if (proficiency >= 70) status = 'mastered';
        else if (proficiency >= 40) status = 'developing';
        else if (proficiency > 0) status = 'weak';

        await supabase.from('learner_skills').upsert({
          user_id: user.id,
          skill_id: skillId,
          proficiency,
          status,
          evidence: ['onboarding_self_assessment'],
          updated_at: new Date().toISOString(),
        });
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'roadmap_adjustment',
        title: 'Welcome to NeuroPath AI',
        message: 'Your profile is set up. Visit the dashboard to generate your personalized roadmap.',
        link: '/dashboard',
      });

      toast.success('Onboarding complete! Your learning profile is ready.');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save onboarding data';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-electric animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-light py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-electric flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome to NeuroPath AI</h1>
          <p className="text-white/60 text-sm mt-1">Let&apos;s set up your personalized learning profile</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm text-white/60">{STEPS[step].label}</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
        </div>

        {/* Step content */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Tell us about yourself.</p>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Learning Goal</h2>
                <p className="text-sm text-muted-foreground">What do you want to achieve?</p>
                <div className="space-y-2">
                  <Label htmlFor="career">Target Career / Field</Label>
                  <Input
                    id="career"
                    value={form.target_career}
                    onChange={(e) => setForm({ ...form, target_career: e.target.value })}
                    placeholder="e.g., Machine Learning Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Target Role</Label>
                  <Input
                    id="role"
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    placeholder="e.g., ML Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Goal Description (Optional)</Label>
                  <Textarea
                    id="goal"
                    value={form.goal_description}
                    onChange={(e) => setForm({ ...form, goal_description: e.target.value })}
                    placeholder="Describe your learning goal in detail..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Current Level</h2>
                <p className="text-sm text-muted-foreground">How would you rate your current expertise?</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['beginner', 'intermediate', 'advanced'] as ProficiencyLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setForm({ ...form, current_level: level })}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        form.current_level === level
                          ? 'border-electric bg-electric/10 text-electric'
                          : 'border-border hover:border-electric/50'
                      }`}
                    >
                      <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium capitalize">{level}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Current Skills</h2>
                <p className="text-sm text-muted-foreground">Select your skills and rate your proficiency (0–100).</p>
                <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-2">
                  {skills.map((skill) => {
                    const selected = form.selected_skills[skill.id] !== undefined;
                    return (
                      <div
                        key={skill.id}
                        className={`p-3 rounded-lg border transition-all ${
                          selected ? 'border-electric bg-electric/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleSkill(skill.id)}
                            />
                            <span className="text-sm font-medium">{skill.name}</span>
                            <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                          </div>
                          {selected && (
                            <span className="text-sm font-bold text-electric">
                              {form.selected_skills[skill.id]}
                            </span>
                          )}
                        </div>
                        {selected && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={form.selected_skills[skill.id]}
                            onChange={(e) => setSkillProficiency(skill.id, Number(e.target.value))}
                            className="w-full accent-electric"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(form.selected_skills).length} skill(s) selected
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Availability</h2>
                <p className="text-sm text-muted-foreground">How much time can you dedicate to learning?</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hpd">Hours per day</Label>
                    <Input
                      id="hpd"
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={form.hours_per_day}
                      onChange={(e) => setForm({ ...form, hours_per_day: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dpw">Days per week</Label>
                    <Input
                      id="dpw"
                      type="number"
                      min="1"
                      max="7"
                      value={form.days_per_week}
                      onChange={(e) => setForm({ ...form, days_per_week: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    That&apos;s <span className="font-bold text-foreground">{form.hours_per_day * form.days_per_week} hours/week</span> of study time.
                  </p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Target Deadline</h2>
                <p className="text-sm text-muted-foreground">When do you want to achieve your goal?</p>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Target Completion Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={form.target_deadline}
                    onChange={(e) => setForm({ ...form, target_deadline: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 3);
                      setForm({ ...form, target_deadline: d.toISOString().split('T')[0] });
                    }}
                  >
                    3 months
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 6);
                      setForm({ ...form, target_deadline: d.toISOString().split('T')[0] });
                    }}
                  >
                    6 months
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 12);
                      setForm({ ...form, target_deadline: d.toISOString().split('T')[0] });
                    }}
                  >
                    1 year
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 4);
                      setForm({ ...form, target_deadline: d.toISOString().split('T')[0] });
                    }}
                  >
                    4 months (demo)
                  </Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Learning Preferences</h2>
                <p className="text-sm text-muted-foreground">How do you learn best? Select all that apply.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {LEARNING_STYLES.map((style) => {
                    const selected = form.learning_styles.includes(style.value);
                    return (
                      <button
                        key={style.value}
                        onClick={() => toggleStyle(style.value)}
                        className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                          selected
                            ? 'border-electric bg-electric/10 text-electric'
                            : 'border-border hover:border-electric/50'
                        }`}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your first selection becomes your dominant style.
                </p>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Experience</h2>
                <p className="text-sm text-muted-foreground">Tell us about your background (optional).</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="projects">Previous Projects</Label>
                    <Textarea
                      id="projects"
                      value={form.previous_projects}
                      onChange={(e) => setForm({ ...form, previous_projects: e.target.value })}
                      placeholder="Describe any relevant projects you've worked on..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courses">Previous Courses</Label>
                    <Textarea
                      id="courses"
                      value={form.previous_courses}
                      onChange={(e) => setForm({ ...form, previous_courses: e.target.value })}
                      placeholder="List courses you've completed..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp">Work / Internship Experience</Label>
                    <Textarea
                      id="exp"
                      value={form.previous_experience}
                      onChange={(e) => setForm({ ...form, previous_experience: e.target.value })}
                      placeholder="Describe any relevant work or internship experience..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Learning Challenges</h2>
                <p className="text-sm text-muted-foreground">What challenges do you face when learning?</p>
                <div className="grid grid-cols-2 gap-3">
                  {CHALLENGES.map((challenge) => {
                    const selected = form.challenges.includes(challenge);
                    return (
                      <button
                        key={challenge}
                        onClick={() => toggleChallenge(challenge)}
                        className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all capitalize ${
                          selected
                            ? 'border-electric bg-electric/10 text-electric'
                            : 'border-border hover:border-electric/50'
                        }`}
                      >
                        {challenge}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Review & Confirm</h2>
                <p className="text-sm text-muted-foreground">Please review your information before saving.</p>
                <div className="space-y-3">
                  <ReviewItem label="Name" value={form.name} />
                  <ReviewItem label="Target Career" value={form.target_career} />
                  <ReviewItem label="Target Role" value={form.target_role} />
                  <ReviewItem label="Current Level" value={form.current_level} />
                  <ReviewItem label="Skills Selected" value={`${Object.keys(form.selected_skills).length} skills`} />
                  <ReviewItem label="Availability" value={`${form.hours_per_day} hrs/day, ${form.days_per_week} days/week`} />
                  <ReviewItem label="Deadline" value={form.target_deadline} />
                  <ReviewItem label="Learning Style" value={form.learning_styles.join(', ')} />
                  <ReviewItem label="Challenges" value={form.challenges.join(', ') || 'None'} />
                </div>
                <div className="p-4 bg-electric/5 rounded-lg border border-electric/20">
                  <p className="text-sm text-muted-foreground">
                    After saving, the system will run the <span className="font-bold text-electric">Intake Agent</span>,{' '}
                    <span className="font-bold text-electric">Style Profiler</span>, and{' '}
                    <span className="font-bold text-electric">Gap Detector</span> to prepare your personalized learning plan.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || saving}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-electric hover:bg-electric/90"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-electric hover:bg-electric/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Complete <Check className="w-4 h-4 ml-2" /></>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

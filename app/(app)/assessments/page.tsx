'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PageHeader, EmptyState, LoadingState, StatusBadge } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { getQuestionsForSkill, createAssessment, submitAssessment } from '@/services/assessmentService';
import { toast } from 'sonner';
import type { AssessmentQuestion, Assessment, Skill } from '@/types';

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [takingAssessment, setTakingAssessment] = useState(false);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ percent: number; mastery: string; correct: number; total: number } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from('assessments').select('*, skill:skills(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('skills').select('*'),
    ]);
    setAssessments((a || []) as unknown as Assessment[]);
    setAllSkills((s || []) as Skill[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function startNewAssessment(skill: Skill) {
    if (!user) return;
    setTakingAssessment(true);
    setCurrentSkill(skill);
    setResult(null);
    setAnswers({});
    setStartTime(Date.now());

    const qs = await getQuestionsForSkill(skill.id, 5);
    if (qs.length === 0) {
      toast.error('No questions available for this skill');
      setTakingAssessment(false);
      return;
    }
    setQuestions(qs);

    const assessmentId = await createAssessment(user.id, skill.id, skill.name);
    if (!assessmentId) {
      toast.error('Failed to create assessment');
      setTakingAssessment(false);
      return;
    }
    setCurrentAssessmentId(assessmentId);
  }

  async function handleSubmit() {
    if (!user || !currentAssessmentId || !currentSkill) return;
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const { attempt, mastery, percent } = await submitAssessment(
        user.id, currentAssessmentId, answers, questions, timeTaken
      );
      const correct = attempt.score;
      setResult({ percent, mastery, correct, total: questions.length });
      toast.success(`Assessment submitted: ${percent}% — ${mastery.replace(/_/g, ' ')}`);
      await load();
    } catch (err) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  }

  function resetAssessment() {
    setTakingAssessment(false);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentSkill(null);
    setCurrentAssessmentId(null);
  }

  if (loading) return <LoadingState message="Loading assessments..." />;

  // Skills without completed assessments
  const assessedSkillIds = new Set(assessments.map((a) => a.skill_id));
  const availableSkills = allSkills.filter((s) => !assessedSkillIds.has(s.id) || true);

  if (takingAssessment && currentSkill) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${currentSkill.name} Assessment`} description="Answer all questions and submit to evaluate your mastery" />

        {result ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {result.percent >= 70 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-orange-500" />}
                Assessment Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold font-display">{result.percent}%</p>
                <p className="text-sm text-muted-foreground mt-1">{result.correct} out of {result.total} correct</p>
              </div>
              <StatusBadge status={result.mastery} />
              {result.percent < 70 && (
                <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
                  This skill needs revision. The system will add revision practice to your roadmap and schedule a reassessment.
                </div>
              )}
              {result.percent >= 70 && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  Mastery achieved! Your skill proficiency has been updated and dependent roadmap items are unlocked.
                </div>
              )}
              {/* Show explanations */}
              <div className="space-y-2 pt-3 border-t">
                <p className="text-sm font-medium">Review:</p>
                {questions.map((q, i) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                  return (
                    <div key={q.id} className={`p-2 rounded-lg text-sm ${isCorrect ? 'bg-green-50' : 'bg-orange-50'}`}>
                      <p className="font-medium">{i + 1}. {q.question}</p>
                      <p className="text-xs mt-1">Your answer: {userAnswer || 'Not answered'}</p>
                      {!isCorrect && <p className="text-xs text-green-700">Correct: {q.correct_answer}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
              <Button onClick={resetAssessment} className="w-full bg-electric hover:bg-electric/90">
                <RotateCcw className="w-4 h-4 mr-2" /> Back to Assessments
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2 p-3 border rounded-lg">
                  <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                  <Badge variant="outline" className="text-xs capitalize">{q.question_type.replace(/_/g, ' ')}</Badge>
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                  >
                    {q.options.map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                        <Label htmlFor={`${q.id}-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="w-full bg-electric hover:bg-electric/90"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Assessment'}
              </Button>
              {Object.keys(answers).length < questions.length && (
                <p className="text-xs text-muted-foreground text-center">
                  {Object.keys(answers).length}/{questions.length} questions answered
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Test your knowledge and track mastery" />

      {/* Available Skills for Assessment */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Take a New Assessment</CardTitle></CardHeader>
        <CardContent>
          {availableSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableSkills.map((skill) => (
                <Button key={skill.id} variant="outline" onClick={() => startNewAssessment(skill)} className="justify-start h-auto p-3">
                  <div className="text-left">
                    <p className="text-sm font-medium">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">{skill.category}</p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardCheck} title="No skills available" description="Complete onboarding to unlock assessments." />
          )}
        </CardContent>
      </Card>

      {/* Assessment History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Assessment History</CardTitle></CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="space-y-2">
              {assessments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.status} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  {a.score !== null && (
                    <span className="text-sm font-bold">{Math.round((a.score / a.max_score) * 100)}%</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardCheck} title="No assessments taken yet" description="Select a skill above to start your first assessment." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

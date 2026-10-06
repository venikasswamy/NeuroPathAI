'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain, Target, TrendingUp, AlertTriangle, RefreshCw, BookOpen,
  ClipboardCheck, BarChart3, Activity, Zap, ArrowRight, Rocket,
  Loader2, CheckCircle2, Clock, Bell, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState, StatusBadge, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { generateRoadmap } from '@/services/roadmapService';
import { runAdaptiveDemo } from '@/services/adaptiveDemo';
import { toast } from 'sonner';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';
import type {
  LearnerProfile, CognitiveTwin, DriftRecord, ShadowPrediction,
  RoadmapItem, Roadmap, Notification, LearningSession, AgentRun,
} from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [twin, setTwin] = useState<CognitiveTwin | null>(null);
  const [drift, setDrift] = useState<DriftRecord | null>(null);
  const [shadow, setShadow] = useState<ShadowPrediction | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [showTrace, setShowTrace] = useState(false);
  const [demoTrace, setDemoTrace] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: profile },
        { data: lp },
        { data: ct },
        { data: driftRecords },
        { data: shadowPreds },
        { data: activeRoadmap },
        { data: rItems },
        { data: sess },
        { data: notifs },
        { data: aRuns },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('learner_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('cognitive_twins').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('drift_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('shadow_predictions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('roadmaps').select('*').eq('user_id', user.id).eq('status', 'active').order('version', { ascending: false }).maybeSingle(),
        supabase.from('roadmap_items').select('*').eq('user_id', user.id).order('phase, order_index'),
        supabase.from('learning_sessions').select('*').eq('user_id', user.id).order('start_time', { ascending: false }).limit(5),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('agent_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);

      setProfileName(profile?.name || 'Learner');
      setLearnerProfile(lp as LearnerProfile | null);
      setTwin(ct as CognitiveTwin | null);
      setDrift((driftRecords?.[0] as DriftRecord) || null);
      setShadow((shadowPreds?.[0] as ShadowPrediction) || null);
      setRoadmap(activeRoadmap as Roadmap | null);
      setRoadmapItems((rItems || []) as RoadmapItem[]);
      setSessions((sess || []) as LearningSession[]);
      setNotifications((notifs || []) as Notification[]);
      setAgentRuns((aRuns || []) as AgentRun[]);
    } catch {
      // Silent — empty states will show
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleGenerateRoadmap() {
    if (!user) return;
    setGenerating(true);
    try {
      await generateRoadmap(user.id);
      toast.success('Roadmap generated! All 9 agents completed.');
      await loadDashboard();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate roadmap';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRunDemo() {
    if (!user) return;
    setDemoRunning(true);
    setDemoTrace([]);
    setShowTrace(true);
    try {
      const result = await runAdaptiveDemo(user.id);
      if (result.success) {
        setDemoTrace(result.trace);
        toast.success('Adaptive demo completed! Roadmap was adapted based on weak assessment.');
        await loadDashboard();
      } else {
        toast.error(result.error || 'Demo failed');
      }
    } catch (err) {
      toast.error('Demo failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDemoRunning(false);
    }
  }

  if (loading) return <LoadingState message="Loading dashboard..." />;

  const completedItems = roadmapItems.filter((i) => i.status === 'completed').length;
  const totalItems = roadmapItems.length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const skillRadarData = twin ? Object.entries(twin.skill_profile).slice(0, 8).map(([name, value]) => ({
    skill: name.length > 15 ? name.slice(0, 12) + '...' : name,
    proficiency: value,
  })) : [];

  const sessionChartData = sessions.slice(0, 7).reverse().map((s, i) => ({
    day: `S${i + 1}`,
    minutes: s.duration_minutes,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profileName}`}
        description={learnerProfile ? `Goal: ${learnerProfile.target_career}` : 'Your personalized learning dashboard'}
        action={
          <div className="flex gap-2">
            {!roadmap && (
              <Button onClick={handleGenerateRoadmap} disabled={generating} className="bg-electric hover:bg-electric/90">
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                Generate Roadmap
              </Button>
            )}
            <Button onClick={handleRunDemo} disabled={demoRunning} variant="outline" className="border-violet text-violet hover:bg-violet/10">
              {demoRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Run Adaptive Demo
            </Button>
          </div>
        }
      />

      {/* Demo Data Banner */}
      {learnerProfile?.goal_description?.includes('DEMO DATA') && (
        <div className="p-3 rounded-lg bg-violet/10 border border-violet/20 text-sm text-violet flex items-center gap-2">
          <Badge className="bg-violet text-white">DEMO MODE</Badge>
          This learner profile contains demo data. The Adaptive Demo has been run on this account.
        </div>
      )}

      {/* Agent Trace Panel */}
      {(showTrace || agentRuns.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-electric" /> Agent Execution Trace
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowTrace(!showTrace)}>
                {showTrace ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showTrace && (
            <CardContent className="pt-0">
              <div className="space-y-1">
                {(demoTrace.length > 0 ? demoTrace : agentRuns.map((r) => ({
                  agent: r.agent_name,
                  label: r.agent_name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                  status: r.status,
                  startedAt: r.started_at,
                  completedAt: r.completed_at,
                  durationMs: r.duration_ms,
                  inputSummary: JSON.stringify(r.input_summary).slice(0, 80),
                  outputSummary: JSON.stringify(r.output_summary).slice(0, 80),
                }))).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium w-40 flex-shrink-0">{t.label}</span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">{t.outputSummary}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{t.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          label="Overall Progress"
          value={`${progress}%`}
          subtext={`${completedItems}/${totalItems} items`}
        />
        <MetricCard
          icon={Activity}
          label="Consistency"
          value={twin ? `${twin.consistency_score}%` : '—'}
          subtext={twin ? twin.pace_label + ' pace' : 'No data'}
        />
        <MetricCard
          icon={TrendingUp}
          label="Drift Status"
          value={drift?.status || '—'}
          subtext={drift ? `Score: ${drift.drift_score}` : 'No data'}
          valueColor={drift?.status === 'STABLE' ? 'text-green-600' : drift?.status === 'WATCH' ? 'text-yellow-600' : drift?.status === 'DRIFTING' ? 'text-red-600' : ''}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Shadow Risk"
          value={shadow?.risk_level || '—'}
          subtext={shadow ? `${shadow.risk_factors.length} factors` : 'No data'}
          valueColor={shadow?.risk_level === 'LOW' ? 'text-green-600' : shadow?.risk_level === 'MEDIUM' ? 'text-yellow-600' : shadow?.risk_level === 'HIGH' ? 'text-red-600' : ''}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Roadmap & Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Roadmap */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-electric" /> Current Roadmap
                </CardTitle>
                <Link href="/roadmap">
                  <Button variant="ghost" size="sm">View All <ChevronRight className="w-4 h-4" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {roadmap ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{roadmap.title}</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {roadmap.total_phases} phases · {roadmap.estimated_hours}h estimated
                    </p>
                  </div>
                  <div className="space-y-2">
                    {roadmapItems.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">Phase {item.phase} · {item.item_type}</p>
                        </div>
                        <StatusBadge status={item.mastery_state} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No roadmap yet"
                  description="Generate your personalized learning roadmap to get started."
                  action={
                    <Button onClick={handleGenerateRoadmap} disabled={generating} className="bg-electric hover:bg-electric/90">
                      {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                      Generate Roadmap
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Learning Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-electric" /> Recent Activity
                </CardTitle>
                <Link href="/learning">
                  <Button variant="ghost" size="sm">Start Learning <ChevronRight className="w-4 h-4" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.duration_minutes}min · {new Date(s.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium">{s.completion_percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No sessions yet"
                  description="Start a learning session to track your progress."
                  action={<Link href="/learning"><Button variant="outline" size="sm">Start Session</Button></Link>}
                />
              )}
            </CardContent>
          </Card>

          {/* Skill Radar Chart */}
          {twin && skillRadarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-electric" /> Skill Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar dataKey="proficiency" stroke="hsl(var(--electric))" fill="hsl(var(--electric))" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Notifications, Twin, Upcoming */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-electric" /> Notifications
                </CardTitle>
                <Link href="/notifications"><Button variant="ghost" size="sm">All</Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((n) => (
                    <div key={n.id} className={`p-2 rounded-lg text-sm ${!n.read ? 'bg-electric/5 border-l-2 border-electric' : ''}`}>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No notifications</p>
              )}
            </CardContent>
          </Card>

          {/* Cognitive Twin Summary */}
          {twin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-electric" /> Cognitive Twin
                  </CardTitle>
                  <Link href="/cognitive-twin"><Button variant="ghost" size="sm">Details</Button></Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <TwinMetric label="Recent Performance" value={twin.recent_performance} />
                <TwinMetric label="Confidence" value={twin.confidence_score} />
                <TwinMetric label="Retention" value={twin.retention_status} />
                {twin.weak_areas.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Weak Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {twin.weak_areas.slice(0, 3).map((w) => (
                        <Badge key={w} variant="outline" className="text-xs text-orange-600 border-orange-200">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink href="/assessments" icon={ClipboardCheck} label="Take Assessment" />
              <QuickLink href="/retention" icon={RefreshCw} label="Review Due Items" />
              <QuickLink href="/resources" icon={BookOpen} label="Browse Resources" />
              <QuickLink href="/insights" icon={BarChart3} label="View Insights" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon, label, value, subtext, valueColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; subtext: string; valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold font-display">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        <p className={`text-xs mt-1 ${valueColor || 'text-muted-foreground'}`}>{subtext}</p>
      </CardContent>
    </Card>
  );
}

function TwinMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      <ArrowRight className="w-3 h-3 text-muted-foreground" />
    </Link>
  );
}

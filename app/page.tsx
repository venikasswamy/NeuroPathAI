'use client';

import Link from 'next/link';
import { Brain, ArrowRight, Network, Target, TrendingUp, Shield, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AGENTS = [
  { layer: 'Perception', agents: ['Intake Agent', 'Style Profiler', 'Gap Detector'] },
  { layer: 'Cognitive Intelligence', agents: ['Cognitive Twin Engine'] },
  { layer: 'Execution', agents: ['Adaptive Planner', 'Resource Curator', 'Drift Monitor'] },
  { layer: 'Adaptive Intelligence', agents: ['Shadow AI', 'Memory Retention Agent'] },
];

const FEATURES = [
  {
    icon: Target,
    title: 'Skill Gap Detection',
    desc: 'Compare your current skills against your target role. Identify mastered, developing, weak, and missing skills with a 0–100 proficiency scale.',
  },
  {
    icon: Brain,
    title: 'Cognitive Twin',
    desc: 'A digital learner model that tracks your knowledge, skills, style, consistency, and pace. Updates in real-time as you learn.',
  },
  {
    icon: Network,
    title: 'Adaptive Roadmaps',
    desc: 'Personalized learning paths with prerequisite-aware sequencing. Mastery-gated progression ensures you never skip fundamentals.',
  },
  {
    icon: TrendingUp,
    title: 'Drift Monitoring',
    desc: 'Transparent drift detection tracks missed sessions, declining scores, and inactivity. Explains why drift was detected.',
  },
  {
    icon: Shield,
    title: 'Shadow AI Risk Engine',
    desc: 'Educational risk indicators for falling behind, missed milestones, and retention weakness. Not a medical system.',
  },
  {
    icon: Zap,
    title: 'Memory Retention',
    desc: 'Spaced-repetition scheduling with transparent review intervals. Never forget what you learned.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy via-navy-light to-navy text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 sticky top-0 z-50 backdrop-blur-md bg-navy/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-electric flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg">NeuroPath AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-electric hover:bg-electric/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-electric/20 text-electric border-electric/30">
              <Layers className="w-3 h-3 mr-1" /> Self-Evolving Multi-Agent System
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-6 text-balance">
              Adaptive Learning That{' '}
              <span className="text-electric">Evolves</span> With You
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl leading-relaxed">
              NeuroPath AI is a personalized education platform powered by nine
              intelligent agents. It understands you, profiles your learning style,
              detects skill gaps, models your cognition, and continuously adapts
              your learning path.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-electric hover:bg-electric/90 text-base">
                  Start Learning <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-white border-white/30 bg-transparent hover:bg-white/10 text-base">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/50">
              By MirrorMind — Team Zero2one
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Nine Agents. Four Layers. One Adaptive Loop.
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A four-layer architecture that perceives, understands, executes, and adapts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="bg-white/5 border-white/10 text-white">
                <CardContent className="pt-6">
                  <feature.icon className="w-8 h-8 text-electric mb-4" />
                  <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Four-Layer Architecture</h2>
            <p className="text-white/60">Agents communicate through structured shared state.</p>
          </div>
          <div className="space-y-4">
            {AGENTS.map((layer, idx) => (
              <div
                key={layer.layer}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 sm:w-64 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-electric/20 text-electric flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-display font-semibold">{layer.layer}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layer.agents.map((agent) => (
                    <Badge key={agent} variant="outline" className="text-white border-white/20 bg-white/5">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-4xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-white/60 mb-8">
            Join NeuroPath AI and experience a learning platform that adapts to you.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-electric hover:bg-electric/90 text-base">
              Create Your Account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-white/40">
          NeuroPath AI — A Self-Evolving Multi-Agent Adaptive Learning System | MirrorMind, Team Zero2one
        </div>
      </footer>
    </div>
  );
}

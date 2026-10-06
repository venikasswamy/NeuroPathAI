# NeuroPath AI

**A Self-Evolving Multi-Agent Adaptive Learning System for Personalized Education**

*By MirrorMind — Team Zero2one*

---

## What is NeuroPath AI?

NeuroPath AI is an adaptive personalized learning platform that uses nine intelligent agents to understand a learner, create a digital learner model, identify skill gaps, generate personalized roadmaps, monitor learning behavior, evaluate assessments, predict educational risks, and continuously adapt the learning path.

The system is built on a four-layer architecture where agents communicate through structured shared state, creating a self-evolving learning experience that adapts based on real learner data.

## Tech Stack

- **Frontend:** Next.js 13, React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Next.js API routes / client-side services, TypeScript
- **Database:** Supabase PostgreSQL with Row Level Security
- **Authentication:** Supabase Auth (email/password)
- **AI:** Centralized AI adapter with deterministic fallback (no paid API required)

## Architecture

### Four-Layer Agent Architecture

```
LAYER 1 — PERCEPTION
  1. Intake Agent         — validates & normalizes onboarding data
  2. Style Profiler       — determines learning style preferences
  3. Gap Detector         — identifies mastered/developing/weak/missing skills

LAYER 2 — COGNITIVE INTELLIGENCE
  4. Cognitive Twin Engine — digital learner model

LAYER 3 — EXECUTION
  5. Adaptive Planner     — generates & adapts personalized roadmaps
  6. Resource Curator     — recommends learning resources
  7. Drift Monitor        — detects learning behavior changes

LAYER 4 — ADAPTIVE INTELLIGENCE
  8. Shadow AI            — educational risk indicator (NOT medical)
  9. Memory Retention Agent — spaced-repetition scheduling

Feedback Engine (subsystem, NOT a tenth agent) — operates across all layers
```

### The Adaptive Loop

```
UNDERSTAND → PROFILE → IDENTIFY GAPS → MODEL LEARNER → CREATE ROADMAP
→ LEARN → ASSESS → MONITOR → COLLECT FEEDBACK → PREDICT → ADAPT → REVISE → LEARN AGAIN
```

## Folder Structure

```
app/
  (app)/                    — Authenticated route group (sidebar + topbar)
    dashboard/              — Main dashboard with real data
    roadmap/                — Visual learning roadmap
    learning/               — Learning sessions
    assessments/            — Take assessments, view results
    skills/                 — Skill proficiency tracking
    cognitive-twin/         — Digital learner model visualization
    resources/              — Resource recommendations
    retention/              — Spaced-repetition reviews
    insights/               — AI-generated insights
    notifications/          — Notification center
    profile/                — Learner profile management
    settings/               — App settings
  login/                    — Sign in
  register/                 — Sign up
  onboarding/               — Multi-step onboarding wizard
  layout.tsx                — Root layout with providers
  page.tsx                  — Landing page

agents/                     — Nine official agents
  intakeAgent.ts
  styleProfiler.ts
  gapDetector.ts
  cognitiveTwin.ts
  adaptivePlanner.ts
  resourceCurator.ts
  driftMonitor.ts
  shadowAI.ts
  memoryRetention.ts

services/                   — Business logic services
  aiAdapter.ts              — Centralized AI (deterministic + optional LLM)
  feedbackEngine.ts         — Feedback subsystem
  roadmapService.ts         — Full pipeline orchestration
  assessmentService.ts      — Assessment scoring & mastery
  adaptiveDemo.ts           — Adaptive demonstration runner

lib/
  supabase/                 — Supabase client (client + server)
  database/                 — Typed database queries
  orchestrator.ts           — Agent pipeline state management
  utils.ts                  — Shared utilities

types/
  index.ts                  — All TypeScript types

components/
  layout/                   — App shell (sidebar, topbar)
  providers/                — Auth, theme, route guard
  shared/                   — Page utilities (headers, states, badges)
  ui/                       — shadcn/ui component library
```

## Environment Variables

```bash
# Required (pre-populated in Bolt)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (enables LLM-powered features)
# OPENAI_API_KEY=your-key
# OPENAI_MODEL=gpt-4o-mini
```

The app is **fully functional without OPENAI_API_KEY** — all features use deterministic fallback logic.

## Database Setup

The database schema and seed data are applied automatically via Supabase migrations:

1. **Schema:** 23 tables with foreign keys, indexes, constraints, and RLS policies
2. **Seed Data:** 22 skills, prerequisite relationships, 25+ lessons, 30+ assessment questions, 25+ resources

All user-scoped tables use Row Level Security with `auth.uid()` ownership checks.

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Demo Mode

The application runs in **deterministic mode** by default (no AI API key required):

- Roadmap generation uses rule-based prerequisite-aware topological sorting
- Skill-gap analysis uses transparent scoring (0–100 scale)
- Recommendations use structured keyword/tag matching
- Shadow AI uses heuristic risk indicators
- Cognitive Twin is calculated from persisted learner data
- Assessments use seeded question banks
- Retention uses spaced-repetition rules
- Drift detection uses transparent behavioral analysis

## Adaptive Demo

Click **"Run Adaptive Demo"** on the dashboard to see the complete adaptive loop in action:

1. Creates demo learner data (ML Engineer, beginner, 2hrs/day, 4-month deadline)
2. Runs all 9 agents in sequence
3. Simulates a weak assessment result (0%)
4. Marks the topic as NEEDS_REVISION
5. Adds revision practice to the roadmap
6. Delays dependent roadmap items
7. Simulates missed learning sessions
8. Runs Drift Monitor (detects drift)
9. Runs Shadow AI (generates risk prediction)
10. Schedules Memory Retention reviews
11. Stores everything in the database
12. Shows the Agent Execution Trace

All changes are persisted — you can see the adapted roadmap, updated skills, drift status, and risk level across all pages.

## How the Adaptive Loop Works

1. **Onboarding** collects learner info → stored in database
2. **Generate Roadmap** runs all 9 agents through the orchestration pipeline
3. **Learning sessions** track time, completion, confidence, difficulty
4. **Assessments** calculate scores → update skill proficiency → determine mastery
5. **Mastery-gated progression:** items stay locked until prerequisites are mastered
6. **Weak assessment** → topic marked NEEDS_REVISION → revision added → dependents delayed
7. **Drift Monitor** analyzes session patterns and assessment trends
8. **Shadow AI** combines drift, consistency, weak skills, and deadline pressure into risk levels
9. **Memory Retention** schedules spaced reviews based on performance
10. **Feedback** from sessions and resources influences future recommendations

## Deployment

The app is configured for Netlify deployment (see `netlify.toml`).

```bash
npm run build
```

The output is a standard Next.js static/SSR app deployable to Netlify, Vercel, or any Node.js host.

## Security

- API keys never exposed to the browser
- Row Level Security on all tables
- Users can only access their own data (`auth.uid() = user_id`)
- Input validation on all forms
- No fabricated external URLs — all resources are internal

## License

Built by MirrorMind — Team Zero2one.

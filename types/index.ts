// ============================================================================
// NeuroPath AI — Core Type Definitions
// ============================================================================

export type MasteryState = 'NOT_STARTED' | 'IN_PROGRESS' | 'NEEDS_REVISION' | 'MASTERED';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningStyle = 'visual' | 'reading' | 'hands_on' | 'video' | 'project_based' | 'mixed';

export type ResourceType = 'article' | 'video' | 'documentation' | 'course' | 'practice' | 'quiz' | 'project';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type DriftStatus = 'STABLE' | 'WATCH' | 'DRIFTING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type SkillStatus = 'mastered' | 'developing' | 'weak' | 'missing';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export type AgentName =
  | 'intake'
  | 'style_profiler'
  | 'gap_detector'
  | 'cognitive_twin'
  | 'adaptive_planner'
  | 'resource_curator'
  | 'drift_monitor'
  | 'shadow_ai'
  | 'memory_retention';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export type RetentionState = 'new' | 'learning' | 'reviewing' | 'mastered' | 'needs_review';

export type NotificationType =
  | 'assessment_due'
  | 'revision_needed'
  | 'retention_review'
  | 'roadmap_adjustment'
  | 'learning_drift'
  | 'upcoming_milestone'
  | 'recommended_resource';

// ----------------------------------------------------------------------------
// Database row types
// ----------------------------------------------------------------------------

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearnerProfile {
  id: string;
  user_id: string;
  target_career: string;
  target_role: string;
  goal_description: string;
  current_level: ProficiencyLevel;
  hours_per_day: number;
  days_per_week: number;
  target_deadline: string;
  previous_projects: string | null;
  previous_courses: string | null;
  previous_experience: string | null;
  learning_challenges: string[];
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningPreferences {
  id: string;
  user_id: string;
  dominant_style: LearningStyle;
  secondary_style: LearningStyle | null;
  style_confidence: number;
  style_signals: Record<string, string[]>;
  preferred_difficulty: Difficulty;
  session_length_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  difficulty: Difficulty;
  target_proficiency: number;
}

export interface SkillPrerequisite {
  skill_id: string;
  prerequisite_id: string;
}

export interface LearnerSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: number;
  status: SkillStatus;
  evidence: string[];
  last_assessed: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_role: string;
  target_deadline: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string;
  total_phases: number;
  estimated_hours: number;
  status: 'active' | 'archived';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItem {
  id: string;
  roadmap_id: string;
  user_id: string;
  phase: number;
  phase_title: string;
  order_index: number;
  skill_id: string | null;
  title: string;
  description: string;
  item_type: 'lesson' | 'practice' | 'assessment' | 'project' | 'revision';
  mastery_state: MasteryState;
  estimated_minutes: number;
  prerequisites: string[];
  depends_on: string[];
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'delayed';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: string;
  user_id: string;
  roadmap_item_id: string | null;
  topic: string;
  lesson_title: string;
  objectives: string[];
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  completion_percentage: number;
  self_confidence: number | null;
  difficulty_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  skill_id: string;
  title: string;
  description: string;
  objectives: string[];
  content: string;
  estimated_minutes: number;
  difficulty: Difficulty;
  prerequisites: string[];
}

export interface Assessment {
  id: string;
  user_id: string;
  skill_id: string;
  roadmap_item_id: string | null;
  title: string;
  description: string;
  difficulty: Difficulty;
  status: 'pending' | 'in_progress' | 'completed';
  score: number | null;
  max_score: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AssessmentQuestion {
  id: string;
  skill_id: string;
  question_type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: Difficulty;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  answers: Record<string, string>;
  score: number;
  max_score: number;
  mastery_state: MasteryState;
  time_taken_seconds: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  session_id: string | null;
  assessment_id: string | null;
  resource_id: string | null;
  roadmap_item_id: string | null;
  difficulty_rating: number;
  confidence: number;
  satisfaction: number;
  resource_usefulness: number | null;
  comments: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  resource_type: ResourceType;
  url: string | null;
  skill_id: string | null;
  difficulty: Difficulty;
  learning_styles: LearningStyle[];
  tags: string[];
  estimated_minutes: number;
  is_internal: boolean;
  content: string | null;
}

export interface ResourceInteraction {
  id: string;
  user_id: string;
  resource_id: string;
  interaction_type: 'viewed' | 'completed' | 'skipped' | 'bookmarked';
  created_at: string;
}

export interface CognitiveTwin {
  id: string;
  user_id: string;
  knowledge_profile: Record<string, number>;
  skill_profile: Record<string, number>;
  dominant_style: LearningStyle;
  secondary_style: LearningStyle | null;
  consistency_score: number;
  recent_performance: number;
  confidence_score: number;
  weak_areas: string[];
  strengths: string[];
  completed_topics: string[];
  retention_state: Record<string, RetentionState>;
  preferred_resource_types: ResourceType[];
  learning_pace: number;
  pace_label: string;
  retention_status: number;
  updated_at: string;
  created_at: string;
}

export interface DriftRecord {
  id: string;
  user_id: string;
  drift_score: number;
  status: DriftStatus;
  factors: DriftFactor[];
  explanation: string;
  period_days: number;
  created_at: string;
}

export interface DriftFactor {
  factor: string;
  value: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ShadowPrediction {
  id: string;
  user_id: string;
  risk_level: RiskLevel;
  risk_factors: RiskFactor[];
  evidence: string[];
  recommended_intervention: string;
  confidence: number;
  created_at: string;
}

export interface RiskFactor {
  factor: string;
  level: RiskLevel;
  description: string;
}

export interface RetentionRecord {
  id: string;
  user_id: string;
  skill_id: string;
  topic: string;
  last_studied: string | null;
  last_assessed: string | null;
  retention_state: RetentionState;
  next_review: string;
  review_count: number;
  performance: number;
  interval_days: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  agent_name: AgentName;
  status: AgentStatus;
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Agent shared state (LangGraph-like)
// ----------------------------------------------------------------------------

export interface LearnerContext {
  userId: string;
  name: string;
  goal: string;
  targetRole: string;
  currentLevel: ProficiencyLevel;
  hoursPerDay: number;
  daysPerWeek: number;
  targetDeadline: string;
  learningChallenges: string[];
  preferences: LearningPreferences | null;
}

export interface SkillGapResult {
  mastered: SkillGapItem[];
  developing: SkillGapItem[];
  weak: SkillGapItem[];
  missing: SkillGapItem[];
  prerequisiteGaps: PrerequisiteGap[];
  overallScore: number;
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  proficiency: number;
  targetProficiency: number;
  gap: number;
}

export interface PrerequisiteGap {
  skillId: string;
  skillName: string;
  missingPrerequisite: string;
  missingPrerequisiteName: string;
}

export interface AgentSharedState {
  learner: LearnerContext | null;
  goal: string;
  skills: LearnerSkill[];
  skillGaps: SkillGapResult | null;
  learningStyle: LearningPreferences | null;
  cognitiveTwin: CognitiveTwin | null;
  roadmap: Roadmap | null;
  roadmapItems: RoadmapItem[];
  currentTopic: string | null;
  assessmentResult: AssessmentAttempt | null;
  feedback: Feedback[];
  drift: DriftRecord | null;
  shadowRisk: ShadowPrediction | null;
  retention: RetentionRecord[];
  recommendations: Resource[];
  agentRuns: AgentRunTrace[];
}

export interface AgentRunTrace {
  agent: AgentName;
  label: string;
  status: AgentStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  inputSummary: string;
  outputSummary: string;
  error?: string;
}

export interface Insight {
  id: string;
  title: string;
  explanation: string;
  evidence: string[];
  recommendedAction: string;
  category: 'learning' | 'skill' | 'drift' | 'shadow' | 'retention' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
}

export interface RecommendationResult {
  resourceId: string;
  title: string;
  reason: string;
  score: number;
}

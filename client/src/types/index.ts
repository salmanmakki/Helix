export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  token?: string;
}

export interface Skill {
  _id: string;
  name: string;
  masteryScore: number;
  effectiveScore: number;
  lastRevised: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
}

export interface Revision {
  _id: string;
  skill: {
    _id: string;
    name: string;
  } | string;
  date: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recallScore: number;
  notes?: string;
  revisionType?: string;
}

export interface Interview {
  _id: string;
  company: string;
  role: string;
  date: string;
  status: 'passed' | 'failed' | 'pending';
  roundNumber: number;
}

export interface FailureReport {
  _id: string;
  interview?: Interview | string;
  company: string;
  role: string;
  topic: string;
  roundFailed: string;
  primaryReason: string;
  secondaryReason?: string;
  lessonLearned: string;
  date: string;
}

export interface CommunityFailureReport {
  _id: string;
  company: string;
  role: string;
  topic: string;
  roundFailed: string;
  primaryReason: string;
  secondaryReason?: string;
  interviewExperience: string;
  lessonLearned: string;
  date: string;
  createdAt?: string;
}

export interface ReadinessData {
  overallScore: number;
  threatLevel: 'low' | 'medium' | 'critical';
  recommendations: string[];
}

export interface ActionTask {
  _id: string;
  text: string;
  duration: string;
  difficulty: 'EASY' | 'MED' | 'HARD';
  completed: boolean;
  order: number;
}

export interface ActionPlan {
  _id: string;
  tasks: ActionTask[];
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  _id: string;
  efficiencyRate: number;
  failureRate: number;
  decayRate: number;
  readinessScore: number;
  riskScore: number;
  streak: number;
  confidenceScore: number;
  confidenceLevel: string;
  timestamp: string;
}

export interface RiskScanResult {
  threatLevel: 'low' | 'medium' | 'critical';
  readinessScore: number;
  criticalRisks: Array<{
    id: string;
    name: string;
    score: number;
    mastery: number;
    lastRevised: string;
    status: string;
    diagnostics: string[];
  }>;
  allModules: Array<{
    module: string;
    riskScore: number;
    lastRevision: string;
    status: string;
  }>;
  recentFailuresCount: number;
  cognitiveLoad: number;
  probabilityOfFailure: number;
  pofDescription: string;
  recommendations: string[];
}

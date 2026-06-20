const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = 'gemini-2.5-flash';
    this.genAI = null;
    this.model = null;

    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }
  }

  isAvailable() {
    return !!this.apiKey && !!this.model;
  }

  async generateContent(prompt) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async generateInsights(userContext) {
    const prompt = `You are an intelligence analyst for HELIX, a technical interview preparation platform. Your job is to analyze raw candidate data and produce structured intelligence briefs. Every insight must follow this format:

**Observation:**
One clear sentence identifying what the data reveals.

**Evidence:**
Specific data points, numbers, and facts that support the observation. Reference actual scores, counts, and skill names.

**Impact:**
What this means for the candidate's interview readiness and outcomes. Explain the consequence, not just the fact.

**Recommendation:**
A concrete, actionable next step the candidate should take. Be specific about what to study, how many sessions, and which topics.

## User Context
- Skills: ${JSON.stringify(userContext.skills || [])}
- Recent Failures: ${JSON.stringify(userContext.recentFailures || [])}
- Readiness Score: ${userContext.readinessScore ?? 'N/A'}
- Threat Level: ${userContext.threatLevel ?? 'N/A'}
- Revision Count: ${userContext.revisionCount ?? 0}
- Average Recall: ${userContext.avgRecall ?? 'N/A'}%

## Instructions
Generate 3-5 intelligence briefs, each with Observation, Evidence, Impact, and Recommendation. Cover:
- What the candidate is doing well and should maintain
- Their biggest weakness or risk
- Specific skills or topics to prioritize
- Revision habits that need adjustment
- Any company-specific patterns

Do not display raw numbers without interpretation. Every data point must be explained in terms of what it means for the candidate. Be direct, personal, and specific.`;

    return this.generateContent(prompt);
  }

  async analyzeFailureText(text) {
    const prompt = `You are an intelligence analyst for HELIX, a technical interview preparation platform. Analyze the following interview failure description and produce a structured intelligence brief.

Every insight must follow this format:

**Observation:**
One clear sentence identifying the root cause.

**Evidence:**
Specific details from the description that support the observation.

**Impact:**
What this failure means for the candidate's preparation trajectory.

**Recommendation:**
Concrete steps to address this specific weakness.

---
${text}
---

Generate 2-3 intelligence briefs covering: the primary reason category, underlying skill gaps, and revision strategy. Be direct and specific.`;

    return this.generateContent(prompt);
  }

  async generateSuggestedTasks(skillsWithDecay) {
    const prompt = `You are a study planner for HELIX. Based on the user's skills and their current decay, suggest revision tasks.

## Skills with Decay
${JSON.stringify(skillsWithDecay, null, 2)}

## Instructions
Return ONLY a valid JSON array — no markdown, no code fences. Each object in the array must follow this format:
{
  "topic": "Skill name",
  "reason": "Why this needs revision (e.g., '15% decay, not revised in 8 days')",
  "estimatedSessions": 2,
  "difficulty": "EASY" | "MED" | "HARD",
  "duration": "30 mins" | "45 mins" | "60 mins",
  "suggestedAction": "What specifically to study (e.g., 'Review B-Tree operations and indexing strategies')"
}

Rules:
1. Only include skills where decayScore > 5 (meaningful decay).
2. Sort by decayScore descending — most decayed first.
3. Include ALL skills — do not skip any.
4. estimatedSessions should be 1-3 based on how severe the decay is (decayScore > 20 = 3 sessions, > 10 = 2, otherwise 1).
5. difficulty should match the skill's riskLevel (high risk = HARD, medium = MED, low = EASY).
6. duration: 45 mins for HARD, 30 mins for MED, 20 mins for EASY.
7. suggestedAction must be specific to the skill name, not generic.`;

    return this.generateContent(prompt);
  }

  async generateDrillScenario(skillName, difficulty) {
    const prompt = `You are a technical interview coach for HELIX platform.

Generate a mock interview drill scenario for the skill "${skillName}" at "${difficulty || 'medium'}" difficulty level.

Provide:
1. **Scenario Title** — A concise name
2. **Problem Statement** — The actual question or scenario
3. **Key Concepts to Cover** — 3-5 concepts the candidate should demonstrate
4. **Expected Approach** — High-level solution outline
5. **Common Pitfalls** — Mistakes candidates often make
6. **Follow-up Questions** — 2-3 deeper questions an interviewer might ask

Keep it realistic for a technical interview setting.`;

    return this.generateContent(prompt);
  }

  async explainRisk(riskContext) {
    const prompt = `You are a risk intelligence analyst for HELIX, a technical interview preparation platform. Your job is to synthesize raw data into structured intelligence briefs. Every insight must follow this format:

**Observation:**
One clear sentence identifying a risk factor.

**Evidence:**
Specific data points from the candidate's scores, skills, revisions, and failures.

**Impact:**
What this risk factor means for the candidate's interview outcomes.

**Recommendation:**
A concrete action to mitigate this risk.

## Candidate Data

### Readiness Score
- Overall Score: ${riskContext.readinessScore ?? 'N/A'}/100
- Threat Level: ${riskContext.threatLevel ?? 'N/A'}
- Failure Penalty Applied: ${riskContext.failurePenalty ?? 0} points

### Skill Decay Breakdown
${JSON.stringify(riskContext.skills ?? [], null, 2)}

### Revision History Summary
- Total Sessions: ${riskContext.revisionCount ?? 0}
- Average Recall: ${riskContext.avgRecall ?? 'N/A'}%
- Total Duration: ${riskContext.totalDuration ?? 0} minutes
- Days Since Last Revision: ${riskContext.daysSinceLastRevision ?? 'N/A'}

### Failure Intelligence
- Total Failures Logged: ${riskContext.failureCount ?? 0}
- Failures in Last 30 Days: ${riskContext.recentFailureCount ?? 0}
- Top Failure Topics: ${(riskContext.topFailureTopics ?? []).join(', ') || 'None'}
- Most Common Reasons: ${(riskContext.commonReasons ?? []).join(', ') || 'None'}

## Instructions
Generate 4-6 intelligence briefs covering:
- Overall risk posture and readiness score interpretation
- Skills with the highest decay and their impact
- Revision gaps and how they amplify risk
- Failure patterns and recurring weaknesses
- The single biggest risk factor and how to address it
- Company-specific vulnerabilities if patterns exist

Do not display raw numbers without interpretation. Every data point must be explained in terms of what it means for the candidate. Be direct, personal, and specific.`;

    return this.generateContent(prompt);
  }

  async generateStudyPlan(params) {
    const prompt = `You are a study plan architect for HELIX, a technical interview preparation platform. Your job is to create a personalized, day-by-day study plan based on a candidate's target company, role, available time, and their existing preparation data.

## Candidate Input
- Target Company: ${params.targetCompany}
- Target Role: ${params.targetRole}
- Days Available: ${params.daysAvailable}

## Existing Preparation Data

### Skills (current state)
${JSON.stringify(params.skills ?? [], null, 2)}

### Revision History
- Total Sessions: ${params.revisionCount ?? 0}
- Average Recall: ${params.avgRecall ?? 'N/A'}%
- Total Study Duration: ${params.totalDuration ?? 0} minutes

### Failure Intelligence
- Total Failures: ${params.failureCount ?? 0}
- Recent Failures (30d): ${params.recentFailureCount ?? 0}
- Weak Topics: ${(params.topFailureTopics ?? []).join(', ') || 'None'}
- Common Reasons: ${(params.commonReasons ?? []).join(', ') || 'None'}

## Instructions

Generate a personalized day-by-day study plan for the next ${params.daysAvailable} days. The plan must be realistic, progressive, and tailored to the candidate.

Return ONLY a valid JSON array — no markdown, no code fences, no explanatory text. The array must contain exactly ${params.daysAvailable} objects, one per day, in this format:

{
  "day": 1,
  "phase": "Foundation" | "Core" | "Advanced" | "Revision" | "Mock",
  "focusArea": "Primary topic for the day (e.g., System Design, Dynamic Programming, OS Concepts)",
  "topics": ["Specific topic 1", "Specific topic 2", "Specific topic 3"],
  "estimatedHours": 3,
  "activities": [
    "Specific activity description",
    "Another activity"
  ],
  "prioritySkills": ["skill name that this day addresses"],
  "rationale": "One sentence explaining why this day is structured this way given their data"
}

### Design Rules
1. **Progressive difficulty** — Start with foundational weaknesses, build to advanced topics, include mock days.
2. **Data-driven** — Prioritize topics where the candidate has low effective scores or past failures. Reference their actual skills and failure topics.
3. **Company-specific** — Research what ${params.targetCompany} typically asks for a ${params.targetRole} role. Include relevant topics like LeetCode medium/hard, system design deep dives, domain-specific knowledge, and behavioral prep.
4. **Realistic load** — Each day should have 2-4 hours of focused study. Include variety (theory + practice + review).
5. **Spaced repetition** — Revisit weaker topics on multiple days. Include dedicated review days.
6. **Mock interviews** — Include at least 2 mock interview days with specific focus areas.
7. **Final days** — Reserve the last 1-2 days for light review and confidence building.

If the candidate has logged failures, the plan must explicitly address those weak areas. If they have high-decay skills, include early revision sessions for those topics.`;

    const raw = await this.generateContent(prompt);

    let plan;
    try {
      plan = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          plan = JSON.parse(jsonMatch[0]);
        } catch {
          plan = null;
        }
      } else {
        plan = null;
      }
    }

    if (!Array.isArray(plan)) {
      plan = [];
      for (let d = 1; d <= params.daysAvailable; d++) {
        plan.push({
          day: d,
          phase: d <= Math.ceil(params.daysAvailable * 0.3) ? 'Foundation' : d <= Math.ceil(params.daysAvailable * 0.6) ? 'Core' : d <= Math.ceil(params.daysAvailable * 0.85) ? 'Advanced' : 'Mock',
          focusArea: 'General Preparation',
          topics: ['Review weak areas', 'Practice problems'],
          estimatedHours: 3,
          activities: ['Review past failures and notes', 'Solve practice problems', 'Revise key concepts'],
          prioritySkills: [],
          rationale: 'General preparation day covering core topics.'
        });
      }
    }

    return { plan, targetCompany: params.targetCompany, targetRole: params.targetRole, daysAvailable: params.daysAvailable, generatedAt: new Date().toISOString() };
  }

  async generateDashboardInsights(context) {
    const prompt = `You are a dashboard intelligence engine for HELIX, a technical interview preparation platform. Your job is to analyze a candidate's preparation data and generate four specific intelligence categories.

Return ONLY a valid JSON object — no markdown, no code fences, no explanatory text. Use this exact structure:

{
  "forgottenSkills": [
    {
      "skillName": "Name of skill",
      "decayPercent": 25,
      "originalMastery": 85,
      "currentEffective": 60,
      "daysSinceRevision": 14,
      "urgency": "high" | "medium" | "low",
      "observation": "One sentence about what the data reveals about this skill.",
      "evidence": "Specific numbers supporting the observation (e.g., 'Mastery dropped from 85% to 60%, last revised 14 days ago').",
      "impact": "What this decay means for interview readiness.",
      "recommendation": "Concrete action to address this decay."
    }
  ],
  "highRiskTopics": [
    {
      "topic": "Topic name",
      "failureCount": 3,
      "commonReason": "Most common failure reason",
      "companies": ["Company A", "Company B"],
      "riskLevel": "high" | "medium" | "low",
      "observation": "One sentence about why this topic is risky.",
      "evidence": "Specific failure data supporting the risk assessment.",
      "impact": "What this risk means for the candidate's outcomes.",
      "recommendation": "Concrete action to reduce this risk."
    }
  ],
  "revisionReminders": [
    {
      "skillName": "Skill name",
      "daysSinceLastRevision": 10,
      "recallTrend": "declining" | "stable" | "improving",
      "observation": "One sentence about the revision gap.",
      "evidence": "How long since revision and recall trend data.",
      "impact": "What happens if this skill is not revised soon.",
      "recommendation": "Concrete reminder about what to revise.",
      "priority": "high" | "medium" | "low"
    }
  ],
  "companySpecificWarnings": [
    {
      "company": "Company name",
      "failureCount": 2,
      "commonTopics": ["Topic1", "Topic2"],
      "commonRounds": ["Round1"],
      "observation": "One sentence about the pattern at this company.",
      "evidence": "Specific failure history supporting the warning.",
      "impact": "What this means for upcoming interviews at this company.",
      "recommendation": "Concrete preparation advice for this company.",
      "severity": "high" | "medium" | "low"
    }
  ]
}

## Candidate Data

### Skills
${JSON.stringify(context.skills ?? [], null, 2)}

### Revision History
- Total Sessions: ${context.revisionCount ?? 0}
- Last Revision Date: ${context.lastRevisionDate ?? 'N/A'}
- Average Recall: ${context.avgRecall ?? 'N/A'}%
- Sessions by Skill: ${JSON.stringify(context.revisionCountsBySkill ?? {}, null, 2)}

### Failure Reports
${JSON.stringify(context.failures ?? [], null, 2)}

### Readiness
- Score: ${context.readinessScore ?? 'N/A'}/100
- Threat Level: ${context.threatLevel ?? 'N/A'}

## Generation Rules

1. **forgottenSkills** — Identify skills where effectiveScore < masteryScore by more than 10 points OR daysSinceRevision > 7. Max 5 entries, sorted by urgency descending.
2. **highRiskTopics** — Group failures by topic. A topic is high risk if failed 2+ times or associated with high-urgency forgotten skills. Max 5 entries.
3. **revisionReminders** — For each skill that hasn't been revised in 7+ days, generate a reminder. Max 5 entries.
4. **companySpecificWarnings** — Group failures by company. If a company has 2+ failures, generate a warning. Max 5 entries.

If no data exists for a category, return an empty array for that field. Do not display raw numbers without interpretation — explain what the data means for the candidate.`;

    const raw = await this.generateContent(prompt);

    let insights;
    try {
      insights = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          insights = JSON.parse(jsonMatch[0]);
        } catch {
          insights = null;
        }
      } else {
        insights = null;
      }
    }

    if (!insights || typeof insights !== 'object') {
      insights = {
        forgottenSkills: [],
        highRiskTopics: [],
        revisionReminders: [],
        companySpecificWarnings: []
      };
    }

    return {
      ...insights,
      forgottenSkills: insights.forgottenSkills || [],
      highRiskTopics: insights.highRiskTopics || [],
      revisionReminders: insights.revisionReminders || [],
      companySpecificWarnings: insights.companySpecificWarnings || [],
      generatedAt: new Date().toISOString()
    };
  }

  async analyzeCommunityFailures(communityFailures) {
    const prompt = `You are a community intelligence analyst for HELIX, a technical interview preparation platform. Your job is to analyze anonymous community failure reports and produce structured intelligence briefs about where candidates are struggling most.

Every insight must follow this format:

**Observation:**
One clear sentence identifying a community-wide pattern.

**Evidence:**
Specific numbers from the data — frequencies, percentages, and examples from actual reports. Do not list raw counts without interpreting them.

**Impact:**
What this pattern means for candidates preparing for interviews.

**Recommendation:**
What candidates should do based on this intelligence.

## Community Failure Data (${communityFailures.length} reports)
${JSON.stringify(communityFailures, null, 2)}

## Instructions
Generate 4-6 intelligence briefs covering:
- The technical topics where candidates fail most frequently
- The most common reasons cited for failure
- Companies with notable failure patterns
- Role-specific vulnerabilities
- Interview rounds with the highest failure rates
- Key takeaways for the community

Do not display raw numbers without interpretation. Every data point must be explained in terms of what it means for candidates. Be specific, reference actual topics and companies, and make every recommendation actionable.`;

    return this.generateContent(prompt);
  }

  async analyzeMyFailures(myFailures) {
    const prompt = `You are a personal intelligence analyst for HELIX, a technical interview preparation platform. Your job is to analyze a user's documented failure reports alongside their skill data, revision history, and risk scores to produce personalized intelligence briefs.

Every insight must follow this format:

**Observation:**
One clear sentence identifying a personal weakness or pattern.

**Evidence:**
Specific data points from the user's history — failure topics, frequencies, skill decay, revision gaps, and risk scores.

**Impact:**
What this pattern means for the user's interview outcomes and readiness.

**Recommendation:**
A concrete, personalized next step the user should take.

## User's Failure Data (${myFailures.length} reports)
${JSON.stringify(myFailures, null, 2)}

## User's Skills
${JSON.stringify(myFailures.skills || [], null, 2)}

## Revision History
- Total Sessions: ${myFailures.revisionCount || 0}
- Average Recall: ${myFailures.avgRecall || 'N/A'}%

## Risk Profile
- Readiness Score: ${myFailures.readinessScore || 'N/A'}/100
- Threat Level: ${myFailures.threatLevel || 'N/A'}

## Instructions
Generate 4-6 intelligence briefs covering:
- The user's most frequent failure topics and what they reveal
- Recurring reasons for failure — are they repeating mistakes?
- Company-specific patterns in their failure history
- Interview rounds where they are most vulnerable
- Skill gaps identified from combined failure and skill data
- Recommended focus areas with specific study targets

Do not display raw numbers without interpretation. Every data point must be explained in terms of what it means for the user. Be direct, personal, and specific. Use the user's actual data — reference real topics, companies, and scores.`;

    return this.generateContent(prompt);
  }

  async chat(query, userContext) {
    const prompt = `You are HELIX AI, a preparation intelligence assistant for technical interview candidates. You have access to the following context about the user:

- Skills: ${JSON.stringify(userContext.skills || [])}
- Readiness Score: ${userContext.readinessScore ?? 'N/A'}
- Recent Activity: ${userContext.recentActivity || 'No recent activity'}

User Question: ${query}

Provide a helpful, concise response tailored to the user's preparation journey. If they ask about specific topics, provide technical guidance. If they ask about their progress, reference their data.`;

    return this.generateContent(prompt);
  }
}

module.exports = new GeminiService();

const geminiService = require('./gemini.service');
const FailureReport = require('../../models/FailureReport');
const Skill = require('../../models/Skill');
const CustomError = require('../../utils/CustomError');

class FailureAnalyzerService {
  async analyzeAndStore(userId, interviewNotes, options = {}) {
    if (!geminiService.isAvailable()) {
      throw new CustomError('Gemini AI is not configured. Set GEMINI_API_KEY environment variable.', 503);
    }

    const existingSkills = await Skill.find({ user: userId }).lean();
    const skillNames = existingSkills.map(s => s.name);

    const prompt = `You are a structured data extraction engine for HELIX, a technical interview preparation platform.

Extract failure report data from the following interview notes. Return ONLY a valid JSON object with no markdown formatting, no code blocks, and no explanatory text.

## Interview Notes
"""
${interviewNotes}
"""

## Instructions
Parse the notes and extract these fields. Every field must be populated — infer from context if not explicitly stated:

1. "company" — The company name where the interview took place. If unknown, use "Unknown Company".
2. "role" — The job role the candidate applied for. If unknown, use "Unknown Role".
3. "topic" — The specific technical concept or topic the candidate failed on (e.g., "System Design", "Dynamic Programming", "B-Trees", "OS Concepts"). Be specific.
4. "roundFailed" — Which interview round this was (e.g., "Phone Screen", "Technical Round 1", "On-site", "HR Round"). If unknown, use "Technical Round".
5. "primaryReason" — The main reason for failure. A concise but detailed description (1-2 sentences).
6. "secondaryReason" — A secondary contributing factor, if any. If none, leave as empty string "".
7. "lessonLearned" — What the candidate learned from this experience (2-3 sentences). If not explicitly stated, infer a reasonable lesson.

Use the candidate's own words and context from the notes. Do not fabricate specifics — rely on the provided text.

${skillNames.length > 0 ? `The candidate has these existing skills on record: ${skillNames.join(', ')}. If the topic matches one of these, use that name.` : ''}

## Response Format
{"company":"...","role":"...","topic":"...","roundFailed":"...","primaryReason":"...","secondaryReason":"...","lessonLearned":"..."}`;

    const raw = await geminiService.generateContent(prompt);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          throw new CustomError('Failed to parse AI response into structured data', 500);
        }
      } else {
        throw new CustomError('AI response did not contain valid JSON', 500);
      }
    }

    const required = ['company', 'role', 'topic', 'roundFailed', 'primaryReason', 'lessonLearned'];
    for (const field of required) {
      if (!parsed[field] || !parsed[field].toString().trim()) {
        parsed[field] = this.inferDefault(field);
      }
    }

    const failureReport = await FailureReport.create({
      user: userId,
      company: parsed.company.trim(),
      role: parsed.role.trim(),
      topic: parsed.topic.trim(),
      roundFailed: parsed.roundFailed.trim(),
      failedRound: parsed.roundFailed.trim(),
      primaryReason: parsed.primaryReason.trim(),
      secondaryReason: (parsed.secondaryReason || '').trim(),
      lessonLearned: parsed.lessonLearned.trim(),
      date: options.date || new Date(),
      interview: options.interviewId || undefined,
      interviewId: options.interviewId || undefined
    });

    return {
      report: failureReport.toObject(),
      rawExtraction: parsed
    };
  }

  inferDefault(field) {
    const defaults = {
      company: 'Unknown Company',
      role: 'Unknown Role',
      topic: 'General Technical',
      roundFailed: 'Technical Round',
      primaryReason: 'Insufficient preparation on the topic',
      lessonLearned: 'Further study and practice on this topic is needed.'
    };
    return defaults[field] || 'Not specified';
  }
}

module.exports = new FailureAnalyzerService();

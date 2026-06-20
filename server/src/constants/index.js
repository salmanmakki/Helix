const REVISION_TYPES = [
  'LeetCode',
  'MockInterview',
  'Quiz',
  'ProjectWork',
  'DBMSRevision',
  'OSRevision',
  'CNRevision',
  'Reading',
  'Flashcards',
  'CodeReview',
  'NotesReview',
  'VideoLecture',
  'BlogPost',
  'Cheatsheet',
  'Whiteboarding',
  'PairProgramming'
];

const FAILURE_REASONS = [
  'DSA',
  'DBMS',
  'OS',
  'CN',
  'OOP',
  'SQL',
  'Projects',
  'Communication',
  'Behavioral',
  'SystemDesign'
];

const THREAT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  CRITICAL: 'critical'
};

module.exports = {
  REVISION_TYPES,
  FAILURE_REASONS,
  THREAT_LEVELS
};

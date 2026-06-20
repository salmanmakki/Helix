const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const CommunityFailureReport = require('../models/CommunityFailureReport');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fakeFailures = [
  {
    company: 'Google',
    role: 'Software Engineer',
    topic: 'Dynamic Programming',
    roundFailed: 'Round 2: Technical Phone Screen',
    primaryReason: 'Could not optimize the knapsack problem from O(n*W) to O(W) space complexity within the time limit.',
    secondaryReason: 'Panicked when asked to trace through the DP table and explain state transitions.',
    interviewExperience: 'The interviewer was helpful but I froze on the optimization step. I had practiced DP but not enough under time pressure.',
    lessonLearned: 'Focus on space optimization techniques for DP problems. Practice explaining state transitions out loud.'
  },
  {
    company: 'Amazon',
    role: 'SDE II',
    topic: 'System Design',
    roundFailed: 'Round 4: System Design (Virtual)',
    primaryReason: 'Proposed a monolithic architecture for a ride-sharing service instead of microservices. Did not consider data partitioning.',
    secondaryReason: 'Could not estimate QPS or storage requirements on the spot.',
    interviewExperience: 'The interviewer kept pushing me to think about scale but I was not prepared for the depth of design decisions required.',
    lessonLearned: 'Study real-world architectures at scale. Practice back-of-the-envelope calculations until they become second nature.'
  },
  {
    company: 'Meta',
    role: 'Frontend Engineer',
    topic: 'React Performance',
    roundFailed: 'Round 3: Frontend Deep Dive',
    primaryReason: 'Could not explain how React reconciliation works under the hood or identify unnecessary re-renders in the code review.',
    secondaryReason: 'Failed to implement a custom useMemo optimization when asked to fix a laggy component tree.',
    interviewExperience: 'The code review exercise revealed gaps in my understanding of the React fiber architecture and rendering pipeline.',
    lessonLearned: 'Deep dive into React internals — fiber architecture, reconciliation, and profiling tools.'
  },
  {
    company: 'Stripe',
    role: 'Backend Engineer',
    topic: 'API Design',
    roundFailed: 'Round 1: Coding Screen',
    primaryReason: 'Designed REST endpoints that violated idempotency principles for payment processing.',
    secondaryReason: 'Did not handle concurrency edge cases for double-charge prevention.',
    interviewExperience: 'The problem seemed straightforward but I missed the critical idempotency requirement hidden in the specification.',
    lessonLearned: 'Always look for idempotency, consistency, and concurrency requirements in API design problems.'
  },
  {
    company: 'Microsoft',
    role: 'Senior Software Engineer',
    topic: 'Distributed Systems',
    roundFailed: 'Round 5: System Design (On-site)',
    primaryReason: 'Could not design a consistent distributed key-value store with replication. Chose Paxos but could not explain the protocol flow.',
    secondaryReason: 'Struggled with failure scenarios — network partitions and leader election edge cases.',
    interviewExperience: 'The depth of distributed systems knowledge expected at Senior level was higher than I anticipated.',
    lessonLearned: 'Master consensus algorithms (Raft > Paxos for interviews). Practice failure mode analysis systematically.'
  },
  {
    company: 'Uber',
    role: 'Data Engineer',
    topic: 'Stream Processing',
    roundFailed: 'Round 2: Technical Screen',
    primaryReason: 'Proposed batch processing for a real-time fraud detection pipeline. Did not consider event time vs processing time.',
    secondaryReason: 'Could not implement a sliding window aggregation in the live coding exercise.',
    interviewExperience: 'I had studied batch processing extensively but real-time streaming concepts caught me off guard.',
    lessonLearned: 'Learn stream processing frameworks (Kafka Streams, Flink) and understand exactly-once semantics.'
  },
  {
    company: 'Apple',
    role: 'iOS Engineer',
    topic: 'Swift Concurrency',
    roundFailed: 'Round 3: Coding Challenge',
    primaryReason: 'Used completion handlers instead of async/await for a network request chain, leading to callback hell.',
    secondaryReason: 'Did not handle cancellation properly — the continued processing after the view was deallocated.',
    interviewExperience: 'The interviewer wanted modern Swift concurrency patterns and I was stuck in the old completion handler mindset.',
    lessonLearned: 'Modernize Swift knowledge — master async/await, actors, and structured concurrency.'
  },
  {
    company: 'Netflix',
    role: 'Platform Engineer',
    topic: 'Chaos Engineering',
    roundFailed: 'Round 4: System Design',
    primaryReason: 'Designed a monitoring system that could detect but not automatically mitigate failures. Lack of self-healing architecture.',
    secondaryReason: 'Did not consider how to test chaos experiments in a staging environment without affecting production.',
    interviewExperience: 'Netflix looks for engineers who think about failure as a feature, not a bug. I was too focused on prevention over resilience.',
    lessonLearned: 'Study chaos engineering principles — blast radius, hypothesis-driven experimentation, and automated rollback.'
  },
  {
    company: 'Snowflake',
    role: 'Software Engineer',
    topic: 'Database Internals',
    roundFailed: 'Round 3: Technical Deep Dive',
    primaryReason: 'Could not explain how columnar storage differs from row-based storage for analytical workloads.',
    secondaryReason: 'Failed to design a query optimizer that could push down predicates to the storage layer.',
    interviewExperience: 'I knew the high-level concepts but lacked the low-level implementation details they were probing for.',
    lessonLearned: 'Study database internals deeply — storage formats, indexing strategies, and query optimization techniques.'
  },
  {
    company: 'Datadog',
    role: 'Full Stack Engineer',
    topic: 'Observability',
    roundFailed: 'Round 2: Pair Programming',
    primaryReason: 'Built a logging system that would create massive data volume without sampling or aggregation strategies.',
    secondaryReason: 'Did not consider cardinality explosion when adding high-cardinality tags to metrics.',
    interviewExperience: 'The pair programming session revealed I had never thought about observability at scale before.',
    lessonLearned: 'Understand observability pillars — logging, metrics, and tracing. Study sampling strategies and cardinality management.'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await CommunityFailureReport.deleteMany({});
    console.log('Cleared existing community failures');

    const inserted = await CommunityFailureReport.insertMany(fakeFailures);
    console.log(`Inserted ${inserted.length} fake community failure reports`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();

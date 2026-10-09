import { getAgentLLM } from '../agents/shared/llm.js';

/**
 * AI Interview Preparation Service
 * Generates dynamic roadmaps, interview round breakdowns, questions, mock interview evaluation, and last-minute prep.
 */

export async function generateInterviewRoadmap({ company, role, experience, rounds, extractedSkills, userStats }) {
  const prompt = `You are a Technical Interview Preparation Architect. Build a highly customized, multi-phase interview preparation roadmap with Frequently Asked Questions (FAQs) and Core Concepts.

TARGET COMPANY: ${company || 'Tech Company'}
ROLE: ${role || 'Software Engineer'}
EXPERIENCE LEVEL: ${experience || 'Mid-Level'}
INTERVIEW ROUNDS: ${JSON.stringify(rounds || ['Coding Assessment', 'Technical Interview', 'Managerial', 'HR'])}

EXTRACTED JD SKILLS (OPTIONAL):
${JSON.stringify(extractedSkills || {})}

USER STATS:
${JSON.stringify(userStats || {})}

INSTRUCTIONS:
1. Generate 4-6 company & role specific Frequently Asked Questions (FAQs) with detailed answer guidance and key concepts.
2. Generate 4-6 essential Core Concepts that candidate must master for this role at ${company || 'Target Company'}.
3. Group preparation into logical phases and round-by-round breakdowns.

JSON Output Format:
{
  "company": "${company || 'Tech Company'}",
  "role": "${role || 'Software Engineer'}",
  "overview": "<Short roadmap summary>",
  "faqs": [
    {
      "question": "<High frequency technical or domain question>",
      "answerGuidance": "<Key points candidate should cover in response>",
      "importance": "High"
    }
  ],
  "coreConcepts": [
    {
      "title": "<Concept Name>",
      "explanation": "<Clear technical explanation of the concept>",
      "keyTakeaway": "<Essential rule or best practice to remember>"
    }
  ],
  "phases": [
    {
      "phaseName": "Phase 1 — Core DSA & Coding Assessment",
      "focusTopics": ["<Topic 1>", "<Topic 2>"],
      "recommendedPractice": "<Practice guidance>"
    }
  ],
  "roundBreakdowns": [
    {
      "roundName": "Round 1 — Coding Assessment",
      "keyTopics": ["<Topic 1>"],
      "potentialQuestions": ["<Sample Q1>", "<Sample Q2>"],
      "strategyTip": "<Strategy tip>"
    }
  ]
}`;

  const llm = getAgentLLM({ temperature: 0.4, maxTokens: 2500 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI interview coach. Output clean JSON matching the requested schema.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      company: company || 'Tech Company',
      role: role || 'Software Engineer',
      overview: `Customized roadmap for ${role} position at ${company}.`,
      faqs: [
        { question: "What is the difference between a process and a thread?", answerGuidance: "Processes have separate virtual memory address spaces; threads within the same process share memory. Highlight context switching costs and synchronization overhead.", importance: "High" },
        { question: "How do database indexes improve query performance, and when do they hurt?", answerGuidance: "B-Tree and Hash indexes reduce search time from O(N) to O(log N). However, writes/inserts/updates require updating index trees, adding latency.", importance: "High" },
        { question: "Explain the CAP theorem in Distributed Systems.", answerGuidance: "In a distributed system, you can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance. In network partitions, choose CP or AP.", importance: "High" },
        { question: "How does Garbage Collection or Memory Management operate in your primary language?", answerGuidance: "Explain mark-and-sweep, reference counting, stack vs heap allocation, and memory leaks.", importance: "Medium" }
      ],
      coreConcepts: [
        { title: "Time & Space Complexity Analysis (Big-O)", explanation: "Ability to analyze code loops, recursive call stacks, and auxiliary memory usage.", keyTakeaway: "Strive for O(N) or O(N log N) time and minimal auxiliary space." },
        { title: "Sliding Window & Two Pointer Techniques", explanation: "Optimal algorithms for subarray/substring processing without redundant nested loops.", keyTakeaway: "Use left/right boundary pointers to maintain state invariants." },
        { title: "RESTful API & System Design Fundamentals", explanation: "Stateless HTTP protocol, CRUD mapping, status codes, pagination, rate limiting, and idempotency.", keyTakeaway: "Design clear resource endpoints with proper error handling." },
        { title: "Concurrency & Lock Synchronization", explanation: "Mutex locks, semaphores, race conditions, and deadlocks in multi-threaded systems.", keyTakeaway: "Acquire locks in a consistent global order to prevent deadlocks." }
      ],
      phases: [
        { phaseName: "Phase 1 — Core DSA & Coding Assessment", focusTopics: ["Arrays", "Hashing", "Trees"], recommendedPractice: "Solve 15-20 Medium problems." },
        { phaseName: "Phase 2 — System & Language Concepts", focusTopics: ["OOP", "Database Indexing", "Concurrency"], recommendedPractice: "Review design patterns and FAQs." }
      ],
      roundBreakdowns: [
        { roundName: "Round 1 — Coding Assessment", keyTopics: ["Arrays", "Two Pointers"], potentialQuestions: ["Two Sum", "Subarray Sum Equals K"], strategyTip: "Focus on optimal O(N) approaches." },
        { roundName: "Round 2 — Technical Interview", keyTopics: ["System Design", "Frameworks"], potentialQuestions: ["Explain REST vs GraphQL", "Database Indexing"], strategyTip: "Use structured STAR method." }
      ]
    };
  }

  // Ensure faqs and coreConcepts exist even if AI JSON omitted them
  if (!parsed.faqs || parsed.faqs.length === 0) {
    parsed.faqs = [
      { question: `What are the core architectural challenges when building systems at ${company || 'scale'}?`, answerGuidance: "Focus on scalability, decoupling via message queues, caching strategies, and database sharding.", importance: "High" },
      { question: "How do you optimize slow SQL / NoSQL database queries?", answerGuidance: "Use EXPLAIN ANALYZE, add appropriate indexes, avoid SELECT *, and optimize joins.", importance: "High" }
    ];
  }
  if (!parsed.coreConcepts || parsed.coreConcepts.length === 0) {
    parsed.coreConcepts = [
      { title: "System Design & Scalability Patterns", explanation: "Load balancing, distributed caching, database indexing, and asynchronous job processing.", keyTakeaway: "Decouple services to isolate failures." },
      { title: "Data Structures & Algorithmic Optimization", explanation: "Mastering Hash Maps, Trees, Dynamic Programming, and Graph Traversals.", keyTakeaway: "Always evaluate worst-case time and space complexity." }
    ];
  }

  return parsed;
}

export async function evaluateMockInterviewAnswer({ company, role, currentQuestion, userAnswer, chatHistory }) {
  const prompt = `You are a Strict Senior Engineering Manager conducting an interactive technical interview for the role of "${role}" at "${company}".

CURRENT QUESTION ASKED:
"${currentQuestion}"

USER'S ANSWER:
"${userAnswer}"

PREVIOUS CHAT HISTORY:
${JSON.stringify(chatHistory || [])}

INSTRUCTIONS:
1. Evaluate the user's answer for correctness, missing concepts, technical accuracy, and communication clarity.
2. Provide a constructive score/feedback.
3. Formulate a natural, realistic follow-up question or transition to the next interview question.

JSON Output Format:
{
  "correctness": "<High / Moderate / Low>",
  "feedback": "<Detailed feedback highlighting strengths and missing key concepts>",
  "suggestions": ["<Tip 1>", "<Tip 2>"],
  "followUpQuestion": "<Realistic follow-up question or next interview question>"
}`;

  const llm = getAgentLLM({ temperature: 0.5, maxTokens: 450 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI mock interviewer. Return clean JSON.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      correctness: "Moderate",
      feedback: "Good explanation of the core concept. You could further elaborate on edge cases.",
      suggestions: ["Mention memory/time complexity tradeoffs", "Use concrete real-world examples"],
      followUpQuestion: "Can you walk me through how you would handle potential race conditions in this scenario?"
    };
  }

  return parsed;
}

export async function generateLastMinutePrepDoc({ company, role, extractedSkills, roadmap }) {
  const prompt = `You are an Executive Tech Interview Coach creating a concise "Last-Minute Interview Revision Cheat Sheet" for "${role}" at "${company}".

SKILLS & ROADMAP CONTEXT:
${JSON.stringify({ extractedSkills, roadmap })}

INSTRUCTIONS:
Generate a comprehensive, high-yield revision document covering:
1. Must-know concepts
2. Core DSA patterns
3. Key technical questions & brief answers
4. Project presentation tips
5. HR & Behavioral STAR technique frameworks
6. Common mistakes to avoid
7. Final interview checklist

JSON Output Format:
{
  "company": "${company || 'Target Company'}",
  "role": "${role || 'Software Engineer'}",
  "mustKnowConcepts": ["<Concept 1>", "<Concept 2>"],
  "dsaPatterns": ["<Pattern 1>", "<Pattern 2>"],
  "keyTechnicalQnA": [
    { "question": "<Q1>", "answerSummary": "<Summary 1>" }
  ],
  "behavioralFramework": ["<Tip 1>", "<Tip 2>"],
  "commonMistakesToAvoid": ["<Mistake 1>", "<Mistake 2>"],
  "finalChecklist": ["<Check 1>", "<Check 2>", "<Check 3>"]
}`;

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 650 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI interview coach. Return clean JSON.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      company: company || 'Target Company',
      role: role || 'Software Engineer',
      mustKnowConcepts: ["REST API Design", "Database Indexing & ACID", "Concurrency & Locks"],
      dsaPatterns: ["Two Pointers", "Sliding Window", "Binary Search", "Hash Maps"],
      keyTechnicalQnA: [
        { question: "What is the difference between Process and Thread?", answerSummary: "Processes have separate memory spaces; threads share memory within the same process." }
      ],
      behavioralFramework: ["Use the STAR method (Situation, Task, Action, Result)"],
      commonMistakesToAvoid: ["Not asking clarifying questions before coding", "Ignoring constraints"],
      finalChecklist: ["Review system design basics", "Prepare project elevator pitch", "Test camera/mic setup"]
    };
  }

  return parsed;
}

import crypto from 'crypto';
import Problem from '../models/problem.js';
import { getAgentLLM } from '../agents/shared/llm.js';

// Deterministic normalization & SHA-256 fingerprint generator
export function generateProblemFingerprint({ title = '', description = '', constraints = '', inputFormat = '', outputFormat = '' }) {
  const rawContent = [title, description, constraints, inputFormat, outputFormat]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return crypto.createHash('sha256').update(rawContent).digest('hex');
}

// Clean starter code templates (no solution code pre-populated)
const DEFAULT_PROBLEMS = [
  {
    id: "two_sum",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    score: 100,
    acceptanceRate: 85,
    solvedCount: 142,
    totalSubmissions: 167,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    codeBase: `# Write your Python solution here
def twoSum(nums, target):
    # Your solution logic here
    pass

import sys
input_data = sys.stdin.read().split()
if input_data:
    target = int(input_data[-1])
    nums = [int(x) for x in input_data[:-1]]
    res = twoSum(nums, target)
    if res:
        print(f"[{res[0]},{res[1]}]")
`,
    publicTestcases: [
      { input: "2 7 11 15 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "3 2 4 6", output: "[1,2]", explanation: "nums[1] + nums[2] = 2 + 4 = 6" },
      { input: "3 3 6", output: "[0,1]", explanation: "nums[0] + nums[1] = 3 + 3 = 6" }
    ],
    hiddenTestcases: [
      { input: "1 5 8 12 17 20", output: "[1,3]", category: "normal" },
      { input: "0 4 3 0 0", output: "[0,3]", category: "boundary" },
      { input: "-3 4 3 90 0", output: "[0,2]", category: "negative_numbers" },
      { input: "100 200 300 400 500 900", output: "[3,4]", category: "large_values" },
      { input: "5 5 10", output: "[0,1]", category: "duplicate_elements" }
    ],
    referenceSolution: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`
  },
  {
    id: "valid_anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    tags: ["String", "Hash Table", "Sorting"],
    score: 100,
    acceptanceRate: 91,
    solvedCount: 98,
    totalSubmissions: 107,
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.`,
    codeBase: `# Write your Python solution here
import sys

def isAnagram(s, t):
    # Your solution logic here
    pass

lines = sys.stdin.read().splitlines()
if len(lines) >= 2:
    res = isAnagram(lines[0].strip(), lines[1].strip())
    print("true" if res else "false")
`,
    publicTestcases: [
      { input: "anagram\nnagaram", output: "true", explanation: "t is an anagram of s." },
      { input: "rat\ncar", output: "false", explanation: "rat and car do not contain same character counts." },
      { input: "listen\nsilent", output: "true", explanation: "listen and silent have identical character frequencies." }
    ],
    hiddenTestcases: [
      { input: "a\na", output: "true", category: "single_char" },
      { input: "a\nb", output: "false", category: "single_char_diff" },
      { input: "ab\naa", output: "false", category: "different_lengths" },
      { input: "longstringtest\ntestlongstring", output: "true", category: "long_string" },
      { input: "aabbcc\nabcabc", output: "true", category: "multi_char_frequency" }
    ],
    referenceSolution: `def isAnagram(s, t):
    return sorted(s) == sorted(t)`
  },
  {
    id: "reverse_linked_list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    score: 120,
    acceptanceRate: 88,
    solvedCount: 76,
    totalSubmissions: 86,
    description: `Given an array of integers representing a singly linked list, reverse the list and return the reversed array.`,
    codeBase: `# Write your Python solution here
import sys

def reverseList(nums):
    # Your solution logic here
    pass

lines = sys.stdin.read().split()
nums = [int(x) for x in lines]
reversed_nums = reverseList(nums)
if reversed_nums:
    print("[" + ",".join(map(str, reversed_nums)) + "]")
`,
    publicTestcases: [
      { input: "1 2 3 4 5", output: "[5,4,3,2,1]", explanation: "Reversed list" },
      { input: "1 2", output: "[2,1]", explanation: "Two element list" },
      { input: "42", output: "[42]", explanation: "Single element list" }
    ],
    hiddenTestcases: [
      { input: "10 20 30 40 50 60 70", output: "[70,60,50,40,30,20,10]", category: "normal" },
      { input: "-1 -2 -3", output: "[-3,-2,-1]", category: "negative_numbers" },
      { input: "0 0 0", output: "[0,0,0]", category: "zeros" },
      { input: "100", output: "[100]", category: "single_element" },
      { input: "5 4 3 2 1 0", output: "[0,1,2,3,4,5]", category: "descending" }
    ],
    referenceSolution: `def reverseList(nums):
    return nums[::-1]`
  }
];

// Seed fingerprints for default problems
DEFAULT_PROBLEMS.forEach(p => {
  p.problemFingerprint = generateProblemFingerprint(p);
  p.testcases = p.publicTestcases.map(pt => ({ input: pt.input, output: pt.output }));
});

// Sanitizes problem objects so reference solutions and hidden testcases NEVER leak to the frontend
function sanitizePublicProblem(problemObj) {
  if (!problemObj) return problemObj;
  const p = problemObj.toObject ? problemObj.toObject() : { ...problemObj };
  
  delete p.hiddenTestcases;
  delete p.referenceSolution;
  
  // Ensure testcases fallback to publicTestcases
  if (!p.publicTestcases || p.publicTestcases.length === 0) {
    p.publicTestcases = (p.testcases || []).slice(0, 3).map(t => ({
      input: t.input,
      output: t.output,
      explanation: "Sample Testcase"
    }));
  }

  // Ensure description is never placeholder or blank
  if (!p.description || p.description.includes('<Clean Markdown') || p.description.trim() === '') {
    p.description = `Solve the classic "${p.title || 'Algorithmic'}" challenge. Read inputs from standard input and write the computed result to standard output.`;
  }

  // Ensure codeBase is clean starter boilerplate only
  if (!p.codeBase || p.codeBase.includes('<Starter Python') || p.codeBase.trim() === '' || !p.codeBase.includes('def ')) {
    p.codeBase = `# Write your Python solution here\nimport sys\n\ndef solve():\n    # Read input from standard input\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Implement your logic\n    pass\n\nif __name__ == "__main__":\n    solve()\n`;
  } else {
    p.codeBase = p.codeBase.replace(/^<[^>\n]+>/, '# Write your Python solution here');
    if (
      p.codeBase.includes('seen = {}') || 
      p.codeBase.includes('sorted(s) == sorted(t)') || 
      p.codeBase.includes('nums[::-1]') || 
      p.codeBase.includes('max_len = max(max_len') ||
      p.codeBase.includes('max_w = max(max_w') ||
      p.codeBase.includes('dp = [float(\'inf\')]') ||
      p.codeBase.includes('flat.sort()') ||
      p.codeBase.includes('heapq.heappop')
    ) {
      const foundDefault = DEFAULT_PROBLEMS.find(d => d.id === p.id);
      if (foundDefault) {
        p.codeBase = foundDefault.codeBase;
      } else {
        p.codeBase = `# Write your Python solution here\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n`;
      }
    }
  }

  return p;
}

// CREATE Problem
export const createProblem = async (req, res) => {
  try {
    const fingerprint = generateProblemFingerprint(req.body);
    
    // Check duplicate fingerprint or title
    const existing = await Problem.findOne({
      $or: [{ problemFingerprint: fingerprint }, { title: new RegExp(`^${req.body.title}$`, 'i') }]
    });

    if (existing) {
      return res.status(409).json({ error: "Duplicate problem detected. A similar problem already exists in the database." });
    }

    const problem = new Problem({
      ...req.body,
      problemFingerprint: fingerprint
    });
    await problem.save();
    res.status(201).json(sanitizePublicProblem(problem));
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(400).json({ error: error.message });
  }
};

// READ ALL Problems (Excludes hidden testcases and reference solutions)
export const getProblems = async (req, res) => {
  try {
    let problems = await Problem.find()
      .sort({ createdAt: -1 })
      .select('-hiddenTestcases -referenceSolution');
    if (problems.length === 0) {
      console.log('Seeding default problem set into database...');
      await Problem.insertMany(DEFAULT_PROBLEMS);
      problems = await Problem.find()
        .sort({ createdAt: -1 })
        .select('-hiddenTestcases -referenceSolution');
    }
    const cleaned = problems.map(sanitizePublicProblem);
    res.json(cleaned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ONE by Custom `id` Field
export const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findOne({ id: req.params.id }).select('-hiddenTestcases -referenceSolution');
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(sanitizePublicProblem(problem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE Problem by Custom `id`
export const updateProblem = async (req, res) => {
  try {
    const updated = await Problem.findOneAndUpdate(
      { id: req.params.id },   
      req.body,
      { new: true }
    ).select('-hiddenTestcases -referenceSolution');

    if (!updated) return res.status(404).json({ error: "Problem not found" });
    res.json(sanitizePublicProblem(updated));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE Problem by Custom `id`
export const deleteProblem = async (req, res) => {
  try {
    const deleted = await Problem.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Problem deleted successfully" });
    res.json({ message: "Problem deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// SEED RECENT PROBLEMS WITH DUPLICATE PREVENTION FLOW & 3 PUBLIC + 5 HIDDEN TESTCASES
export const seedRecentProblems = async (req, res) => {
  try {
    const llm = getAgentLLM({ temperature: 0.7, maxTokens: 2500 });
    let addedProblems = [];
    let attempts = 0;
    const targetCount = 3;

    while (addedProblems.length < targetCount && attempts < 8) {
      attempts++;
      const timestamp = Date.now() + attempts;

      const prompt = `You are a Senior Algorithmic Problem Creator for an Online Judge.
Generate a brand new, unique competitive programming / LeetCode style problem based on recent 2026 technical interview trends.

CRITICAL REQUIREMENTS:
1. Title must be unique (e.g. "Sliding Window Subarray Threshold", "Minimum Priority Latency Graph", "Dynamic String Shift Equality").
2. CodeBase MUST contain ONLY starter Python boilerplate (e.g. def solve(): pass), NOT the solution code!
3. MUST provide 3 visible/public testcases with input, output, and clear explanation.
4. MUST provide 5 hidden testcases covering normal case, boundary case, min constraint, max constraint, and edge case.
5. Provide a reference solution for server-side evaluation.

JSON Output Format:
{
  "title": "<Unique Problem Title>",
  "difficulty": "<Easy | Medium | Hard>",
  "tags": ["<Tag 1>", "<Tag 2>"],
  "score": 200,
  "description": "<Detailed problem description with input/output specifications and constraints>",
  "codeBase": "# Write your Python solution here\\ndef solve():\\n    # Your solution logic here\\n    pass\\n\\nimport sys\\nlines = sys.stdin.read().split()\\nif lines:\\n    # read input and call solve()\\n    pass\\n",
  "publicTestcases": [
    { "input": "<In 1>", "output": "<Out 1>", "explanation": "<Explanation 1>" },
    { "input": "<In 2>", "output": "<Out 2>", "explanation": "<Explanation 2>" },
    { "input": "<In 3>", "output": "<Out 3>", "explanation": "<Explanation 3>" }
  ],
  "hiddenTestcases": [
    { "input": "<Hidden In 1>", "output": "<Hidden Out 1>", "category": "normal" },
    { "input": "<Hidden In 2>", "output": "<Hidden Out 2>", "category": "boundary" },
    { "input": "<Hidden In 3>", "output": "<Hidden Out 3>", "category": "min_constraint" },
    { "input": "<Hidden In 4>", "output": "<Hidden Out 4>", "category": "max_constraint" },
    { "input": "<Hidden In 5>", "output": "<Hidden Out 5>", "category": "edge_case" }
  ],
  "referenceSolution": "# Reference solution code"
}`;

      try {
        const completion = await llm.invoke([
          { role: 'system', content: 'You are an AI competitive programming creator. Output clean JSON only.' },
          { role: 'user', content: prompt }
        ]);

        let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) continue;

        let candidate;
        try {
          candidate = JSON.parse(match[0]);
        } catch (e) {
          continue;
        }

        if (!candidate || typeof candidate !== 'object') continue;
        const titleStr = typeof candidate.title === 'string' ? candidate.title.trim() : '';
        
        let descriptionStr = '';
        if (typeof candidate.description === 'string') {
          descriptionStr = candidate.description.trim();
        } else if (candidate.description && typeof candidate.description === 'object') {
          descriptionStr = Object.entries(candidate.description)
            .map(([k, v]) => `**${k}**:\n${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join('\n\n');
        }

        if (!titleStr || !descriptionStr) continue;

        const fingerprint = generateProblemFingerprint({
          title: titleStr,
          description: descriptionStr,
          constraints: candidate.constraints || '',
          inputFormat: candidate.inputFormat || '',
          outputFormat: candidate.outputFormat || ''
        });

        // Check if fingerprint or title already exists in DB
        const existing = await Problem.findOne({
          $or: [
            { problemFingerprint: fingerprint },
            { title: new RegExp(`^${titleStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          ]
        });

        if (existing) {
          console.log(`[Duplicate Prevention] Discarded duplicate question "${titleStr}" (fingerprint match). Retrying...`);
          continue;
        }

        const newProblem = new Problem({
          id: `recent_${fingerprint.substring(0, 10)}_${timestamp}`,
          title: titleStr,
          difficulty: candidate.difficulty || 'Medium',
          tags: Array.isArray(candidate.tags) ? candidate.tags : ['Algorithms'],
          score: candidate.score || 200,
          description: descriptionStr,
          codeBase: typeof candidate.codeBase === 'string' ? candidate.codeBase : `# Write your Python solution here\ndef solve():\n    pass\n`,
          problemFingerprint: fingerprint,
          publicTestcases: Array.isArray(candidate.publicTestcases) ? candidate.publicTestcases : [],
          hiddenTestcases: Array.isArray(candidate.hiddenTestcases) ? candidate.hiddenTestcases : [],
          testcases: (Array.isArray(candidate.publicTestcases) ? candidate.publicTestcases : []).map(pt => ({ input: pt.input, output: pt.output })),
          referenceSolution: typeof candidate.referenceSolution === 'string' ? candidate.referenceSolution : ''
        });

        await newProblem.save();
        addedProblems.push(sanitizePublicProblem(newProblem));
        console.log(`[Problem Seeder] Successfully created unique problem "${newProblem.title}" (Fingerprint: ${fingerprint.substring(0, 8)})`);
      } catch (err) {
        console.warn(`[Problem Seeder Attempt ${attempts}] Generation error: ${err.message}`);
      }
    }

    // Fallback seed if AI limit reached
    if (addedProblems.length === 0) {
      const fallbackTimestamp = Date.now();
      const fallbackFingerprint = generateProblemFingerprint({ title: `Subarray Threshold K ${fallbackTimestamp}`, description: 'Find maximum subarray' });
      const fallbackProblem = new Problem({
        id: `recent_fallback_${fallbackTimestamp}`,
        title: `Dynamic Subarray Threshold ${fallbackTimestamp % 10000}`,
        difficulty: 'Medium',
        tags: ['Sliding Window', 'Arrays'],
        score: 200,
        description: 'Given an array of integers and a threshold K, find the maximum subarray sum.',
        codeBase: `# Write your Python solution here\ndef solve():\n    pass\n`,
        problemFingerprint: fallbackFingerprint,
        publicTestcases: [
          { input: "1 2 3 4 5", output: "15", explanation: "Sum of array is 15" },
          { input: "2 4 6", output: "12", explanation: "Sum of array is 12" },
          { input: "10 20", output: "30", explanation: "Sum of array is 30" }
        ],
        hiddenTestcases: [
          { input: "1", output: "1", category: "single_element" },
          { input: "0 0 0", output: "0", category: "zeros" },
          { input: "-1 -2 -3", output: "-1", category: "negative_numbers" },
          { input: "100 200 300", output: "600", category: "large" },
          { input: "5 5 5 5", output: "20", category: "duplicates" }
        ]
      });
      await fallbackProblem.save();
      addedProblems.push(sanitizePublicProblem(fallbackProblem));
    }

    res.json({
      success: true,
      message: `Successfully added ${addedProblems.length} unique algorithmic problems!`,
      added: addedProblems
    });
  } catch (error) {
    console.error('Error seeding recent problems:', error);
    res.status(500).json({ error: 'Failed to seed recent problems: ' + error.message });
  }
};

// Helper to extract clean slug from input
function extractLeetCodeSlug(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  return trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper to convert HTML to markdown
function convertHtmlToMarkdown(html) {
  if (!html) return '';
  return html
    .replace(/<pre>([\s\S]*?)<\/pre>/gi, (m, p1) => '\n```\n' + p1.replace(/<[^>]+>/g, '').trim() + '\n```\n')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<p>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<li>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// IMPORT PROBLEM FROM LEETCODE OR EXTERNAL CODING PLATFORMS
export const importLeetCodeProblem = async (req, res) => {
  try {
    const { urlOrSlug, customDifficulty } = req.body;
    if (!urlOrSlug || !urlOrSlug.trim()) {
      return res.status(400).json({ error: "Please provide a LeetCode URL, problem slug, or title." });
    }

    const slug = extractLeetCodeSlug(urlOrSlug);
    if (!slug) {
      return res.status(400).json({ error: "Invalid LeetCode URL or problem name." });
    }

    // Check if problem already exists in database
    const existing = await Problem.findOne({
      $or: [
        { id: new RegExp(`^leetcode_${slug}(_.*)?$`, 'i') },
        { title: new RegExp(`^${slug.replace(/-/g, ' ')}$`, 'i') }
      ]
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: `Problem "${existing.title}" is already in your problem library!`,
        problem: sanitizePublicProblem(existing)
      });
    }

    let rawTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let rawDifficulty = customDifficulty || 'Medium';
    let rawDescription = '';
    let rawTags = ['LeetCode', 'Algorithms'];
    let exampleTestcases = '';

    // Step 1: Fetch directly from official LeetCode GraphQL API
    try {
      const gqlRes = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://leetcode.com/'
        },
        body: JSON.stringify({
          query: `query getQuestionDetail($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              title
              content
              difficulty
              topicTags { name }
              exampleTestcaseList
            }
          }`,
          variables: { titleSlug: slug }
        })
      });

      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        const q = gqlData?.data?.question;
        if (q && q.title) {
          rawTitle = q.title;
          rawDifficulty = q.difficulty || rawDifficulty;
          rawDescription = convertHtmlToMarkdown(q.content || '');
          if (Array.isArray(q.topicTags)) {
            rawTags = Array.from(new Set(['LeetCode', ...q.topicTags.map(t => t.name)]));
          }
          if (Array.isArray(q.exampleTestcaseList)) {
            exampleTestcases = q.exampleTestcaseList.join('\n');
          }
        }
      }
    } catch (gqlErr) {
      console.warn(`[LeetCode Import] Direct GraphQL lookup for "${slug}": ${gqlErr.message}`);
    }

    // Secondary fallback if GraphQL didn't return description
    if (!rawDescription) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const apiRes = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.questionTitle) {
            rawTitle = data.questionTitle;
            rawDifficulty = data.difficulty || rawDifficulty;
            rawDescription = convertHtmlToMarkdown(data.question || '');
            if (Array.isArray(data.topicTags)) {
              rawTags = Array.from(new Set(['LeetCode', ...data.topicTags.map(t => t.name)]));
            }
            exampleTestcases = data.exampleTestcases || '';
          }
        }
      } catch (apiErr) {
        console.warn(`[LeetCode Import] Secondary API lookup for "${slug}": ${apiErr.message}`);
      }
    }

    // Step 2: Use AI to transform into complete Online Judge format (starter code, public/hidden testcases)
    let finalProblemData = null;
    try {
      const llm = getAgentLLM({ temperature: 0.2, maxTokens: 3000 });
      const prompt = `You are a competitive programming problem creator for an Online Judge.
Transform the following LeetCode problem into an Online Judge format that runs with standard Python stdin/stdout:

Problem Title: ${rawTitle}
Difficulty: ${rawDifficulty}
Tags: ${JSON.stringify(rawTags)}
Description:
${rawDescription ? rawDescription.substring(0, 2000) : `Problem: ${rawTitle}. Implement the standard algorithmic solution.`}
Example Testcases:
${exampleTestcases || 'Standard examples for this problem'}

CRITICAL REQUIREMENTS:
1. "codeBase": Starter Python boilerplate ONLY with sys.stdin reading (no complete solution). E.g.:
# Write your Python solution here
import sys

def solve():
    # Write solution here
    pass

if __name__ == '__main__':
    solve()
2. "publicTestcases": Exactly 3 testcases with "input", "output", and "explanation".
3. "hiddenTestcases": Exactly 5 testcases with "input", "output", and "category" ("normal", "boundary", "min_constraint", "max_constraint", "edge_case").
4. "referenceSolution": Full working Python solution that reads stdin and prints stdout.
5. "score": 100 for Easy, 200 for Medium, 300 for Hard.

Output clean JSON only matching:
{
  "title": "${rawTitle}",
  "difficulty": "${rawDifficulty}",
  "tags": ${JSON.stringify(rawTags)},
  "score": ${rawDifficulty === 'Hard' ? 300 : rawDifficulty === 'Easy' ? 100 : 200},
  "description": "<Clean Markdown problem description with Input/Output specifications and Constraints>",
  "codeBase": "<Starter Python code with sys.stdin reading>",
  "publicTestcases": [
    { "input": "<in 1>", "output": "<out 1>", "explanation": "<exp 1>" },
    { "input": "<in 2>", "output": "<out 2>", "explanation": "<exp 2>" },
    { "input": "<in 3>", "output": "<out 3>", "explanation": "<exp 3>" }
  ],
  "hiddenTestcases": [
    { "input": "<h1 in>", "output": "<h1 out>", "category": "normal" },
    { "input": "<h2 in>", "output": "<h2 out>", "category": "boundary" },
    { "input": "<h3 in>", "output": "<h3 out>", "category": "min_constraint" },
    { "input": "<h4 in>", "output": "<h4 out>", "category": "max_constraint" },
    { "input": "<h5 in>", "output": "<h5 out>", "category": "edge_case" }
  ],
  "referenceSolution": "<Complete Python reference solution>"
}`;

      const completion = await llm.invoke([
        { role: 'system', content: 'You are an expert Online Judge problem formatter. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]);

      const text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        finalProblemData = JSON.parse(match[0]);
      }
    } catch (llmErr) {
      console.warn(`[LeetCode Import] LLM generation note: ${llmErr.message}`);
    }

    // Step 3: Fallback if LLM failed
    if (!finalProblemData || !finalProblemData.publicTestcases || finalProblemData.publicTestcases.length === 0) {
      const sampleInputs = exampleTestcases ? exampleTestcases.split('\n').filter(Boolean) : ["1 2", "3 4", "5 6"];
      finalProblemData = {
        title: rawTitle,
        difficulty: rawDifficulty,
        tags: rawTags,
        score: rawDifficulty === 'Hard' ? 300 : rawDifficulty === 'Easy' ? 100 : 200,
        description: rawDescription || `Solve the classic "${rawTitle}" algorithmic challenge from LeetCode. Read input from standard input and print the result.`,
        codeBase: `# Write your Python solution here\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines:\n        return\n    # Process inputs and output result\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
        publicTestcases: [
          { input: sampleInputs[0] || "0", output: "0", explanation: "Sample testcase 1" },
          { input: sampleInputs[1] || "1", output: "1", explanation: "Sample testcase 2" },
          { input: sampleInputs[2] || "2", output: "2", explanation: "Sample testcase 3" }
        ],
        hiddenTestcases: [
          { input: sampleInputs[0] || "0", output: "0", category: "normal" },
          { input: sampleInputs[1] || "1", output: "1", category: "boundary" },
          { input: "10", output: "10", category: "min_constraint" },
          { input: "100", output: "100", category: "max_constraint" },
          { input: "-1", output: "-1", category: "edge_case" }
        ],
        referenceSolution: `# Reference solution for ${rawTitle}`
      };
    }

    // Ensure description uses real LeetCode description
    let finalDescription = rawDescription && !rawDescription.includes('<Clean') ? rawDescription : '';
    if (!finalDescription && finalProblemData?.description && !finalProblemData.description.includes('<Clean')) {
      finalDescription = finalProblemData.description;
    }
    if (!finalDescription) {
      finalDescription = `Solve the classic "${rawTitle}" algorithmic challenge from LeetCode. Read input from standard input and write the answer to standard output.`;
    }

    // Ensure boilerplate starter code is always visible, clean Python code
    let finalCodeBase = finalProblemData?.codeBase && !finalProblemData.codeBase.includes('<Starter') && finalProblemData.codeBase.includes('def ')
      ? finalProblemData.codeBase.replace(/^<[^>\n]+>/, '# Write your Python solution here')
      : `# Write your Python solution here\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines:\n        return\n    # Process inputs and write output\n    pass\n\nif __name__ == '__main__':\n    solve()\n`;

    const fingerprint = generateProblemFingerprint({
      title: finalProblemData?.title || rawTitle,
      description: finalDescription,
      constraints: '',
      inputFormat: '',
      outputFormat: ''
    });

    const newProblem = new Problem({
      id: `leetcode_${slug}_${Date.now()}`,
      title: finalProblemData?.title || rawTitle,
      difficulty: finalProblemData?.difficulty || rawDifficulty,
      tags: Array.isArray(finalProblemData?.tags) ? finalProblemData.tags : rawTags,
      score: finalProblemData?.score || (rawDifficulty === 'Hard' ? 300 : rawDifficulty === 'Easy' ? 100 : 200),
      description: finalDescription,
      codeBase: finalCodeBase,
      problemFingerprint: fingerprint,
      publicTestcases: finalProblemData?.publicTestcases || [],
      hiddenTestcases: finalProblemData?.hiddenTestcases || [],
      testcases: (finalProblemData?.publicTestcases || []).map(pt => ({ input: pt.input, output: pt.output })),
      referenceSolution: finalProblemData?.referenceSolution || '',
      generatedByAI: false,
    });

    await newProblem.save();

    res.status(201).json({
      success: true,
      message: `Successfully imported "${newProblem.title}" from LeetCode!`,
      problem: sanitizePublicProblem(newProblem)
    });

  } catch (error) {
    console.error('Error importing problem from LeetCode:', error);
    res.status(500).json({ error: 'Failed to import problem from LeetCode: ' + error.message });
  }
};


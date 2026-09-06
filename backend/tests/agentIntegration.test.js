import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { executeMcpTool, listMcpTools } from '../agents/mcp/server.js';
import { buildDebuggingGraph } from '../agents/debugging/debuggingGraph.js';
import { buildContestMasterGraph } from '../agents/contestMaster/contestMasterGraph.js';
import { 
  startDebuggingSession, 
  analyzeContest, 
  approveRecommendation, 
  rejectRecommendation 
} from '../agents/services/agentService.js';
import Problem from '../models/problem.js';
import Submission from '../models/submission.js';
import Contest from '../models/contest.js';
import User from '../models/user.js';
import AgentAuditLog from '../models/agentAuditLog.js';
import AgentRecommendation from '../models/agentRecommendation.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_judge';

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING AGENTIC AI INTEGRATION TEST SUITE");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (err) {
      console.log("❌ FAIL");
      console.error("  Error:", err.message);
      failed++;
    }
  }

  // --- 1. MCP Tools Registry Test ---
  await test("MCP Tools Registry and Definitions", async () => {
    const tools = listMcpTools();
    if (!tools || tools.length < 5) throw new Error("Expected at least 5 registered MCP tools");
    const toolNames = tools.map(t => t.name);
    if (!toolNames.includes('get_problem')) throw new Error("Missing get_problem");
    if (!toolNames.includes('get_submission')) throw new Error("Missing get_submission");
    if (!toolNames.includes('run_code')) throw new Error("Missing run_code");
    if (!toolNames.includes('get_contest_statistics')) throw new Error("Missing get_contest_statistics");
  });

  // --- 2. Seed Test Problem & Submission ---
  const testProblemId = `test_prob_${Date.now()}`;
  const testSubId = `test_sub_${Date.now()}`;
  const testContestId = `test_contest_${Date.now()}`;

  await test("Seed Test Problem, Contest, and Failed Submission", async () => {
    await Problem.create({
      id: testProblemId,
      title: "Sum of Positive Integers",
      description: "Return the sum of two positive integers. Inputs are given on two lines.",
      score: 100,
      codeBase: "def solve():\n    pass",
      testcases: [
        { input: "3\n5\n", output: "8\n" },
        { input: "10\n20\n", output: "30\n" } // Hidden
      ],
      constraintLimit: 1000
    });

    const contestDoc = await Contest.create({
      name: "Agent Test Challenge",
      start: new Date(Date.now() - 3600000),
      end: new Date(Date.now() + 3600000),
      problems: [testProblemId],
      participants: ["test_user_1"],
      duration: 60
    });

    for (let i = 1; i <= 5; i++) {
      await Submission.create({
        submissionId: `${testSubId}_${i}`,
        problem: testProblemId,
        contestId: contestDoc._id,
        user: `test_user_${i}`,
        username: `CoderAlpha_${i}`,
        score: 0,
        result: "Wrong Answer",
        time: 45,
        memory: 12,
        code: "a = int(input())\nb = int(input())\nprint(a - b) # Bug: subtracting instead of adding\n",
        language: "py",
        errorDetails: "Testcase 1 failed: Expected 8, got -2"
      });
    }
  });

  // --- 3. MCP Problem Sanitization Tool ---
  await test("MCP get_problem hides hidden testcases", async () => {
    const data = await executeMcpTool("get_problem", { problemId: testProblemId });
    if (!data.title || data.title !== "Sum of Positive Integers") throw new Error("Problem title mismatch");
    if (!data.sampleTestcases || data.sampleTestcases.length > 2) throw new Error("Exposed too many testcases");
  });

  // --- 4. MCP Docker Compiler Isolation Tool ---
  await test("MCP run_code executes in Docker container", async () => {
    const res = await executeMcpTool("run_code", {
      language: "py",
      sourceCode: "a = int(input())\nb = int(input())\nprint(a + b)\n",
      stdin: "10\n25\n"
    });
    if (!res.success) throw new Error(`Docker execution failed: ${res.error}`);
    if (res.output.trim() !== "35") throw new Error(`Expected output 35, got: ${res.output}`);
  });

  // --- 5. LangGraph Debugging Agent Execution ---
  await test("LangGraph Autonomous Code Debugging Agent Workflow", async () => {
    const session = await startDebuggingSession({
      userId: "test_user_1",
      submissionId: `${testSubId}_1`,
      problemId: testProblemId,
      sourceCode: "a = int(input())\nb = int(input())\nprint(a - b)\n",
      language: "py",
      verdict: "Wrong Answer"
    });

    if (session.status !== 'diagnosed' && session.status !== 'completed') {
      throw new Error(`Unexpected session status: ${session.status}`);
    }
    if (!session.finalDiagnosis) {
      throw new Error("Missing final diagnosis object");
    }
    if (!session.finalDiagnosis.rootCause) {
      throw new Error("Missing root cause in diagnosis");
    }
    if (session.iterations > 5) {
      throw new Error(`Exceeded max iterations: ${session.iterations}`);
    }
  });

  // --- 6. LangGraph AI Contest Master & Anomaly Detection ---
  let recIdToTest = null;
  await test("LangGraph AI Contest Master Anomaly Analysis", async () => {
    const cDoc = await Contest.findOne({ name: "Agent Test Challenge" });
    const result = await analyzeContest({
      contestId: String(cDoc._id),
      adminId: "admin_tester"
    });

    if (!result.sessionId) throw new Error("Missing analysis session ID");
    if (!result.contestHealth) throw new Error("Missing contest health evaluation");
    if (!result.createdRecommendations || result.createdRecommendations.length === 0) {
      throw new Error("Contest Master should have generated recommendations for failed submissions");
    }

    recIdToTest = result.createdRecommendations[0].recommendationId;
  });

  // --- 7. Human-in-the-Loop Recommendation Approval ---
  await test("Human-in-the-Loop Recommendation Approval & Audit Logging", async () => {
    if (!recIdToTest) throw new Error("No recommendation ID available to test");
    const approval = await approveRecommendation({
      recommendationId: recIdToTest,
      adminId: "admin_tester",
      note: "Test approval via integration suite"
    });

    if (!approval.success) throw new Error("Approval failed");
    if (approval.recommendation.status !== 'approved') throw new Error("Status was not updated to approved");

    // Check Audit Log
    const audit = await AgentAuditLog.findOne({ targetId: recIdToTest, action: 'recommendation_approved' });
    if (!audit) throw new Error("Audit log record was not created for approval");
  });

  // --- 8. Human-in-the-Loop Recommendation Rejection ---
  await test("Human-in-the-Loop Recommendation Rejection & Audit Logging", async () => {
    const testRec = await AgentRecommendation.create({
      recommendationId: `rec_test_reject_${Date.now()}`,
      contestId: testContestId,
      type: "difficulty_anomaly",
      severity: "low",
      reasoningSummary: "Test rejection reason",
      recommendation: "Test suggestion",
      status: "pending"
    });

    const rejection = await rejectRecommendation({
      recommendationId: testRec.recommendationId,
      adminId: "admin_tester",
      reason: "Contest running as intended"
    });

    if (!rejection.success) throw new Error("Rejection failed");
    if (rejection.recommendation.status !== 'rejected') throw new Error("Status was not updated to rejected");

    const audit = await AgentAuditLog.findOne({ targetId: testRec.recommendationId, action: 'recommendation_rejected' });
    if (!audit) throw new Error("Audit log record was not created for rejection");
  });

  // Cleanup test artifacts
  await Problem.deleteOne({ id: testProblemId });
  await Contest.deleteOne({ name: "Agent Test Challenge" });
  await Submission.deleteMany({ problem: testProblemId });

  console.log("==================================================");
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test runner crash:", err);
  process.exit(1);
});

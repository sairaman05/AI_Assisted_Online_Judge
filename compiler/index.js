import express from "express";
import cors from "cors";
import axios from "axios";
import { generateFile } from "./generateFile.js";
import { executePy } from "./executePy.js";
import { executeJava } from "./executeJava.js";
import { executeCpp } from "./executeCpp.js";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const compiler = express();

// Middleware
compiler.use(cors());
compiler.use(express.urlencoded({ extended: true }));
compiler.use(express.json());

// Output directory for submission logs
const outputPath = path.join(path.resolve(), "outputs");
if (!fsSync.existsSync(outputPath)) {
  fsSync.mkdirSync(outputPath, { recursive: true });
}

// Function to return executor based on language
function getExecutor(format) {
  switch (format.toLowerCase()) {
    case "py":
    case "python":
      return executePy;
    case "java":
      return executeJava;
    case "cpp":
    case "c++":
      return executeCpp;
    default:
      return null;
  }
}

// POST /submit endpoint: run all testcases and save output logs
const submissionsDir = path.join(path.resolve(), "submissions");
if (!fsSync.existsSync(submissionsDir)) {
  fsSync.mkdirSync(submissionsDir, { recursive: true });
}

const BACKEND_URL = process.env.BACKEND_URL || "http://host.docker.internal:5174";

compiler.post("/submit", async (req, res) => {
  const { format, code, problemId, userId, contestId, userName, testcases: passedTestcases } = req.body;

  if (!code) return res.status(400).json({ success: false, error: "Code not provided" });
  if (!problemId) return res.status(400).json({ success: false, error: "Problem ID not provided" });
  
  const effectiveUserId = userId || "guest_user";
  const executor = getExecutor(format);
  if (!executor) return res.status(400).json({ success: false, error: `Unsupported language: ${format}` });

  try {
    let testcases = passedTestcases || [];

    if (!testcases.length) {
      try {
        // Fetch problem testcases from backend if not directly provided in payload
        const problemRes = await axios.get(`${BACKEND_URL}/api/problems/${problemId}`);
        const problem = problemRes.data || {};
        testcases = [
          ...(problem.publicTestcases || []),
          ...(problem.hiddenTestcases || []),
          ...(problem.testcases || [])
        ].filter(t => t && (t.input !== undefined || t.output !== undefined));
      } catch (fetchErr) {
        console.warn("Could not fetch testcases from backend, using default fallback testcase:", fetchErr.message);
      }
    }

    if (!testcases.length) {
      testcases = [{ input: "", output: "" }];
    }

    // Generate unique temp source code file with generated uuid
    const { filepath, uuid } = await generateFile(format, code);

    let totalTime = 0;
    let hasError = false;
    let failReason = null;
    let failOutput = null;
    let passedCount = 0;

    // Run all testcases sequentially
    for (let i = 0; i < testcases.length; i++) {
      const testcase = testcases[i];
      const inputStr = testcase.input || "";
      const expectedOutput = (testcase.output || "").trim().replace(/\r\n/g, "\n");

      const result = await executor(filepath, inputStr);

      totalTime += result.time || 0;
      let actualOutput = "";
      if (result.error) {
        actualOutput = result.error;
      } else {
        actualOutput = (result.output || "").trim().replace(/\r\n/g, "\n");
      }

      if (actualOutput === expectedOutput) {
        passedCount++;
      } else {
        hasError = true;
        const typeLabel = testcase.label || (testcase.isPublic ? `Visible Testcase ${i + 1}` : `Hidden Testcase ${i + 1}`);
        failReason = `Wrong Answer on ${typeLabel}`;
        failOutput = `Expected:\n${expectedOutput}\nGot:\n${actualOutput}`;
        break;
      }
    }

    // Determine final verdict
    const finalResult = hasError
      ? failReason.startsWith("Wrong Answer")
        ? failReason
        : "Runtime Error"
      : "Accepted";

    const finalScore = 0;

    // Save output log only for submissions
    const outputFilePath = path.join(outputPath, `${uuid}.out`);
    const outputLog = hasError ? `${finalResult}\n\n${failOutput || ""}` : "All testcases passed!";
    await fs.writeFile(outputFilePath, outputLog);

    // Save submitted source code file permanently
    const savedSourcePath = path.join(submissionsDir, `${uuid}.${format}`);
    await fs.copyFile(filepath, savedSourcePath);

    // Save submission record via API
    await axios.post(`${BACKEND_URL}/api/submissions`, {
      problem: problemId,
      user: userId,
      contestId,
      submissionId: uuid,
      username: userName,
      score: finalScore,
      result: finalResult.startsWith("Wrong Answer") ? "Wrong Answer" : finalResult,
      time: totalTime || null,
      memory: null,
    }).catch(err => console.warn("Failed to post submission record from compiler:", err.message));

    // Cleanup temporary source file
    try {
      await fs.unlink(filepath);
    } catch (cleanupErr) {
      console.error("Error deleting temp source file:", cleanupErr);
    }
    if (hasError) {
      return res.json({
        success: false,
        uuid,
        error: finalResult,
        detail: failOutput,
        passedCount,
        totalCount: testcases.length
      });
    } else {
      return res.json({
        success: true,
        uuid,
        output: `All ${testcases.length} testcases passed!`,
        totalTime,
        passedCount: testcases.length,
        totalCount: testcases.length
      });
    }

  } catch (error) {
    console.error("Error in /submit:", error);
    return res.status(500).json({ success: false, error: "Internal server error", detail: error.message || "Unknown error" });
  }
});


// POST /run endpoint: run code once with optional input; no output file saved
compiler.post("/run", async (req, res) => {
  const { format, code, input } = req.body;
  const lang = (format || "").toLowerCase();

  const tempDir = path.resolve("./codes");
  if (!fsSync.existsSync(tempDir)) {
    fsSync.mkdirSync(tempDir, { recursive: true });
  }
  const uniqueId = uuidv4();
  let filename;

  switch (lang) {
    case "py":
    case "python":
      filename = `run_${uniqueId}.py`;
      break;
    case "cpp":
    case "c++":
      filename = `run_${uniqueId}.cpp`;
      break;
    case "java":
      filename = `run_${uniqueId}.java`;
      break;
    default:
      return res.status(400).json({ success: false, error: "Unsupported language" });
  }

  const filePath = path.join(tempDir, filename);

  try {
    // Write source code to temp file
    await fs.writeFile(filePath, code);

    let result;
    if (lang === "py" || lang === "python") {
      result = await executePy(filePath, input || "");
    } else if (lang === "cpp" || lang === "c++") {
      result = await executeCpp(filePath, input || "");
    } else if (lang === "java") {
      result = await executeJava(filePath, input || "");
    }

    if (result.error) {
      return res.json({ success: false, error: result.error, detail: result.detail || "" });
    }

    return res.json({ success: true, output: result.output, time: result.time, memory: result.memory });
  } catch (err) {
    console.error("Error running code:", err);
    return res.status(500).json({ success: false, error: "Internal server error", detail: err.message });
  } finally {
    // Cleanup temp source file
    try {
      await fs.unlink(filePath);
    } catch (cleanupErr) {
      console.error("Error deleting temp run file:", cleanupErr);
    }
  }
});

// Start server
compiler.listen(5175, (error) => {
  if (error) {
    console.error("Error starting the server:", error);
  } else {
    console.log("✅ Server started on port 5175");
  }
});

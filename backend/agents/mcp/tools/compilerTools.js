import axios from 'axios';
import { AGENT_CONFIG } from '../../shared/agentConfig.js';

const COMPILER_URL = (process.env.COMPILER_IP || 'http://localhost:5175').trim();
const RUN_ENDPOINT = COMPILER_URL.startsWith('http') ? `${COMPILER_URL}/run` : `http://${COMPILER_URL}/run`;

/**
 * MCP Tool: run_code
 * Strictly executes code in the isolated Docker container.
 */
export async function runCodeTool({ language, sourceCode, stdin = "" }) {
  if (!language || !sourceCode) {
    throw new Error("language and sourceCode are required");
  }

  // Security validation checks
  if (sourceCode.length > AGENT_CONFIG.MAX_SOURCE_CODE_LENGTH) {
    throw new Error(`Source code exceeds maximum allowed size of ${AGENT_CONFIG.MAX_SOURCE_CODE_LENGTH} characters`);
  }

  if (stdin.length > AGENT_CONFIG.MAX_DIAGNOSTIC_INPUT_LENGTH) {
    throw new Error(`Diagnostic input exceeds maximum allowed size of ${AGENT_CONFIG.MAX_DIAGNOSTIC_INPUT_LENGTH} characters`);
  }

  const langMap = {
    py: "py",
    python: "py",
    java: "java",
    cpp: "cpp",
    "c++": "cpp"
  };

  const format = langMap[language.toLowerCase()] || "py";

  try {
    const response = await axios.post(
      RUN_ENDPOINT,
      {
        format,
        code: sourceCode,
        input: stdin,
      },
      {
        timeout: AGENT_CONFIG.DOCKER_EXECUTION_TIMEOUT_MS,
        headers: { "Content-Type": "application/json" }
      }
    );

    const data = response.data || {};

    let output = data.output || "";
    if (output.length > AGENT_CONFIG.MAX_OUTPUT_LENGTH) {
      output = output.substring(0, AGENT_CONFIG.MAX_OUTPUT_LENGTH) + "\n... [output truncated]";
    }

    let error = data.error || data.detail || null;
    if (error && error.length > AGENT_CONFIG.MAX_OUTPUT_LENGTH) {
      error = error.substring(0, AGENT_CONFIG.MAX_OUTPUT_LENGTH) + "\n... [error truncated]";
    }

    return {
      success: !!data.success,
      output,
      error,
      executionTimeMs: data.time || 0,
      memory: data.memory || null,
      timedOut: false,
    };
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return {
        success: false,
        output: "",
        error: "Execution Timed Out (Time Limit Exceeded)",
        executionTimeMs: AGENT_CONFIG.DOCKER_EXECUTION_TIMEOUT_MS,
        timedOut: true,
      };
    }

    return {
      success: false,
      output: "",
      error: `Compiler execution error: ${err.response?.data?.error || err.message}`,
      timedOut: false,
    };
  }
}

export const compilerToolDefs = [
  {
    name: "run_code",
    description: "Run code strictly in isolated Docker container judge with optional standard input.",
    inputSchema: {
      type: "object",
      properties: {
        language: { type: "string", description: "Language: 'py', 'java', or 'cpp'" },
        sourceCode: { type: "string", description: "The full source code string to execute" },
        stdin: { type: "string", description: "Optional standard input to feed to the program" }
      },
      required: ["language", "sourceCode"]
    }
  }
];

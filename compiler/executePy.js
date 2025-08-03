const { spawn } = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');

const outputPath = path.join(__dirname, 'outputs'); // for submit handler to save logs, not used here

/**
 * Executes a Python script with optional input sent to stdin.
 * Enforces a timeout.
 *
 * @param {string} filepath - Absolute path to the Python script.
 * @param {string} input - String input for stdin (default: '').
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000).
 * @returns {Promise<object>} Resolves with:
 *  - { output, time, memory } on success
 *  - { error, detail, time, memory } on failure or timeout
 */
const executePy = async (filepath, input = '', timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let timedOut = false;

    // Spawn Python process
    const pyProcess = spawn('python', [filepath]);

    let stdoutData = '';
    let stderrData = '';

    // Setup timeout: forcibly kill process if it exceeds time limit
    const timeout = setTimeout(() => {
      timedOut = true;
      pyProcess.kill();
      resolve({ error: 'Time Limit Exceeded' });
    }, timeoutMs);

    // Send input if any, or close stdin immediately
    if (input) {
      pyProcess.stdin.write(input);
    }
    pyProcess.stdin.end();

    // Capture stdout
    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    // Capture stderr
    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // On process exit
    pyProcess.on('close', (exitCode) => {
      clearTimeout(timeout);

      const endTime = performance.now();
      const timeTaken = +(endTime - startTime).toFixed(2);

      // Approximate memory usage (resident set size in KB)
      const resourceUsage = process.resourceUsage();
      const memoryUsedKb = resourceUsage.rss / 1024;

      if (timedOut) return; // Already resolved on timeout

      if (exitCode !== 0) {
        const errorType = parsePythonError(stderrData);
        resolve({
          error: errorType,
          detail: stderrData.trim(),
          time: timeTaken,
          memory: memoryUsedKb,
        });
      } else {
        resolve({
          output: stdoutData.trim(),
          time: timeTaken,
          memory: memoryUsedKb,
        });
      }
    });

    // Handle spawn errors (like process not starting)
    pyProcess.on('error', (err) => {
      clearTimeout(timeout);
      const errMsg = `Failed to start Python process: ${err.message}`;
      resolve({ error: errMsg });
    });
  });
};

/**
 * Parses stderr string to provide detailed user-friendly Python error messages.
 *
 * @param {string} stderrData
 * @returns {string} Friendly error message
 */
function parsePythonError(stderrData) {
  if (!stderrData) return 'Unknown Python Error';

  const lines = stderrData.trim().split('\n');
  const lastLine = lines[lines.length - 1].trim(); // Usually error type + message

  // Extract just error type before colon, if available
  const errorType = lastLine.includes(':') ? lastLine.split(':')[0].trim() : lastLine;

  // Map common Python errors to user-friendly messages
  if (/SyntaxError/.test(errorType)) {
    return 'Python Syntax Error: Invalid syntax detected';
  } else if (/IndentationError/.test(errorType)) {
    return 'Python Indentation Error: Incorrect indentation';
  } else if (/NameError/.test(errorType)) {
    return 'Python Name Error: Undefined variable or function';
  } else if (/TypeError/.test(errorType)) {
    return 'Python Type Error: Operation on incompatible data types';
  } else if (/IndexError/.test(errorType)) {
    return 'Python Index Error: Index out of range';
  } else if (/KeyError/.test(errorType)) {
    return 'Python Key Error: Key not found in dictionary';
  } else if (/ZeroDivisionError/.test(errorType)) {
    return 'Python Zero Division Error: Division by zero';
  } else if (/AttributeError/.test(errorType)) {
    return 'Python Attribute Error: Invalid attribute or method call';
  } else if (/ImportError/.test(errorType)) {
    return 'Python Import Error: Failed to import module or object';
  } else if (/ModuleNotFoundError/.test(errorType)) {
    return 'Python Module Not Found: Requested module not found';
  } else if (/ValueError/.test(errorType)) {
    return 'Python Value Error: Incorrect value';
  } else if (/RuntimeError/.test(errorType)) {
    return 'Python Runtime Error: Error during program execution';
  } else if (/RecursionError/.test(errorType)) {
    return 'Python Recursion Error: Maximum recursion depth exceeded';
  } else if (/FileNotFoundError/.test(errorType)) {
    return 'Python File Not Found Error: Specified file does not exist';
  } else if (/TimeoutExpired/.test(stderrData)) {
    return 'Python Runtime Error: Execution timed out';
  } else {
    // Fallback: return full last error line
    return `Python Error: ${lastLine}`;
  }
}

module.exports = {
  executePy,
};

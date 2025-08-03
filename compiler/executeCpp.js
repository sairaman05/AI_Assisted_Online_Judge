const { spawn } = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');

const outputPath = path.join(__dirname, 'outputs'); // only your submit handler writes files here

/**
 * Compiles and runs C++ code with given input, handles timeout, captures output & errors.
 *
 * @param {string} filepath - Path to the C++ source file (.cpp)
 * @param {string} input - Input string to be passed to program stdin (default: '')
 * @param {number} timeoutMs - Timeout in milliseconds (default 5000)
 * @returns {Promise<object>} Resolves with {output, time, memory} on success, or {error, detail, time, memory} on failure/timeout
 */
const executeCpp = (filepath, input = '', timeoutMs = 5000) => {
  const jobID = path.basename(filepath, path.extname(filepath));
  // const outFile = path.join(outputPath, `${jobID}.out`); // Do NOT write here

  // Use .exe extension for Windows executables
  const executableName = process.platform === 'win32' ? `${jobID}.exe` : jobID;
  const executablePath = path.join(outputPath, executableName);

  return new Promise((resolve) => {
    const startTime = performance.now();

    // Step 1: Compile the source file
    const compile = spawn('g++', [filepath, '-o', executablePath]);

    let compileErrors = '';

    compile.stderr.on('data', (data) => {
      compileErrors += data.toString();
    });

    compile.on('close', (code) => {
      if (code !== 0) {
        // Compilation failed - do NOT write file here, just return error info
        // fs.writeFileSync(outFile, `Compilation Error:\n${compileErrors.trim()}`); // Commented out
        return resolve({ error: 'Compilation Failed', detail: compileErrors.trim() });
      }

      // Step 2: Run the compiled executable
      const runOptions = process.platform === 'win32' ? { shell: true } : {};
      const run = spawn(executablePath, [], runOptions);

      let stdout = '';
      let stderr = '';
      let isTimeout = false;

      const timeout = setTimeout(() => {
        isTimeout = true;
        run.kill('SIGKILL');
        // fs.writeFileSync(outFile, 'Time Limit Exceeded'); // Commented out
        return resolve({ error: 'Time Limit Exceeded' });
      }, timeoutMs);

      if (input) {
        run.stdin.write(input);
      }
      run.stdin.end();

      run.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      run.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      run.on('close', (exitCode) => {
        clearTimeout(timeout);
        if (isTimeout) return;

        const endTime = performance.now();
        const timeTaken = +(endTime - startTime).toFixed(2);

        // Approximate memory usage (resident set size in KB)
        // Note: using process.resourceUsage() represents memory for current process — you might want a more precise approach
        const resourceUsage = process.resourceUsage();
        const memoryUsedKb = resourceUsage.rss / 1024;

        if (exitCode !== 0) {
          // fs.writeFileSync(outFile, `Runtime Error:\n${stderr.trim()}`); // Commented out
          return resolve({ error: 'Runtime Error', detail: stderr.trim(), time: timeTaken, memory: memoryUsedKb });
        } else {
          // fs.writeFileSync(outFile, stdout.trim()); // Commented out
          return resolve({ output: stdout.trim(), time: timeTaken, memory: memoryUsedKb });
        }
      });

      run.on('error', (err) => {
        clearTimeout(timeout);
        // fs.writeFileSync(outFile, `Execution Failed:\n${err.message}`); // Commented out
        return resolve({ error: 'Execution Failed', detail: err.message });
      });
    });

    compile.on('error', (err) => {
      // fs.writeFileSync(outFile, `Compilation Failed:\n${err.message}`); // Commented out
      return resolve({ error: 'Compilation Failed', detail: err.message });
    });
  });
};

module.exports = { executeCpp };

import { spawn } from 'child_process';
import path from 'path';
import { performance } from 'perf_hooks';


function parseJavaCompileError(errorOutput) {
    const lines = errorOutput.split('\n');
    const firstLine = lines.find(line => line.includes('error:')) || lines[0];

    if (/';' expected/.test(firstLine)) {
        return "Java Syntax Error: Missing semicolon (;)";
    } else if (/cannot find symbol/.test(firstLine)) {
        return "Java Compilation Error: Undefined variable or method";
    } else if (/incompatible types/.test(firstLine)) {
        return "Java Type Mismatch Error: Incompatible types";
    } else if (/missing return statement/.test(firstLine)) {
        return "Java Compilation Error: Missing return statement";
    } else if (/has private access/.test(firstLine)) {
        return "Java Compilation Error: Access Modifier Issue (Private method or variable)";
    } else if (/is already defined/.test(firstLine)) {
        return "Java Compilation Error: Duplicate Class or Method Name";
    } else if (/unreachable statement/.test(firstLine)) {
        return "Java Compilation Error: Unreachable Code";
    } else if (/cannot find symbol/.test(firstLine)) {
        return "Java Compilation Error: Missing Import or Undefined Reference";
    } else {
        return `Java Compilation Error: ${firstLine}`;
    }
}

function parseJavaRuntimeError(errorOutput) {
    const lines = errorOutput.split('\n');
    const firstLine = lines.find(line => line.includes('Exception in thread "main"')) || lines[0];

    if (/java.lang.NullPointerException/.test(errorOutput)) {
        return "Java Runtime Error: Null Pointer Exception (Accessing a null object)";
    } else if (/java.lang.ArrayIndexOutOfBoundsException/.test(errorOutput)) {
        return "Java Runtime Error: Array Index Out of Bounds";
    } else if (/java.util.EmptyStackException/.test(errorOutput)) {
        return "Java Runtime Error: Empty Stack Exception (Attempted operation on an empty stack)";
    } else if (/java.lang.ClassCastException/.test(errorOutput)) {
        return "Java Runtime Error: Class Cast Exception (Invalid object type casting)";
    } else if (/java.lang.ArithmeticException/.test(errorOutput)) {
        return "Java Runtime Error: Arithmetic Exception (Division by zero)";
    } else if (/java.lang.IllegalArgumentException/.test(errorOutput)) {
        return "Java Runtime Error: Illegal Argument Exception (Invalid method argument)";
    } else if (/java.lang.NumberFormatException/.test(errorOutput)) {
        return "Java Runtime Error: Number Format Exception (Invalid string-to-number conversion)";
    } else if (/java.lang.StackOverflowError/.test(errorOutput)) {
        return "Java Stack Overflow Error: Infinite recursion or deep recursion";
    } else if (/java.lang.OutOfMemoryError/.test(errorOutput)) {
        return "Java Memory Error: Out of memory";
    } else if (/java.lang.NoClassDefFoundError/.test(errorOutput)) {
        return "Java Linkage Error: No Class Definition Found (Class missing at runtime)";
    } else if (/java.lang.ClassNotFoundException/.test(errorOutput)) {
        return "Java Runtime Error: Class Not Found Exception";
    } else if (/java.lang.IllegalStateException/.test(errorOutput)) {
        return "Java Runtime Error: Illegal State Exception (Method called at an inappropriate time)";
    } else if (/java.lang.UnsupportedOperationException/.test(errorOutput)) {
        return "Java Runtime Error: Unsupported Operation Exception";
    } else if (/java.util.ConcurrentModificationException/.test(errorOutput)) {
        return "Java Runtime Error: Concurrent Modification Exception (Unsafe collection modification)";
    } else if (/java.io.FileNotFoundException/.test(errorOutput)) {
        return "Java Runtime Error: File Not Found Exception";
    } else if (/java.io.IOException/.test(errorOutput)) {
        return "Java Runtime Error: General Input/Output Exception";
    } else if (/java.lang.SecurityException/.test(errorOutput)) {
        return "Java Runtime Error: Security Exception (Access violation)";
    } else if (/java.lang.NoSuchMethodError/.test(errorOutput)) {
        return "Java Linkage Error: No Such Method Found";
    } else if (/java.lang.AssertionError/.test(errorOutput)) {
        return "Java Runtime Error: Assertion Failed";
    } else if (/java.lang.InterruptedException/.test(errorOutput)) {
        return "Java Runtime Error: Thread Interrupted Exception";
    } else if (/java.util.concurrent.TimeoutException/.test(errorOutput)) {
        return "Java Runtime Error: Timeout Exception (Operation timed out)";
    } else {
        return `Java Runtime Error: ${firstLine}`;
    }
}

function parseJavaLinkageError(errorOutput) {
    if (/java.lang.NoClassDefFoundError/.test(errorOutput)) {
        return "Java Linkage Error: No Class Definition Found";
    } else if (/java.lang.UnsatisfiedLinkError/.test(errorOutput)) {
        return "Java Linkage Error: Native Method Link Failure";
    } else if (/java.lang.VerifyError/.test(errorOutput)) {
        return "Java Linkage Error: Bytecode Verification Failed";
    } else {
        return `Java Linkage Error: ${errorOutput.split('\n')[0]}`;
    }
}


/**
 * Executes a compiled Java program.
 * @param {string} filepath - Path to the compiled Java class file (no extension).
 * @param {string} input - Optional string input to feed program's stdin.
 * @param {number} timeoutMs - Max execution time in milliseconds (default 5000ms).
 * @returns {Promise<object>} Resolves with output, time, memory or error info.
 */
const executeJava = (filepath, input = '', timeoutMs = 5000) => {
    let output = '';
    let errorOutput = '';

    const workingDir = path.dirname(filepath);
    const className = path.basename(filepath);

    return new Promise((resolve) => {
        const startTime = performance.now();
        let timedOut = false;

        const javaProcess = spawn('java', ['-cp', workingDir, className], {
            cwd: workingDir,
            shell: true,
        });

        const timeout = setTimeout(() => {
            timedOut = true;
            javaProcess.kill('SIGKILL');
            resolve({ error: 'Time Limit Exceeded' });
        }, timeoutMs);

        if (input) {
            javaProcess.stdin.write(input);
        }
        javaProcess.stdin.end();

        javaProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        javaProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        javaProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (timedOut) return;

            const endTime = performance.now();
            const execTime = +(endTime - startTime).toFixed(2);
            const memUsageKb = process.memoryUsage().rss / 1024;

            if (code !== 0) {
                // Check if this error appears to be runtime or linkage error
                let parsedError;

                if (/error:/i.test(errorOutput)) {
                    // Compile error (rare here, usually from javac, but handle anyway)
                    parsedError = parseJavaCompileError(errorOutput);
                } else if (/Exception|Error/.test(errorOutput)) {
                    // Runtime or linkage error
                    if (/NoClassDefFoundError|UnsatisfiedLinkError|VerifyError/.test(errorOutput)) {
                        parsedError = parseJavaLinkageError(errorOutput);
                    } else {
                        parsedError = parseJavaRuntimeError(errorOutput);
                    }
                } else {
                    // Fallback generic error from stderr
                    parsedError = `Java Error: ${errorOutput.trim() || "Unknown runtime error"}`;
                }

                resolve({
                    error: parsedError,
                    detail: errorOutput.trim(),
                    time: execTime,
                    memory: memUsageKb,
                });
            } else {
                // Success
                resolve({
                    output: output.trim(),
                    time: execTime,
                    memory: memUsageKb,
                });
            }
        });

        javaProcess.on('error', (err) => {
            clearTimeout(timeout);
            resolve({
                error: 'Failed to start Java process',
                detail: err.message,
            });
        });
    });
};


export { executeJava };

const COMPILER_API_BASE = `${import.meta.env.VITE_BACKEND_IP || 'http://localhost:5174'}/api/compiler`;

// Submit code for evaluation (submission)
export async function submitCode( lang, code, problemId, userId, contestId, userName, input = "" ) {
  console.log(lang, code, problemId, userId, contestId, userName, input);
  return fetch(`${COMPILER_API_BASE}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lang: lang,
      format: lang,
      code: code,
      problemId: problemId,  // required: send problem id
      userId: userId, 
      contestId: contestId,
      userName: userName,
      input: input           // optional: input to be fed to code via stdin
    }),
  })
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return { error: "Submission failed" };
    });
}

// Run code without submission (for instant feedback or code execution)
export async function runCode( lang, code, input = "", problemId = "" ) {
  return fetch(`${COMPILER_API_BASE}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lang: lang,
      format: lang,
      code: code,
      input: input,          // optional input string for the code running
      problemId: problemId,  // problemId for fetching visible testcases
    }),
  })
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return { error: "Execution failed" };
    });
}

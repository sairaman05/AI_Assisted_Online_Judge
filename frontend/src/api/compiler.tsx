// Submit a solution with optional problemId, userId, and input for test case inputs
export function submit(lang, code, problemId, userId, contestId, userName, input = '') {
  //console.log(lang, code, problemId, userId, contestId, userName, input);
  return fetch("http://localhost:5175/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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

// Run code with optional input (for code execution without submission)
export function run(lang, code, input = '') {
  return fetch("http://localhost:5175/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: lang,
      code: code,
      input: input,          // optional input string for the code running
    }),
  })
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return { error: "Execution failed" };
    });
}

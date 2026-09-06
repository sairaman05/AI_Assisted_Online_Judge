import React from "react";

export default function OutputConsole({ output }) {
  return (
    <section className="bg-gray-900 text-green-400 p-[5%] rounded-lg font-mono whitespace-pre-wrap max-h-36 overflow-auto mt-6">
      <strong>Output:</strong>
      <div>{output || "No output yet."}</div>
    </section>
  );
}

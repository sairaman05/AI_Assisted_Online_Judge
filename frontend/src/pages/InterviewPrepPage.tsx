import React, { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../api/authuser";

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  feedback?: any;
}

export default function InterviewPrepPage() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const userId = user?.id || user?.email || "";

  // Step 1: Configuration Form State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("Mid-Level");
  const [roundsInput, setRoundsInput] = useState("Coding Assessment, Technical Interview, System Design, Behavioral");
  const [jdText, setJdText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Step 2: Session & Generated Data State
  const [loading, setLoading] = useState(false);
  const [prepId, setPrepId] = useState<string | null>(null);
  const [extractedAnalysis, setExtractedAnalysis] = useState<any | null>(null);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"roadmap" | "faqs" | "concepts" | "mock" | "revision">("roadmap");

  // Step 3: Interactive Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userResponse, setUserResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // Step 4: Revision & PDF State
  const [lastMinuteDoc, setLastMinuteDoc] = useState<any | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const backendIp = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";

  // Handle PDF Upload & Analysis (Optional JD)
  const handleJDUpload = async () => {
    if (!company.trim() || !role.trim()) {
      alert("Please specify Company Name and Target Role.");
      return;
    }

    setLoading(true);
    try {
      let analysisObj = null;
      let fullText = jdText;

      // If user uploaded file or pasted text, send to upload-jd API
      if (selectedFile || jdText.trim()) {
        const formData = new FormData();
        formData.append("company", company);
        formData.append("role", role);
        if (jdText) formData.append("jdText", jdText);
        if (selectedFile) formData.append("jdFile", selectedFile);

        const res = await fetch(`${backendIp}/api/interview/upload-jd`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          analysisObj = data.analysis;
          fullText = data.jdText;
          setExtractedAnalysis(data.analysis);
          setJdText(data.jdText);
        }
      }

      // Generate roadmap, FAQs, and Core Concepts
      await generateRoadmap(analysisObj, fullText);
    } catch (err: any) {
      alert("Error processing interview suite: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (skillsObj?: any, fullText?: string) => {
    try {
      const rounds = roundsInput.split(",").map((r) => r.trim()).filter(Boolean);
      const res = await fetch(`${backendIp}/api/interview/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          company,
          role,
          experience,
          rounds,
          extractedSkills: skillsObj || extractedAnalysis,
          jdText: fullText || jdText,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate roadmap");
      const data = await res.json();
      setRoadmap(data.roadmap);
      setPrepId(data.prepId);

      // Initialize Mock Interviewer first question
      const initialQ = `Welcome to your mock technical interview for the ${role} position at ${company}. Let's begin! Can you walk me through a complex technical challenge you recently solved?`;
      setCurrentQuestion(initialQ);
      setChatMessages([{ sender: "ai", text: initialQ }]);
    } catch (err: any) {
      console.error("Roadmap generation error:", err);
    }
  };

  // Interactive Mock Interview Chat Submission
  const handleSendChatResponse = async () => {
    if (!userResponse.trim()) return;

    const userMsg = userResponse.trim();
    setUserResponse("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${backendIp}/api/interview/interactive-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prepId,
          company,
          role,
          currentQuestion,
          userAnswer: userMsg,
          chatHistory: chatMessages,
        }),
      });

      if (!res.ok) throw new Error("Failed to get interview feedback");
      const data = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.followUpQuestion || "Thank you. Let's move to the next topic.",
          feedback: data,
        },
      ]);
      setCurrentQuestion(data.followUpQuestion || "");
    } catch (err: any) {
      console.error("Mock interview error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Last-Minute Revision Document Generation
  const handleGenerateLastMinuteDoc = async () => {
    setDocLoading(true);
    try {
      const res = await fetch(`${backendIp}/api/interview/last-minute-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prepId,
          company,
          role,
          extractedSkills: extractedAnalysis,
          roadmap,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate revision document");
      const data = await res.json();
      setLastMinuteDoc(data);
    } catch (err: any) {
      alert("Error creating revision doc: " + err.message);
    } finally {
      setDocLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-gray-900 border border-purple-500/30 p-6 sm:p-8 rounded-2xl mb-8 shadow-xl">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            💼 AI Interview Preparation Suite
          </h1>
          <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
            Specify your target Company and Role to unlock company-specific FAQs, core technical concepts, personalized study roadmaps, interactive mock interviewers, and downloadable PDF revision guides! (JD PDF upload is optional).
          </p>
        </div>

        {/* Setup Form */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">1. Configure Target Role & Company (JD Upload Optional 📄)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon, Microsoft, Meta"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Target Role / Position *</label>
              <input
                type="text"
                placeholder="e.g. Full Stack Engineer, Backend Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Entry-Level">Entry-Level / Graduate</option>
                <option value="Mid-Level">Mid-Level (2-5 yrs)</option>
                <option value="Senior">Senior / Staff Lead</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-400 mb-1">Interview Rounds (comma separated)</label>
            <input
              type="text"
              value={roundsInput}
              onChange={(e) => setRoundsInput(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* JD Upload or Text input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-purple-400 mb-1">📄 Upload Job Description PDF (Optional)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Or Paste JD Text (Optional)</label>
              <textarea
                rows={2}
                placeholder="Paste job description text here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mb-6 flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">💡 Note:</span> Uploading a JD is optional. If left empty, AI will generate company-specific FAQs, core technical concepts, study roadmaps, and mock interview questions based on Company Name and Target Role.
          </p>

          <button
            onClick={handleJDUpload}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition shadow cursor-pointer"
          >
            {loading ? "Generating Company-Specific Interview Suite..." : "⚡ Generate Company-Specific FAQs, Core Concepts & Interview Suite"}
          </button>
        </div>

        {/* Extracted JD Telemetry Card */}
        {extractedAnalysis && (
          <div className="bg-gray-900 border border-purple-500/30 p-6 rounded-2xl mb-8 shadow-xl">
            <h3 className="text-base font-bold text-purple-300 mb-3 flex items-center justify-between">
              <span>🎯 Extracted Job Description Telemetry</span>
              <span className="text-xs px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-semibold">{extractedAnalysis.experienceLevel}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                <span className="font-bold text-indigo-400 block mb-1">Languages & Frameworks</span>
                <p className="text-gray-300">{[...(extractedAnalysis.programmingLanguages || []), ...(extractedAnalysis.frameworks || [])].join(", ") || "General"}</p>
              </div>
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                <span className="font-bold text-amber-400 block mb-1">Databases & Cloud</span>
                <p className="text-gray-300">{[...(extractedAnalysis.databases || []), ...(extractedAnalysis.cloudAndDevOps || [])].join(", ") || "Standard"}</p>
              </div>
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                <span className="font-bold text-emerald-400 block mb-1">DSA & System Design</span>
                <p className="text-gray-300">{[...(extractedAnalysis.dsaExpectations || []), ...(extractedAnalysis.systemDesignExpectations || [])].join(", ") || "Algorithmic Practice"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {roadmap && (
          <div>
            <div className="flex border-b border-gray-800 mb-6 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("roadmap")}
                className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === "roadmap" ? "bg-purple-600 text-white shadow" : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                🗺 Roadmap
              </button>
              <button
                onClick={() => setActiveTab("faqs")}
                className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === "faqs" ? "bg-purple-600 text-white shadow" : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                ❓ Frequently Asked Questions
              </button>
              <button
                onClick={() => setActiveTab("concepts")}
                className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === "concepts" ? "bg-purple-600 text-white shadow" : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                💡 Core Concepts
              </button>
              <button
                onClick={() => setActiveTab("mock")}
                className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === "mock" ? "bg-purple-600 text-white shadow" : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                🎙 AI Mock Interviewer
              </button>
              <button
                onClick={() => setActiveTab("revision")}
                className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === "revision" ? "bg-purple-600 text-white shadow" : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                📄 PDF Revision
              </button>
            </div>

            {/* TAB 1: ROADMAP */}
            {activeTab === "roadmap" && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-2">{roadmap.company} — {roadmap.role} Study Roadmap</h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-6">{roadmap.overview}</p>

                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">Preparation Phases</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {roadmap.phases && roadmap.phases.map((phase: any, idx: number) => (
                      <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                        <h5 className="font-bold text-sm text-purple-300 mb-2">{phase.phaseName}</h5>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {phase.focusTopics && phase.focusTopics.map((t: string, i: number) => (
                            <span key={i} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400"><strong className="text-indigo-400">Practice:</strong> {phase.recommendedPractice}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Interview Round Breakdown</h4>
                  <div className="space-y-3">
                    {roadmap.roundBreakdowns && roadmap.roundBreakdowns.map((round: any, idx: number) => (
                      <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-sm text-emerald-300">{round.roundName}</h5>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">Round {idx + 1}</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-2"><strong>Strategy Tip:</strong> {round.strategyTip}</p>
                        {round.potentialQuestions && (
                          <div className="text-xs text-gray-400">
                            <strong>Potential Questions:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              {round.potentialQuestions.map((q: string, i: number) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FREQUENTLY ASKED QUESTIONS */}
            {activeTab === "faqs" && (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">❓ Frequently Asked Questions for {roadmap.company} ({roadmap.role})</h3>
                <p className="text-xs text-gray-400 mb-4">Top technical and system design questions asked in real interviews at {roadmap.company}:</p>
                <div className="space-y-4">
                  {roadmap.faqs && roadmap.faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="bg-gray-950 p-5 rounded-xl border border-gray-800">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-yellow-300">Q{idx + 1}: {faq.question}</h4>
                        {faq.importance && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold">{faq.importance} Priority</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed bg-gray-900 p-3 rounded-lg border border-gray-800/80">
                        <strong className="text-indigo-400 block mb-1">Answer Guidance & Key Concepts:</strong>
                        {faq.answerGuidance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CORE TECHNICAL CONCEPTS */}
            {activeTab === "concepts" && (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">💡 Core Technical Concepts to Master</h3>
                <p className="text-xs text-gray-400 mb-4">Essential fundamentals and architectural patterns for {roadmap.role} candidates:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadmap.coreConcepts && roadmap.coreConcepts.map((concept: any, idx: number) => (
                    <div key={idx} className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-indigo-300 mb-2">{concept.title}</h4>
                        <p className="text-xs text-gray-300 leading-relaxed mb-3">{concept.explanation}</p>
                      </div>
                      <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 text-xs text-indigo-200">
                        <strong className="text-indigo-400">Key Takeaway:</strong> {concept.keyTakeaway}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE MOCK INTERVIEWER CHATBOT */}
            {activeTab === "mock" && (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col h-[600px]">
                <h3 className="text-base font-bold text-white mb-2 flex items-center justify-between">
                  <span>🎙 Interactive AI Technical Interviewer</span>
                  <span className="text-xs text-purple-400 font-mono">Role: {role} @ {company}</span>
                </h3>

                {/* Chat History Messages */}
                <div className="flex-grow overflow-y-auto space-y-4 p-4 bg-gray-950 rounded-xl border border-gray-800 mb-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                      <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-gray-900 border border-purple-500/30 text-gray-200 rounded-bl-none"
                      }`}>
                        <div className="font-bold text-[10px] text-purple-400 mb-1">
                          {msg.sender === "user" ? "You" : "AI Technical Interviewer"}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* AI Feedback card on user answers */}
                        {msg.feedback && (
                          <div className="mt-3 pt-3 border-t border-purple-500/20 text-[11px] text-purple-200 space-y-1">
                            <span className="font-bold text-amber-300">Evaluation: {msg.feedback.correctness} Correctness</span>
                            <p className="text-gray-300">{msg.feedback.feedback}</p>
                            {msg.feedback.suggestions && (
                              <ul className="list-disc list-inside text-gray-400 mt-1">
                                {msg.feedback.suggestions.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="text-xs text-purple-400 font-mono italic">AI Interviewer is analyzing your response...</div>}
                </div>

                {/* Response Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatResponse()}
                    className="flex-grow bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleSendChatResponse}
                    disabled={chatLoading}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    Submit Answer
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: LAST-MINUTE REVISION & DOWNLOADABLE PDF */}
            {activeTab === "revision" && (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">📄 Last-Minute Revision Document</h3>
                    <p className="text-xs text-gray-400">Concise revision summary tailored for {company} — {role}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateLastMinuteDoc}
                      disabled={docLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                    >
                      {docLoading ? "Generating..." : "⚡ Generate Revision Summary"}
                    </button>

                    {lastMinuteDoc && prepId && (
                      <a
                        href={`${backendIp}/api/interview/download-pdf/${prepId}`}
                        download
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
                      >
                        <span>📥 Download PDF Report</span>
                      </a>
                    )}
                  </div>
                </div>

                {lastMinuteDoc && (
                  <div className="space-y-6 pt-4 border-t border-gray-800 text-xs">
                    {/* Must-Know Concepts */}
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <h4 className="font-bold text-sm text-indigo-400 mb-2">1. Must-Know Concepts</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {lastMinuteDoc.mustKnowConcepts && lastMinuteDoc.mustKnowConcepts.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Algorithmic Patterns */}
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <h4 className="font-bold text-sm text-purple-400 mb-2">2. Key Algorithmic Patterns</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {lastMinuteDoc.dsaPatterns && lastMinuteDoc.dsaPatterns.map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Technical QnA */}
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <h4 className="font-bold text-sm text-emerald-400 mb-2">3. High-Yield Technical Q&A</h4>
                      <div className="space-y-3">
                        {lastMinuteDoc.keyTechnicalQnA && lastMinuteDoc.keyTechnicalQnA.map((qna: any, i: number) => (
                          <div key={i} className="border-b border-gray-800 pb-2">
                            <span className="font-bold text-gray-200">Q{i + 1}: {qna.question}</span>
                            <p className="text-gray-400 mt-0.5">{qna.answerSummary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Checklist */}
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <h4 className="font-bold text-sm text-amber-400 mb-2">4. Final Interview Checklist</h4>
                      <div className="space-y-1.5 text-gray-300">
                        {lastMinuteDoc.finalChecklist && lastMinuteDoc.finalChecklist.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

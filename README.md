# ⚡ FIASCOde — Online Judge & Autonomous Agentic AI Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic%20AI-orange.svg)](https://langchain-ai.github.io/langgraphjs/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Standardized%20Tools-purple.svg)](https://modelcontextprotocol.io/)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed%20Execution-2496ED.svg)](https://www.docker.com/)

**FIASCOde** is a high-performance, full-stack Competitive Programming & Online Judge platform equipped with a production-grade **Autonomous Agentic AI Suite** built on **LangGraph State Graphs**, **Model Context Protocol (MCP)**, **Docker Sandboxing**, and **React 18 + TypeScript**.

In addition to standard algorithmic problem solving and custom contests, FIASCOde introduces:
1. **Autonomous Code Debugging Agent**: An iterative, hypothesis-driven agent that isolates bugs, executes minimal synthetic test runs in sandboxed Docker containers, and synthesizes validated candidate patches with unified diffs.
2. **AI Contest Master Agent**: A continuous telemetry-monitoring agent that detects contest health anomalies, solve-rate bottlenecks, and difficulty spikes, offering **Human-in-the-Loop (HITL)** recommendations for contest administrators.
3. **Intentional Error Contest Mode**: Reverse-debugging challenges where developers insert language-specific bugs within strict boundary constraints.

---

## 📑 Table of Contents

- [✨ Core Platform Features](#-core-platform-features)
- [🤖 Production-Grade Agentic AI Architecture](#-production-grade-agentic-ai-architecture)
  - [1. Autonomous Debugging Agent (LangGraph)](#1-autonomous-debugging-agent-langgraph)
  - [2. AI Contest Master Agent (HITL)](#2-ai-contest-master-agent-hitl)
  - [3. Model Context Protocol (MCP) Tool Suite](#3-model-context-protocol-mcp-tool-suite)
  - [4. Resilient Multi-Provider LLM Engine & Fallback](#4-resilient-multi-provider-llm-engine--fallback)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Project Directory Layout](#-project-directory-layout)
- [⚙️ Getting Started](#️-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Installation](#1-installation)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Run the Docker Compiler Sandbox](#3-run-the-docker-compiler-sandbox)
  - [4. Start Backend & Frontend Servers](#4-start-backend--frontend-servers)
- [📡 Comprehensive API Reference](#-comprehensive-api-reference)
  - [Agentic AI Suite (`/api/agents`)](#agentic-ai-suite-apiagents)
  - [AI Assistance & Hints (`/api/ai`)](#ai-assistance--hints-apiai)
  - [Compiler & Runner (`/api/compiler`)](#compiler--runner-apicompiler)
  - [Authentication & Sessions (`/api/auth`)](#authentication--sessions-apiauth)
  - [Problems, Contests & Submissions](#problems-contests--submissions)
- [🛡️ Security, Sandboxing & Guardrails](#️-security-sandboxing--guardrails)
- [📜 License](#-license)

---

## ✨ Core Platform Features

- 🚀 **Isolated Multi-Language Execution**: High-throughput execution sandbox supporting **Python 3**, **C++ (G++ 13/14)**, and **Java 21 (OpenJDK)** running in isolated Alpine Linux Docker containers with strict CPU/memory limits.
- 🔐 **Secure JWT & Session Management**: 1-hour HTTP-Only cookie sessions, role-based access control (`user` vs `admin`), CSRF/CORS protection, and instant revocation.
- 🎯 **Dual Contest Framework**:
  - **Standard Algorithm Contests**: Real-time evaluation against sample and hidden multi-case test suites.
  - **FIASCOde Bug Injection Contests**: Competitive error-injection challenges constrained by exact character, line, and syntax boundary limits.
- 👑 **Admin Command Center**:
  - Full CRUD operations for problems, testcases, time limits, and score values.
  - Contest management (start/end windows, passwords, durations, problem sets).
  - Global AI Feature Toggle for real-time control over AI hint & debug availability.
  - Integrated **AI Control Center** for reviewing recommendations, audit trails, and agent telemetry.
- 📊 **Real-time Leaderboard & Submissions**: Fast leaderboard computations with pass-rates, execution timings, and submission history.

---

## 🤖 Production-Grade Agentic AI Architecture

FIASCOde's agentic layer is architected on **LangGraph State Graphs**, decoupling reasoning from execution tools via the **Model Context Protocol (MCP)**.

```
                                  ┌─────────────────────────────────────────┐
                                  │           FIASCOde React Client         │
                                  └───────────────┬─────────────────────────┘
                                                  │ REST API
                                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Express Backend API Layer                                      │
├─────────────────────────────────────────┬─────────────────────────────────────────────────────────┤
│    Autonomous Debugging Agent Graph     │              AI Contest Master Agent Graph              │
│  ┌───────────────────────────────────┐  │  ┌───────────────────────────────────────────────────┐  │
│  │ START ➔ Load Context              │  │  │ START ➔ Load Contest Context                      │  │
│  │   ▼                               │  │  │   ▼                                               │  │
│  │ Analyze Failure Pattern           │  │  │ Collect Metrics & Submissions                     │  │
│  │   ▼                               │  │  │   ▼                                               │  │
│  │ Generate Hypothesis               │  │  │ Detect Anomalies & Compute Health Status          │  │
│  │   ▼                               │  │  │   ▼                                               │  │
│  │ Execute Minimal Diagnostic (MCP)  │  │  │ Generate Admin Recommendations (Pending Status)   │  │
│  │   ▼                               │  │  │   ▼                                               │  │
│  │ Evaluate Evidence                 │  │  │ Persist Action to Immutable AgentAuditLog ➔ END   │  │
│  │   ├─ [Unconfirmed & iters < 5] ───┘  │  └───────────────────────────────────────────────────┘  │
│  │   └─ [Confirmed / Max Iterations]    │                                                         │
│  │        ▼                             │                     Human-in-the-Loop                   │
│  │ Generate Candidate Fix & Validate    │                 (Admin Review & Execution)              │
│  │   ▼                               │  │                              │                          │
│  │ Finalize Diagnosis & Diff ➔ END   │  │                              ▼                          │
│  └───────────────────────────────────┘  │               [ Approve / Reject Action ]               │
├─────────────────────────────────────────┴─────────────────────────────────────────────────────────┤
│                                Model Context Protocol (MCP) Server                                │
│   get_problem  •  get_submission  •  run_code  •  get_contest_statistics  •  create_recommendation    │
└───────────────────────────┬───────────────────────────────────────────┬───────────────────────────┘
                            │                                           │
                            ▼                                           ▼
             ┌─────────────────────────────┐             ┌─────────────────────────────┐
             │      MongoDB Database       │             │ Docker Container Execution  │
             │ (Submissions, Audits, Recs) │             │ (G++, Python3, OpenJDK 21)  │
             └─────────────────────────────┘             └─────────────────────────────┘
```

---

### 1. Autonomous Debugging Agent (LangGraph)

The Debugging Agent (`backend/agents/debugging/debuggingGraph.js`) autonomously diagnoses failed user submissions through a closed-loop scientific method:

1. **`loadContext`**: Fetches user code, submission verdicts, error traces, and problem descriptions via MCP.
2. **`analyzeFailure`**: Classifies failure category (`Logical Bug`, `Compilation Error`, `Runtime Exception`, `Time Limit Exceeded`, `Wrong Answer`).
3. **`generateHypothesis`**: Formulates a precise root-cause hypothesis and devises a minimal synthetic testcase input to reproduce the bug.
4. **`runDiagnostic`**: Dispatches the synthetic testcase to the Docker execution sandbox via MCP `run_code`.
5. **`evaluateEvidence`**: Assesses actual execution outputs against expected behavior:
   - If unconfirmed and under 5 iterations: loops back to formulate an alternative hypothesis.
   - If confirmed or maximum iterations reached: advances to solution synthesis.
6. **`generateFixAndValidate`**: Synthesizes the minimal corrected code, validates the fix in the Docker sandbox, and generates a structured explanation.
7. **`finalizeDiagnosis`**: Compiles the comprehensive diagnostic payload, root cause breakdown, and unified diff.

#### 🖥️ Frontend Debugging UI (`DebuggingModal.tsx`)
- **Diagnosis View**: Root cause summary, confidence metrics, and fix suggestions.
- **Hypothesis Timeline**: Step-by-step visual audit of every tested hypothesis and diagnostic execution run.
- **Unified Code Diff**: Side-by-side / unified code diff comparison with 1-click **"Apply Fix to Editor"** and clipboard copy.

---

### 2. AI Contest Master Agent (HITL)

The Contest Master Agent (`backend/agents/contestMaster/contestMasterGraph.js`) continuously audits active contests for structural anomalies:

- **Telemetry Analysis**: Scans aggregate solve rates, submission retry distributions, runtime exception clustering, and leaderboard velocity.
- **Anomaly Detection**: Flags problem description ambiguity, extreme difficulty spikes, or widespread syntax failures.
- **Human-in-the-Loop (HITL) Governance**: All proposed interventions (`problem_issue`, `difficulty_anomaly`, `hint_recommendation`, `time_limit_adjustment`) are created in a `pending` state. **No contest changes are applied without explicit administrator review and approval.**
- **Immutable Audit Trail**: Every analysis execution, recommendation generation, approval, or rejection is logged with cryptographic timestamps in `AgentAuditLog`.

---

### 3. Model Context Protocol (MCP) Tool Suite

FIASCOde implements a standardized Model Context Protocol (MCP) tool registry (`backend/agents/mcp/server.js`) that enforces least-privilege tool execution:

| MCP Tool Name | Domain | Description | Security Guardrails |
| :--- | :--- | :--- | :--- |
| `get_problem` | Problem | Retrieves sanitized problem description and public testcases. | **Hidden testcases are strictly masked** from agents. |
| `get_submission` | Submission | Fetches submission metadata, language, and user source code. | Ownership verification prevents cross-user leaks. |
| `get_submission_test_results` | Submission | Retrieves telemetry and stderr output of failed runs. | Redacts internal server paths. |
| `get_submission_history` | Submission | Retrieves chronological submission history for a problem. | Capped at last 10 submissions. |
| `run_code` | Compiler | Executes arbitrary code with custom stdin in Docker sandbox. | Enforces 6000ms hard timeout and 5000 character output cap. |
| `get_contest` | Contest | Retrieves contest metadata, time boundaries, and problem list. | Masked access passwords. |
| `get_contest_statistics` | Contest | Computes aggregate solve rates, total attempts, and active users. | Read-only analytics aggregation. |
| `get_problem_statistics` | Contest | Computes per-problem submission verdicts and failure patterns. | Aggregated metrics only. |
| `get_recent_submissions` | Contest | Fetches recent submissions across all participants in a contest. | Masked private participant IDs. |
| `create_admin_recommendation` | Contest Master | Persists structured anomaly recommendations for admin review. | Enforces `pending` status by default. |
| `get_leaderboard` | Leaderboard | Retrieves real-time calculated leaderboard rankings. | Read-only query. |

---

### 4. Resilient Multi-Provider LLM Engine & Fallback

The LLM abstraction layer (`backend/agents/shared/llm.js`) guarantees 100% uptime with zero runtime downtime:

- **Primary Providers**: Built-in support for **OpenAI** (`gpt-4o-mini`, `gpt-4o`) and **Google Gemini** (`gemini-3.6-flash`, `gemini-1.5-pro`).
- **Resilient Fallback Engine**: If API keys are unconfigured, rate-limited, or network-blocked, the system automatically and transparently switches to the **Deterministic Heuristic Mock Engine** (`FallbackMockLLM`), ensuring all debugging sessions and contest analyses proceed smoothly without crashing.
- **Sensitive Data Redaction**: `AGENT_CONFIG.log` automatically scrubs API keys, JWT secrets, and authentication headers from execution telemetry.

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Agentic Framework** | LangGraph (`@langchain/langgraph`), LangChain (`@langchain/core`, `@langchain/openai`, `@langchain/google-genai`) |
| **Agent Protocols** | Model Context Protocol (MCP) Tool Registry, JSON Schema Validation |
| **Frontend Client** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, React Datepicker |
| **Backend REST API** | Node.js (ESM), Express.js, Mongoose, JSON Web Tokens (JWT), BcryptJS, Cookie Parser, UUID |
| **Database** | MongoDB Compass / MongoDB Atlas |
| **Isolated Sandbox** | Docker Desktop, Alpine Linux (`g++ 13/14`, `python 3.11+`, `openjdk 21-jdk`) |

---

## 🏗 Project Directory Layout

```
Online_Judge/
├── backend/
│   ├── agents/                     # 🤖 Production Agentic AI Suite
│   │   ├── debugging/              # Autonomous Debugging Agent
│   │   │   ├── debuggingGraph.js   # LangGraph 6-Node State Machine
│   │   │   ├── debuggingPrompts.js # Hypothesis & Diagnostic Prompts
│   │   │   └── debuggingState.js   # State Annotation & Channels
│   │   ├── contestMaster/          # AI Contest Master Agent
│   │   │   ├── contestMasterGraph.js # LangGraph 5-Node Telemetry Graph
│   │   │   ├── contestMasterPrompts.js # Anomaly Detection Prompts
│   │   │   └── contestMasterState.js # Health & Anomaly State Annotation
│   │   ├── mcp/                    # Model Context Protocol (MCP) Server
│   │   │   ├── server.js           # Tool Registry & Dispatcher
│   │   │   └── tools/              # Standardized MCP Tool Definitions
│   │   │       ├── compilerTools.js
│   │   │       ├── contestTools.js
│   │   │       ├── leaderboardTools.js
│   │   │       ├── problemTools.js
│   │   │       └── submissionTools.js
│   │   ├── services/
│   │   │   └── agentService.js     # Agent Invocation, State Persistence & Audit
│   │   └── shared/
│   │       ├── agentConfig.js      # Limits, Timeouts & Log Redaction
│   │       └── llm.js              # Multi-Provider (OpenAI/Gemini) + Resilient Mock
│   ├── controllers/                # REST Controllers
│   ├── middleware/                 # Auth & Role-Based Access Control
│   ├── models/                     # Mongoose Schemas (User, Problem, Contest,
│   │                               # Submission, AgentSession, AgentRecommendation, AgentAuditLog)
│   ├── routes/                     # Express Routes (agents, ai, auth, compiler, etc.)
│   └── server.js                   # Main Server Entry Point (Port 5174)
├── compiler/                       # 🐳 Isolated Code Execution Sandbox
│   ├── Dockerfile                  # Alpine Linux + G++, Python3, OpenJDK 21
│   ├── executeCpp.js               # C++ Execution Handler
│   ├── executeJava.js              # Java Execution Handler
│   ├── executePy.js                # Python Execution Handler
│   └── index.js                    # Compiler Service (Port 5175)
└── frontend/                       # ⚛️ React 18 + TypeScript + Vite Client
    ├── src/
    │   ├── api/                    # API Clients (agents, aiService, compiler, auth, etc.)
    │   ├── components/             # Reusable UI Components
    │   │   ├── DebuggingModal.tsx  # 🤖 Agent Diagnosis, Timeline & Unified Diff Modal
    │   │   ├── CodeEditorPage.tsx  # Monaco-Style Code Editor with AI Debug Trigger
    │   │   └── HeaderControls.tsx  # Navigation & Contest Timers
    │   └── pages/
    │       ├── AdminPage.tsx       # 🛠 Admin Command Center & AI Control Center
    │       ├── SubmissionsPage.tsx # Submission History with 1-Click AI Debug
    │       ├── ContestPage.tsx     # Active Contests & Challenges
    │       └── Leaderboard.tsx     # Live Standings
    └── vite.config.ts              # Vite Bundler Configuration
```

---

## ⚙️ Getting Started

### Prerequisites

Ensure the following are installed and running locally:
- **Node.js**: `v20.x` or higher
- **MongoDB**: Local instance running at `mongodb://127.0.0.1:27017/online_judge`
- **Docker Desktop**: Running locally for sandboxed code execution
- **Git**

---

### 1. Installation

```bash
# 1. Clone the repository
git clone https://github.com/VIGNESHWARRAN/Online_Judge.git
cd Online_Judge

# 2. Install Backend Dependencies
cd backend
npm install

# 3. Install Frontend Dependencies
cd ../frontend
npm install

# 4. Install Compiler Dependencies
cd ../compiler
npm install
```

---

### 2. Environment Configuration

#### `backend/.env`
```env
PORT=5174
MONGO_URI=mongodb://127.0.0.1:27017/online_judge
SESSION_SECRET=FIASCOde_jwt_secret_key
JWT_SECRET=FIASCOde_jwt_secret_key
COMPILER_IP=http://localhost:5175
FRONTEND_IP=http://localhost:5173
BACKEND_IP=http://localhost:5174

# AI Configuration (Optional: Resilient fallback engine will operate if keys are unset)
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

#### `frontend/.env`
```env
VITE_BACKEND_IP=http://localhost:5174
PORT=5173
```

---

### 3. Run the Docker Compiler Sandbox

Build and run the execution sandbox container:

```bash
cd compiler

# Build the container image
docker build -t online-judge-compiler .

# Start the container on port 5175 with host network gateway access
docker run -d --name online-judge-compiler -p 5175:5175 --add-host=host.docker.internal:host-gateway online-judge-compiler
```

Verify compiler logs:
```bash
docker logs -f online-judge-compiler
```

---

### 4. Start Backend & Frontend Servers

#### Start Backend API (`http://localhost:5174`):
```bash
cd backend
npm start
```

#### Start Frontend Client (`http://localhost:5173`):
```bash
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

---

## 📡 Comprehensive API Reference

### Agentic AI Suite (`/api/agents`)

All routes require active JWT authentication (`authenticateToken`). Admin routes require `requireAdmin`.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/agents/debug` | User / Admin | Launches autonomous LangGraph debugging session for a submission or code snippet. |
| `GET` | `/api/agents/debug/:sessionId` | User / Admin | Retrieves diagnostic report, hypothesis iterations, and candidate diff. |
| `GET` | `/api/agents/sessions` | Admin | Fetches telemetry and history of recent debugging sessions. |
| `POST` | `/api/agents/contest/:contestId/analyze` | Admin | Triggers AI Contest Master anomaly detection and health assessment. |
| `GET` | `/api/agents/contest/:contestId/recommendations` | Admin | Fetches all pending and historical recommendations for a contest. |
| `POST` | `/api/agents/recommendations/:id/approve` | Admin | **HITL**: Approves and executes a recommendation, logging to audit trail. |
| `POST` | `/api/agents/recommendations/:id/reject` | Admin | **HITL**: Rejects recommendation with explanatory feedback. |
| `GET` | `/api/agents/audit` | Admin | Retrieves immutable audit trail of agent operations and administrative actions. |

---

### AI Assistance & Hints (`/api/ai`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ai/enabled` | Public | Returns global boolean status of AI Assistance features. |
| `POST` | `/api/ai/enabled` | Admin | Globally enables or disables AI Assistance features across the platform. |
| `POST` | `/api/ai/generate-hint` | User / Admin | Generates minimal non-spoiler hints for algorithmic problems. |

---

### Compiler & Runner (`/api/compiler`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/compiler/run` | Public / User | Runs code with custom stdin in sandboxed Docker environment. |
| `POST` | `/api/compiler/submit` | Authenticated | Evaluates code against full testsuite, computes verdict, and saves submission. |

---

### Authentication & Sessions (`/api/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new account (`user` or `admin` role). |
| `POST` | `/api/auth/login` | Authenticate credentials and receive 1-hour HTTP-Only JWT cookie. |
| `GET` | `/api/auth/me` | Validate session token and return user identity. |
| `POST` | `/api/auth/logout` | Invalidate and clear session cookie. |

---

### Problems, Contests & Submissions

- `GET /api/problems` & `POST /api/problems` — Fetch problem list or create new challenge definition.
- `GET /api/contests` & `POST /api/contests` — Manage contest schedules, passkeys, and assigned problem sets.
- `GET /api/submissions` — Fetch submission history and verdict breakdowns.
- `GET /api/contests/:id/leaderboard` — Real-time contest standings.

---

## 📑 Full Stack Development — Project Report & Academic Documentation

A comprehensive **25–30 Page Full Stack Development Project Report** adhering strictly to the university syllabus and academic format has been compiled:

- **📄 Word Document Report**: [`FULL_STACK_DEVELOPMENT_PROJECT_REPORT.docx`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/FULL_STACK_DEVELOPMENT_PROJECT_REPORT.docx)
- **📊 10-Paper Literature Survey**: Cites and compares 10 foundational contributions (*Le et al., Kurnia et al., Goues et al., Wu et al., Xia et al., Wasylkowski et al., Chen et al., Anthropic MCP, LangGraph, Caiza et al.*) with summary matrix.
- **📐 Architecture Specification**: Decoupled multi-tier flow (*User ➔ LangGraph Agent Suite ➔ React 18 Frontend ➔ Express API Gateway ➔ MongoDB & Docker Compiler*).

### 🖥️ 8 Core Platform UI Views (Captured from Running Platform)

| # | View / Feature | Description | Artifact Reference |
| :-: | :--- | :--- | :--- |
| **1** | **Landing Page** | Platform hero section, navigation bar, quick stats, and feature cards | [`shot_1_landing_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_1_landing_page.png) |
| **2** | **Problems Catalog** | Filterable algorithmic problem set with tags, difficulty pills, and solve rates | [`shot_2_problems_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_2_problems_page.png) |
| **3** | **Compiler Workspace** | Dual-pane Monaco code editor with multi-language selector and run/submit controls | [`shot_3_compiler_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_3_compiler_page.png) |
| **4** | **Profile Dashboard** | User statistics, submission history, streak tracker, and **AI Weakness Analysis** | [`shot_4_profile_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_4_profile_page.png) |
| **5** | **Contests Hub** | Live and upcoming contest arena with time windows and registration | [`shot_5_contest_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_5_contest_page.png) |
| **6** | **Admin Command Center** | System oversight, problem CRUD, and real-time AI Assistance master toggle | [`shot_6_admin_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_6_admin_page.png) |
| **7** | **Contest Creation Form** | Administrative contest scheduler with duration, passkey, and AI problem generation | [`shot_7_contest_adding_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_7_contest_adding_page.png) |
| **8** | **Final Performance Report** | Detailed score breakdown, testcase execution telemetry, and interview prep | [`shot_8_final_page.png`](file:///d:/All%20Semesters/semester%207/FSD/Online_Judge/Online_Judge/report_assets/shot_8_final_page.png) |

---

## 🛡️ Security, Sandboxing & Guardrails

1. **Dockerized Process Isolation**:
   - Compilations and executions run within unprivileged Docker containers with restricted memory (256MB) and execution timeouts (6000ms).
2. **Hidden Testcase Protection**:
   - The MCP `get_problem` tool exposes only public sample testcases to agent graphs. Hidden validation testcases are withheld to preserve contest integrity.
3. **Strict Iteration Caps & Resource Controls**:
   - Debugging graph loops are strictly capped at `MAX_DEBUG_ITERATIONS = 5`.
   - Max tool calls per session capped at 20 calls.
4. **Credential & Secret Redaction**:
   - Centralized logging automatically redacts tokens, passwords, and private API keys before outputting telemetry.
5. **Human-in-the-Loop (HITL) Gatekeeping**:
   - AI recommendations for contest modifications cannot modify contest parameters directly; an authenticated administrator must explicitly verify and execute the action.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).


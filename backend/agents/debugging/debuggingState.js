import { Annotation } from '@langchain/langgraph';

/**
 * State Definition for the Autonomous Debugging Agent State Machine
 */
export const DebuggingStateAnnotation = Annotation.Root({
  sessionId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  submissionId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  problemId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  userId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  sourceCode: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  language: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "py"
  }),
  verdict: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  problemContext: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  submissionTelemetry: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  failureCategory: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "Logical Bug"
  }),
  hypotheses: Annotation({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => []
  }),
  currentHypothesis: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  diagnosticRuns: Annotation({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => []
  }),
  candidateFix: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  candidateFixValidated: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false
  }),
  validationSummary: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  iterationCount: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 0
  }),
  isConfirmed: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "running"
  }),
  finalDiagnosis: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  error: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  })
});

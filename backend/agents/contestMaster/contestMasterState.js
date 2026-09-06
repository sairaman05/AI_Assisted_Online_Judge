import { Annotation } from '@langchain/langgraph';

/**
 * State Definition for the AI Contest Master Agent State Machine
 */
export const ContestMasterStateAnnotation = Annotation.Root({
  sessionId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  contestId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  contestMetadata: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  contestStats: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  problemStats: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => []
  }),
  leaderboardStats: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  anomalies: Annotation({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => []
  }),
  contestHealth: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "healthy"
  }),
  recommendations: Annotation({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => []
  }),
  createdRecommendations: Annotation({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => []
  }),
  auditLogs: Annotation({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => []
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "running"
  }),
  error: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  })
});

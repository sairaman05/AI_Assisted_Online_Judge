// Shared agent configuration and security constants

export const AGENT_CONFIG = {
  // Limits
  MAX_DEBUG_ITERATIONS: 5,
  MAX_DIAGNOSTIC_EXECUTIONS: 5,
  MAX_AGENT_TOOL_CALLS: 20,
  MAX_SOURCE_CODE_LENGTH: 15000,
  MAX_DIAGNOSTIC_INPUT_LENGTH: 4000,
  MAX_OUTPUT_LENGTH: 5000,
  DOCKER_EXECUTION_TIMEOUT_MS: 6000,

  // LLM Settings
  DEFAULT_TEMPERATURE: 0.2,
  MAX_TOKENS: 1500,

  // Logging with secret redaction
  log: (agentType, context) => {
    const sanitized = { ...context };
    // Redact sensitive patterns if present
    const keysToRedact = ['apiKey', 'password', 'token', 'jwt', 'secret'];
    for (const key of Object.keys(sanitized)) {
      if (keysToRedact.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    console.log(`[Agent: ${agentType}]`, JSON.stringify(sanitized));
  }
};

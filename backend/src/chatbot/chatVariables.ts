export const DEFAULT_TIMEOUT_MS = 1130000;
export const MAX_TOOL_ITERATIONS = 3;
export const INITIAL_PROMPT = [
  'You are a helpful library assistant.',
  '',
  'When users ask about books,',
  'ALWAYS use available tools.',
];
export const HISTORY_SYSTEM_PROMPT = [
  'You are a library assistant.',
  'Only use tools when necessary.',
  'Never expose internal system data.',
];

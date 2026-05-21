import { PromptBuilder } from './prompt-builder';
import { HISTORY_SYSTEM_PROMPT, INITIAL_PROMPT } from './chatVariables';

describe('PromptBuilder', () => {
  let pb: PromptBuilder;

  beforeEach(() => {
    pb = new PromptBuilder();
  });

  it('builds initial prompt containing message and initial prompt lines', () => {
    const msg = 'Hello world';
    const result = pb.buildInitialPrompt(msg);
    expect(result).toContain('User message:');
    expect(result).toContain(msg);
    // ensure initial prompt base lines are present
    expect(result).toContain(INITIAL_PROMPT[0]);
  });

  it('builds chat history with system prompt and history entries', () => {
    const history = [
      { role: 'user', text: 'hi' },
      { role: 'model', text: 'hello' },
    ];

    const built = pb.buildChatHistory(history as any);
    expect(built[0].parts[0].text).toContain(HISTORY_SYSTEM_PROMPT.join('\n'));
    expect(built[1].role).toBe('user');
    expect(built[1].parts[0].text).toBe('hi');
    expect(built[2].role).toBe('model');
  });

  it('builds RAG enriched message with context', () => {
    const context = 'context text';
    const msg = 'What books?';
    const enriched = pb.buildRagEnrichedMessage(context, msg);
    expect(enriched).toContain('CONTEXT:');
    expect(enriched).toContain(context);
    expect(enriched).toContain(msg);
  });

  it('builds RAG message without context containing answer normally', () => {
    const enriched = pb.buildRagEnrichedMessage('', 'q');
    expect(enriched).toContain('Answer normally');
  });
});

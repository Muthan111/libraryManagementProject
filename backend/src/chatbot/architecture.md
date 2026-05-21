**Chatbot Architecture**

This document describes the architecture and business logic for the chatbot subsystem in `backend/src/chatbot`.

**Overview**:

- **Purpose**: Provide a library assistant conversational interface that can (1) perform retrieval-augmented generation (RAG) over indexed book content, and (2) call internal tools (BookService) when user queries demand explicit search or lookup.
- **Primary external dependencies**: Google Generative AI (`@google/generative-ai`) for embeddings and chat, Redis (`redisClient`) for both RAG vectors and conversation history, and the `BookService` for catalog lookups.

**Components**:

- **Controller**: `chatbot.controller.ts` — exposes a single POST `/chat` endpoint that accepts a `ChatRequestDto` and forwards the message (and optional conversationId) to the `ChatbotService`.

- **Service (Core)**: `chatbot.service.ts` — central orchestration layer. Responsibilities:
  - Create and start model chat sessions with history and configured tools.
  - Decide whether to use RAG or tools (`isToolQuery`) based on message content and length.
  - Send initial system prompts and conversation history to the model.
  - Two response generation flows:
    - RAG flow (`generateWithRAG`): query `RagService.search()` for top context snippets, enrich the prompt with context and ask the model to answer.
    - Tools flow (`generateWithTools`): send messages to model with declared tool schema (`toolsArg`), detect function calls from model responses, and run corresponding `BookService` functions. The loop allows up to `MAX_TOOL_ITERATIONS` to let the model call tools iteratively.
  - Manage timeouts for model/tool calls using `withTimeout` (configurable via `CHATBOT_TIMEOUT_MS`).

- **RAG (Retrieval)**: `rag.service.ts` — handles embedding, indexing, and search.
  - Embeddings: uses `gemini-embedding-001` to generate vector embeddings for text.
  - Indexing: `indexBook(bookId, content)` chunks long text into 500-char pieces, computes embeddings, and stores each chunk as a Redis key `rag:book:{bookId}:{i}` with JSON { text, vector }.
  - Search: `search(query)` embeds the query, scans Redis keys `rag:book:*`, computes cosine similarity (`cosine`), and returns the top 3 scored text snippets.

- **RAG Seeder**: `rag.seed.ts` — utility to bootstrap index by calling `BookService.findAll()` and indexing identifiable book content (bookCode, name, author, ISBN).

- **Conversation Store**: `chatbot-conversation.store.ts` — persistent chat history management in Redis.
  - Methods: `getOrCreateConversationId`, `loadHistory`, `appendTurn`.
  - Stores history as JSON under key `chat:conversation:{conversationId}` with a TTL (`CHAT_CONVERSATION_TTL_SECONDS`).
  - Limits history length to `CHAT_CONVERSATION_HISTORY_LIMIT` (default 20) to control prompt size.

- **Tool Schema & Types**: `toolCall.ts`, `helperType.ts` — declare the function/tool schema passed to the model and TypeScript types for function calls, message shapes, and session abstractions.
  - Tools: `findAllBooks`, `findBookByName`, `findBookByISBN`, `findBookByAuthor` — mapped to `BookService` methods in `ChatbotService.executeToolCall()`.

- **Static Variables**: `chatVariables.ts` — constants used across the service: `DEFAULT_TIMEOUT_MS`, `MAX_TOOL_ITERATIONS`, `INITIAL_PROMPT`, `HISTORY_SYSTEM_PROMPT`.

- **DTO**: `dto/chat-request.dto.ts` — request validation for the HTTP endpoint.

**High-level Data Flow**:

1. Client POSTs to `/chat` with `message` and optional `conversationId`.
2. `ChatbotController` calls `ChatbotService.handleMessage()`.
3. `ChatbotService` resolves conversation ID and loads recent history from `ChatbotConversationStore`.
4. A chat session is created using the Gemini generative model (`gemini-3-flash-preview`) and `toolsArg` schema is attached.
5. Initial prompt and history are sent to the model.
6. Decision layer: if `isToolQuery(message)` is true and message short, use tools flow; otherwise use RAG flow.

- Tools flow: the model may return a functionCall; the service maps that to `BookService` operation, constructs a function-response message and re-sends it to the model. Repeat up to `MAX_TOOL_ITERATIONS`.
- RAG flow: `RagService.search()` provides context snippets; the context is prepended to the user question and the model is asked to answer.

7. Final reply text is captured, stored in conversation history (appendTurn), and returned to the client along with conversationId.

**Redis Key Schema**:

- RAG vectors: `rag:book:{bookId}:{chunkIndex}` -> JSON { text, vector }
- Conversations: `chat:conversation:{conversationId}` -> JSON array of { role: 'user'|'model', text }

**Model & Tools Configuration**:

- Embedding model: `gemini-embedding-001`.
- Chat model: `gemini-3-flash-preview`.
- Tools: declared via `toolsArg` in `toolCall.ts`, forwarded to `getGenerativeModel(...).startChat({ history })`.

**Business Rules & Decision Points**:

- Use tools for explicit lookup queries detected by `isToolQuery()` (keywords like `isbn`, `author`, `find book`, etc.).
- Use RAG for general knowledge or conversational queries (or when message is long).
- Tool iterations bounded by `MAX_TOOL_ITERATIONS` to avoid endless tool-call loops.
- Conversation history is validated and trimmed to the configured limit to avoid overlong prompts.

**Environment & Configuration**:

- `GEMINI_API_KEY` — API key for Generative AI.
- `CHAT_CONVERSATION_HISTORY_LIMIT` — integer to limit stored turns (default 20).
- `CHAT_CONVERSATION_TTL_SECONDS` — TTL for conversation keys in Redis (default 24h).
- `CHATBOT_TIMEOUT_MS` — ms timeout for external model/tool calls (default `DEFAULT_TIMEOUT_MS`).

**Operational Notes & Suggestions**:

- Indexing currently stores raw chunked text and embeddings in Redis; consider storing metadata (bookId, chunk index, source) for better traceability and filtering by book.
- `RagService.search()` scans all `rag:book:*` keys — this is linear and may not scale; consider using a vector-index (e.g., Redisearch vector index) or an external vector DB for large corpora.
- Tool schema is limited to book lookups; if tools expand, ensure mapping in `executeToolCall()` is updated and tested.
- Add logging and metrics around tool calls, RAG searches, and timeouts to aid observability.

**Files Reviewed**:

- `chatbot.controller.ts`
- `chatbot.service.ts`
- `chatbot-conversation.store.ts`
- `rag.service.ts`
- `rag.seed.ts`
- `toolCall.ts`
- `helperType.ts`
- `chatVariables.ts`
- `dto/chat-request.dto.ts`

---

Generated from code inspection on the `feature` branch.

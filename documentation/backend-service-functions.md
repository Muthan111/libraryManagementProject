# Backend Service Function Analysis

Scope: `backend/src/**/*.service.ts`. Test files, compiled `dist` files, and generated artifacts are excluded.

## Service Files Found

- `backend/src/app.service.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/book/book.service.ts`
- `backend/src/borrow/borrow.service.ts`
- `backend/src/chatbot/chatbot.service.ts`
- `backend/src/chatbot/rag.service.ts`
- `backend/src/chatbot/timeout.service.ts`
- `backend/src/user/user.service.ts`

## `AppService`

Source: `backend/src/app.service.ts`

### `getHello()`

Explanation: Returns the static greeting used by the root application controller.

Output: A string: `"Hello World! from Backend"`.

## `AuthService`

Source: `backend/src/auth/auth.service.ts`

### `validateUser(email: string, password: string)`

Explanation: Looks up a user by email, compares the supplied password with the stored bcrypt hash, and records authentication metrics. If the user does not exist or the password is wrong, it throws `UnauthorizedException` with `"Invalid credentials"`. On success, it increments the active-users gauge.

Output: A sanitized authenticated-user object:

```ts
{
  id: number;
  email: string;
  role: Role;
}
```

On authentication failure, the method throws instead of returning `null`, even though its signature allows `Promise<AuthUser | null>`.

### `login(user: AuthUser)`

Explanation: Builds a JWT payload from the authenticated user's `id`, `email`, and `role`, signs it with Nest's `JwtService`, and returns it to the caller.

Output:

```ts
{
  access_token: string;
}
```

## `BookService`

Source: `backend/src/book/book.service.ts`

### `findAll(page = 1, limit = 10)`

Explanation: Fetches books using pagination. It normalizes `page` to at least `1` and clamps `limit` between `1` and `100`. It increments the book fetch metric and increments the HTTP error metric if the repository call fails.

Output:

```ts
{
  data: Book[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### `create(bookData: CreateBookDto)`

Explanation: Creates a new book inside a database transaction. It checks for an existing book with the same `ISBN`, throws `ConflictException` if found, generates a `bookCode` using `generateCode('BK-XXXX-####')`, and saves the new entity. It also maps MySQL duplicate-key errors to `ConflictException`.

Output: The saved `Book` entity, including generated fields such as `bookid` and `bookCode`. Throws `ConflictException` when the ISBN already exists.

### `update(bookCode: string, bookData: UpdateBookDto)`

Explanation: Builds an update payload from provided `name`, `Author`, and `ISBN` fields, then updates the book with the matching `bookCode`. If no update fields are supplied, it returns the current lookup result. If no row is affected, it throws `NotFoundException`. Duplicate-key database errors are converted to `ConflictException`.

Output: The updated `Book` entity returned by `findOne({ bookCode })`, or `null` if no fields are provided and the initial lookup finds nothing. Throws when the update target is not found or violates uniqueness.

### `delete(bookid: number)`

Explanation: Deletes a book by numeric `bookid`. If no row is deleted, it throws `NotFoundException`.

Output:

```ts
{
  message: string;
}
```

The message is `"Book with id ${bookid} deleted successfully"`.

### `findBookByName(name: string)`

Explanation: Finds the first book whose `name` exactly matches the supplied value. If the repository operation itself fails, it throws `NotFoundException` with `"Error finding book by name"`.

Output: A `Book` entity or `null` when no matching book exists.

### `findBookByISBN(ISBN: string)`

Explanation: Finds the first book whose `ISBN` exactly matches the supplied value. If the repository operation itself fails, it throws `NotFoundException` with `"Error finding book by ISBN"`.

Output: A `Book` entity or `null` when no matching book exists.

### `findBookByAuthor(author: string)`

Explanation: Finds the first book whose `Author` exactly matches the supplied value. If the repository operation itself fails, it throws `NotFoundException` with `"Error finding book by author"`.

Output: A `Book` entity or `null` when no matching book exists.

## `BorrowService`

Source: `backend/src/borrow/borrow.service.ts`

### `borrowBook(dto: BorrowBookDto)`

Explanation: Creates a borrow record after validating the requested user and book. It looks up the user by `customerCode`, looks up the book by `bookCode`, checks that the book is not already actively borrowed, then saves a new `BorrowRecord` with status `BORROWED` and the supplied due date. It throws `NotFoundException` for missing users/books and `BadRequestException` when the book is already borrowed.

Output: The saved `BorrowRecord` entity with `user`, `book`, `dueDate`, and `status`.

### `returnBook(borrowId: number)`

Explanation: Finds a borrow record by id with related `book` and `user`. It throws `NotFoundException` if the borrow record does not exist and `BadRequestException` if it was already returned. Otherwise, it sets `status` to `RETURNED`, sets `returnDate` to the current date, and saves the record.

Output: The updated `BorrowRecord` entity.

### `getUserBorrows(userId: string)`

Explanation: Fetches all borrow records for a user by matching `user.customerCode`. It includes the related book and orders records by `borrowDate` descending.

Output: An array of `BorrowRecord` entities with the `book` relation loaded.

### `getAllActiveBorrows()`

Explanation: Fetches every borrow record whose status is `BORROWED`, including both related `user` and `book`.

Output: An array of active `BorrowRecord` entities with `user` and `book` relations loaded.

## `ChatbotService`

Source: `backend/src/chatbot/chatbot.service.ts`

### `generateWithRAG(chat: ChatSession, message: string)`

Explanation: Searches the RAG index using the message, joins the top result texts into context, builds an enriched prompt, sends it to the chat model with a timeout, logs the RAG results, and returns the model response text.

Output: A string containing the model-generated reply.

### `generateWithTools(chat: ChatSession, message: string)`

Explanation: Sends a message to the chat model and checks whether the model requested a tool call. If there is no tool call, it returns the model text. If there is a tool call, it runs the tool through `ToolExecutor`, sends the function-response message back into the chat, and repeats until a final response is produced or `MAX_TOOL_ITERATIONS` is reached.

Output: A string containing the final model response. If no final response is produced after the maximum tool iterations, returns `"No final response generated."`.

### `handleMessage(message: string, conversationId?: string)`

Explanation: Main chatbot entry point. It increments request metrics, starts duration and system metric tracking, resolves or creates a conversation id, loads conversation history, creates a chat session, sends the initial prompt, generates a reply using either tools or RAG, appends the turn to conversation storage, and records CPU/memory metrics in a `finally` block.

Output:

```ts
{
  reply: string;
  conversationId: string;
}
```

### `createChatSession(history: ConversationHistoryEntry[])`

Explanation: Converts stored conversation history into Gemini chat history format using `PromptBuilder`, then creates a chat session through `ChatSessionFactory`.

Output: A `ChatSession` instance.

### `sendInitialPrompt(chat: ChatSession, message: string)`

Explanation: Builds the initial system/user prompt and sends it to the chat model with the configured timeout.

Output: `void` on success. Throws if the model call fails or exceeds the timeout.

### `generateReply(chat: ChatSession, message: string)`

Explanation: Chooses the response strategy. If `RoutingPolicy.isToolQuery(message)` is true and the message is shorter than 80 characters, it uses tool calling. Otherwise, it uses RAG.

Output: A string reply generated by either `generateWithTools` or `generateWithRAG`.

### `extractToolCall(response: ModelResponse)`

Explanation: Inspects the first candidate response and returns the first `functionCall` part if present.

Output: A `ToolCall` object or `null`.

### `resolveTimeoutMs()`

Explanation: Reads `CHATBOT_TIMEOUT_MS` from the environment. If it is a finite positive number, that value is used; otherwise the service falls back to `DEFAULT_TIMEOUT_MS`.

Output: A number representing the timeout in milliseconds.

### `recordSystemMetrics(startCpuUsage: NodeJS.CpuUsage, startTime: bigint)`

Explanation: Calculates elapsed time and CPU usage since the request started, then updates heap memory and CPU percentage Prometheus gauges.

Output: No explicit return value.

## `RagService`

Source: `backend/src/chatbot/rag.service.ts`

### `embed(text: string)`

Explanation: Calls the Gemini embedding model (`gemini-embedding-001`) to create an embedding vector for the supplied text.

Output: A numeric embedding vector: `number[]`.

### `chunkText(text: string, size = 500)`

Explanation: Splits text into fixed-size chunks by character count. The default chunk size is 500 characters.

Output: An array of string chunks.

### `indexBook(bookId: string, content: string)`

Explanation: Removes existing Redis RAG entries for the book, chunks the supplied content, embeds each chunk, and stores each chunk plus vector as JSON under keys shaped like `rag:book:${bookId}:${i}`.

Output: No explicit return value. The side effect is Redis index data for that book.

### `cosine(a: number[], b: number[])`

Explanation: Computes cosine similarity between two numeric vectors. If either vector has zero magnitude, it returns `0`.

Output: A number between roughly `-1` and `1`, where higher means more similar.

### `search(query: string)`

Explanation: Embeds the query, loads all Redis keys matching `rag:book:*`, parses each stored chunk/vector pair, scores each chunk using cosine similarity, sorts results by descending score, and returns the top three.

Output:

```ts
Array<{
  text: string;
  score: number;
}>
```

## `TimeoutService`

Source: `backend/src/chatbot/timeout.service.ts`

### `withTimeout<T>(operation: Promise<T>, timeoutMs: number, operationName: string)`

Explanation: Races the supplied promise against a timer. If the operation resolves first, its result is returned. If the timeout fires first, it rejects with `RequestTimeoutException` containing the operation name and timeout duration. The timeout handle is always cleared in `finally`.

Output: The resolved value of the supplied operation, typed as `T`. Throws `RequestTimeoutException` on timeout.

## `UserService`

Source: `backend/src/user/user.service.ts`

### `findAll(page = 1, limit = 10)`

Explanation: Fetches users using pagination. It normalizes `page` to at least `1` and clamps `limit` between `1` and `100`. It updates the active-users gauge with the total count and logs `"Finding all users"`.

Output:

```ts
{
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### `create(userData: CreateUserDto)`

Explanation: Creates a user inside a transaction. It checks for an existing email, hashes the password with bcrypt using 10 salt rounds, generates a `customerCode` using `generateCode('CUS-XXXX-####')`, saves the new user, and increments the user-created metric after success. Duplicate email conflicts are reported as `ConflictException`.

Output: The saved `User` entity, including generated fields such as `id` and `customerCode`. The returned entity includes the hashed password unless filtered elsewhere by the controller or serializer.

### `update(customerCode: string, userData: UpdateUserDto)`

Explanation: Updates a user by `customerCode`. It accepts changes to `name`, `email`, and `password`. New passwords are trimmed for empty-string validation and then hashed. If no update fields are supplied, it returns the current user. If no row is affected, it throws `NotFoundException`. Duplicate-key database errors are converted to `ConflictException`.

Output: The updated `User` entity returned by `findUserByCustomerCode`.

### `findUserByCustomerCode(customerCode: string)`

Explanation: Finds a user by `customerCode`. If no user exists, it throws `NotFoundException`.

Output: A `User` entity.

### `findUserByEmail(email: string)`

Explanation: Finds a user by email for authentication workflows. If no user exists, it throws `NotFoundException` with `"User not found"`.

Output: A `User` entity.

### `deleteUserByCustomerCode(customerCode: string)`

Explanation: Deletes a user by `customerCode`. If no row is deleted, it throws `NotFoundException`.

Output: No explicit return value on success.

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as passport from 'passport';
import * as request from 'supertest';

import { UserController } from '../src/user/user.controller';
import { UserService } from '../src/user/user.service';
import { User } from '../src/user/user.entity';
import { Role } from '../src/user/user.enum';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { LocalStrategy } from '../src/auth/local.strategy';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { SessionSerializer } from '../src/auth/session.serializer';

import { BookController } from '../src/book/book.controller';
import { BookService } from '../src/book/book.service';
import { Book } from '../src/book/book.entity';

import { BorrowController } from '../src/borrow/borrow.controller';
import { BorrowService } from '../src/borrow/borrow.service';
import { BorrowRecord, BorrowStatus } from '../src/borrow/borrow.entity';

import { RolesGuard } from '../src/user/role.guard';
import { ChatbotController } from '../src/chatbot/chatbot.controller';
import { ChatbotService } from '../src/chatbot/chatbot.service';
import { ChatbotConversationStore } from '../src/chatbot/chatbot-conversation.store';
import { RagService } from '../src/chatbot/rag.service';
import { ChatSessionFactory } from '../src/chatbot/chat-session.factory';
import { ToolExecutor } from '../src/chatbot/tool-executor';
import { PromptBuilder } from '../src/chatbot/prompt-builder';
import { RoutingPolicy } from '../src/chatbot/routing-policy';
import { TimeoutService } from '../src/chatbot/timeout.service';
import { ChatMessage, ChatSession } from '../src/chatbot/helperType';

type EntityClass<T> = abstract new (...args: any[]) => T;
type FindOptions<T> = {
  where?: Partial<T>;
  skip?: number;
  take?: number;
  order?: Record<string, 'ASC' | 'DESC'>;
  relations?: string[];
};

class InMemoryRepository<T extends Record<string, any>> {
  private readonly items: T[] = [];
  private sequence = 1;

  constructor(private readonly entity: EntityClass<T>) {}

  create(partial: Partial<T>): T {
    return { ...partial } as T;
  }

  async findOne(options: FindOptions<T>): Promise<T | null> {
    const where = options?.where ?? {};
    return this.items.find((item) => this.matches(item, where)) ?? null;
  }

  async find(options: FindOptions<T> = {}): Promise<T[]> {
    const where = options.where ?? {};
    let results = this.items.filter((item) => this.matches(item, where));

    if (options.order) {
      const [field, direction] = Object.entries(options.order)[0] ?? [];
      if (field) {
        results = [...results].sort((left, right) => {
          const leftValue = left[field];
          const rightValue = right[field];

          if (leftValue === rightValue) {
            return 0;
          }

          const comparison = leftValue > rightValue ? 1 : -1;
          return direction === 'DESC' ? comparison * -1 : comparison;
        });
      }
    }

    const skip = options.skip ?? 0;
    const take = options.take;

    if (take === undefined) {
      return results.slice(skip);
    }

    return results.slice(skip, skip + take);
  }

  async findAndCount(options: FindOptions<T> = {}): Promise<[T[], number]> {
    const where = options.where ?? {};
    const all = this.items.filter((item) => this.matches(item, where));
    const skip = options.skip ?? 0;
    const take = options.take ?? all.length;
    return [all.slice(skip, skip + take), all.length];
  }

  async save(entity: T): Promise<T> {
    const idKey = this.getPrimaryKey();
    const existingIndex =
      entity[idKey] !== undefined
        ? this.items.findIndex((item) => item[idKey] === entity[idKey])
        : -1;

    const nextEntity = { ...entity } as T;

    if (nextEntity[idKey] === undefined || nextEntity[idKey] === null) {
      nextEntity[idKey] = this.sequence++ as T[keyof T];
    }

    if (
      this.entity === (BorrowRecord as unknown as EntityClass<T>) &&
      !('borrowDate' in nextEntity && nextEntity.borrowDate)
    ) {
      (nextEntity as Record<string, any>).borrowDate = new Date();
    }

    if (existingIndex >= 0) {
      this.items[existingIndex] = nextEntity;
    } else {
      this.items.push(nextEntity);
    }

    return nextEntity;
  }

  async update(criteria: Partial<T>, partial: Partial<T>) {
    let affected = 0;

    this.items.forEach((item, index) => {
      if (this.matches(item, criteria)) {
        this.items[index] = { ...item, ...partial };
        affected += 1;
      }
    });

    return { affected };
  }

  async delete(criteria: Partial<T>) {
    const originalLength = this.items.length;
    const remaining = this.items.filter(
      (item) => !this.matches(item, criteria),
    );
    this.items.splice(0, this.items.length, ...remaining);

    return {
      affected: originalLength - this.items.length,
    };
  }

  private getPrimaryKey(): keyof T {
    if (this.entity === (User as unknown as EntityClass<T>)) {
      return 'id' as keyof T;
    }

    if (this.entity === (Book as unknown as EntityClass<T>)) {
      return 'bookid' as keyof T;
    }

    return 'id' as keyof T;
  }

  private matches(
    item: Record<string, any>,
    where: Record<string, any>,
  ): boolean {
    return Object.entries(where).every(([key, value]) => {
      const actual = item[key];

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        if (actual === null || actual === undefined) {
          return false;
        }

        return this.matches(actual, value as Record<string, any>);
      }

      return actual === value;
    });
  }
}

class InMemoryDataSource {
  constructor(
    private readonly repositories: Map<
      EntityClass<any>,
      InMemoryRepository<any>
    >,
  ) {}

  async transaction<T>(
    callback: (manager: {
      getRepository: <E>(entity: EntityClass<E>) => InMemoryRepository<any>;
    }) => Promise<T>,
  ): Promise<T> {
    return callback({
      getRepository: <E>(entity: EntityClass<E>) => {
        const repository = this.repositories.get(entity);

        if (!repository) {
          throw new Error(`Missing repository for ${entity.name}`);
        }

        return repository;
      },
    });
  }
}

class FakeConversationStore {
  private readonly history = new Map<
    string,
    Array<{ role: 'user' | 'model'; text: string }>
  >();
  private sequence = 1;

  async getOrCreateConversationId(conversationId?: string): Promise<string> {
    return conversationId?.trim() || `conversation-${this.sequence++}`;
  }

  async loadHistory(conversationId: string) {
    return this.history.get(conversationId) ?? [];
  }

  async appendTurn(conversationId: string, userMessage: string, reply: string) {
    const existing = this.history.get(conversationId) ?? [];
    this.history.set(conversationId, [
      ...existing,
      { role: 'user', text: userMessage },
      { role: 'model', text: reply },
    ]);
  }
}

class FakeRagService {
  async search(message: string) {
    return [
      {
        text: `Library policy context for: ${message}`,
      },
    ];
  }
}

class FakeChatSessionFactory {
  create(history: any[]): ChatSession {
    let callCount = 0;
    const hasPriorConversation = history.length > 1;

    return {
      sendMessage: async (message: ChatMessage | string) => {
        callCount += 1;

        if (callCount === 1) {
          return {
            response: {
              text: () => 'Initial prompt acknowledged',
            },
          };
        }

        if (Array.isArray(message)) {
          return {
            response: {
              text: () => 'I found a matching book by George Orwell.',
            },
          };
        }

        if (
          typeof message === 'string' &&
          message.toLowerCase().includes('books by george orwell')
        ) {
          return {
            response: {
              text: () => '',
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        functionCall: {
                          name: 'findBookByAuthor',
                          args: { author: 'George Orwell' },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          };
        }

        return {
          response: {
            text: () =>
              hasPriorConversation
                ? 'Here is a follow-up answer using the same conversation.'
                : 'Here is a helpful library answer from RAG.',
          },
        };
      },
    };
  }
}

describe('Library API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let memberCode: string;
  let bookCode: string;
  let bookId: number;
  let borrowId: number;
  let borrowCode: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';

    const repositories = new Map<EntityClass<any>, InMemoryRepository<any>>([
      [User, new InMemoryRepository(User)],
      [Book, new InMemoryRepository(Book)],
      [BorrowRecord, new InMemoryRepository(BorrowRecord)],
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [
        UserController,
        AuthController,
        BookController,
        BorrowController,
        ChatbotController,
      ],
      providers: [
        UserService,
        AuthService,
        LocalStrategy,
        JwtStrategy,
        SessionSerializer,
        BookService,
        BorrowService,
        RolesGuard,
        ChatbotService,
        ToolExecutor,
        PromptBuilder,
        RoutingPolicy,
        TimeoutService,
        // Metric mocks to satisfy @InjectMetric in services (token names used by nestjs-prometheus)
        {
          provide: 'PROM_METRIC_HTTP_ERRORS_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_HTTP_REQUESTS_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_USER_CREATED_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_ACTIVE_USERS',
          useValue: { inc: () => {}, set: () => {} },
        },
        {
          provide: 'PROM_METRIC_BOOK_OPERATIONS_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_BOOK_FETCH_REQUESTS_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_AUTH_REQUESTS_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_AUTH_FAILURES_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_CHATBOT_REQUESTS_TOTAL',
          useValue: { inc: () => {} },
        },
        {
          provide: 'PROM_METRIC_CHATBOT_RESPONSE_DURATION_SECONDS',
          useValue: { startTimer: () => () => {} },
        },
        {
          provide: 'PROM_METRIC_MEMORY_USAGE_BYTES',
          useValue: { set: () => {} },
        },
        {
          provide: 'PROM_METRIC_CPU_USAGE_PERCENT',
          useValue: { set: () => {} },
        },
        {
          provide: getRepositoryToken(User),
          useValue: repositories.get(User),
        },
        {
          provide: getRepositoryToken(Book),
          useValue: repositories.get(Book),
        },
        {
          provide: getRepositoryToken(BorrowRecord),
          useValue: repositories.get(BorrowRecord),
        },
        {
          provide: DataSource,
          useValue: new InMemoryDataSource(repositories),
        },
        {
          provide: ChatbotConversationStore,
          useClass: FakeConversationStore,
        },
        {
          provide: RagService,
          useClass: FakeRagService,
        },
        {
          provide: ChatSessionFactory,
          useClass: FakeChatSessionFactory,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(passport.initialize());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('registers an admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Admin User',
          email: 'admin@test.com',
          password: 'password123',
          role: Role.ADMIN,
        })
        .expect(201);

      expect(response.body.email).toBe('admin@test.com');
      expect(response.body.customerCode).toMatch(/^CUS-/);
      expect(response.body.password).not.toBe('password123');
    });

    it('registers a member user', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Member User',
          email: 'member@test.com',
          password: 'password123',
          role: Role.MEMBER,
        })
        .expect(201);

      memberCode = response.body.customerCode;
      expect(memberCode).toMatch(/^CUS-/);
    });

    it('logs in users and returns JWTs', async () => {
      const adminResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        })
        .expect(201);

      const memberResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member@test.com',
          password: 'password123',
        })
        .expect(201);

      adminToken = adminResponse.body.access_token;
      memberToken = memberResponse.body.access_token;

      expect(adminToken).toEqual(expect.any(String));
      expect(memberToken).toEqual(expect.any(String));
    });

    it('rejects invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  describe('book', () => {
    it('creates and lists books', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/book')
        .send({
          name: '1984',
          Author: 'George Orwell',
          ISBN: '9780451524935',
          status: 'AVAILABLE',
        })
        .expect(201);

      bookCode = createResponse.body.bookCode;
      bookId = createResponse.body.bookid;

      expect(bookCode).toMatch(/^BK-/);

      const listResponse = await request(app.getHttpServer())
        .get('/book?page=1&limit=10')
        .expect(200);

      expect(listResponse.body.meta.total).toBe(1);
      expect(listResponse.body.data[0].name).toBe('1984');
    });

    it('supports search endpoints', async () => {
      await request(app.getHttpServer())
        .get('/book/search/name/1984')
        .expect(200)
        .expect(({ body }) => {
          expect(body.ISBN).toBe('9780451524935');
        });

      await request(app.getHttpServer())
        .get('/book/search/isbn/9780451524935')
        .expect(200)
        .expect(({ body }) => {
          expect(body.Author).toBe('George Orwell');
        });

      await request(app.getHttpServer())
        .get('/book/search/author/George Orwell')
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe('1984');
        });
    });

    it('allows admins to update books and blocks members', async () => {
      await request(app.getHttpServer())
        .patch(`/book/${bookCode}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ status: 'BORROWED' })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/book/${bookCode}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nineteen Eighty-Four' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe('Nineteen Eighty-Four');
        });
    });
  });

  describe('borrow', () => {
    it('borrows a book, shows active borrows, and prevents duplicate borrows', async () => {
      const borrowResponse = await request(app.getHttpServer())
        .post('/borrow')
        .send({
          customerCode: memberCode,
          bookCode,
          dueDate: '2026-06-01T00:00:00.000Z',
        })
        .expect(201);

      borrowId = borrowResponse.body.id;
      // capture borrowCode for the return endpoint which accepts a borrowCode body
      borrowCode = borrowResponse.body.borrowCode;
      expect(borrowResponse.body.status).toBe(BorrowStatus.BORROWED);

      await request(app.getHttpServer())
        .get('/borrow/active')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveLength(1);
          expect(body[0].user.customerCode).toBe(memberCode);
        });

      await request(app.getHttpServer())
        .post('/borrow')
        .send({
          customerCode: memberCode,
          bookCode,
          dueDate: '2026-06-10T00:00:00.000Z',
        })
        .expect(400);
    });

    it('returns a book and exposes user borrow history', async () => {
      await request(app.getHttpServer())
        .get(`/borrow/user/${memberCode}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveLength(1);
          expect(body[0].book.bookCode).toBe(bookCode);
        });

      await request(app.getHttpServer())
        .post(`/borrow/return`)
        .send({ borrowCode })
        .expect(201)
        .expect(({ body }) => {
          expect(body.status).toBe(BorrowStatus.RETURNED);
          expect(body.returnDate).toBeTruthy();
        });
    });
  });

  describe('chatbot', () => {
    it('handles tool-based book queries', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat')
        .send({
          message: 'Can you find books by George Orwell?',
        })
        .expect(201);

      expect(response.body.reply).toBe(
        'I found a matching book by George Orwell.',
      );
      expect(response.body.conversationId).toMatch(/^conversation-/);
    });

    it('handles follow-up conversational requests', async () => {
      const firstResponse = await request(app.getHttpServer())
        .post('/chat')
        .send({
          message: 'Tell me about borrowing rules',
        })
        .expect(201);

      const followUpResponse = await request(app.getHttpServer())
        .post('/chat')
        .send({
          message: 'Can you explain that again simply?',
          conversationId: firstResponse.body.conversationId,
        })
        .expect(201);

      expect(firstResponse.body.reply).toBe(
        'Here is a helpful library answer from RAG.',
      );
      expect(followUpResponse.body.conversationId).toBe(
        firstResponse.body.conversationId,
      );
      expect(followUpResponse.body.reply).toBe(
        'Here is a follow-up answer using the same conversation.',
      );
    });
  });

  describe('cleanup', () => {
    it('allows admins to delete books', async () => {
      await request(app.getHttpServer())
        .delete(`/book/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toContain(String(bookId));
        });
    });
  });
});

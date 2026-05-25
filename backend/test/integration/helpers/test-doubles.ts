import {
  ChatMessage,
  ChatSession,
  ModelResponse,
} from '../../../src/chatbot/helperType';

function createTextResponse(text: string): { response: ModelResponse } {
  return {
    response: {
      text: () => text,
      candidates: [],
    },
  };
}

export class FakeChatSessionFactory {
  create(): ChatSession {
    return {
      sendMessage: async (_message: ChatMessage | string) => {
        return createTextResponse('Integration test chatbot response');
      },
    };
  }
}

export class FakeRagService {
  async search(_message: string) {
    return [];
  }

  async indexBook(_bookId: string, _content: string) {
    return;
  }
}

export class FakeRagSeeder {
  async indexAllBooks() {
    return;
  }
}

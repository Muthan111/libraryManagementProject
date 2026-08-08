import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toolsArg } from './toolCall';

@Injectable()
export class ChatSessionFactory {
  private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  create(builtHistory: any) {
    return this.genAI
      .getGenerativeModel({
        model: 'gemini-3-flash-preview',
        tools: toolsArg,
      })
      .startChat({
        history: builtHistory,
      });
  }
}

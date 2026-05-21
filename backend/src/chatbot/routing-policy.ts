import { Injectable } from '@nestjs/common';

@Injectable()
export class RoutingPolicy {
  isToolQuery(message: string): boolean {
    const msg = message.toLowerCase();

    return (
      msg.includes('isbn') ||
      msg.includes('author') ||
      msg.includes('find book') ||
      msg.includes('get book') ||
      msg.includes('books by') ||
      msg.includes('search book')
    );
  }
}

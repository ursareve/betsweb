import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  from: string;
  to: string;
  content: string;
  timestamp: number;
  isMe: boolean;
}

export interface Conversation {
  userId: string;
  messages: ChatMessage[];
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private conversationsSubject = new BehaviorSubject<Map<string, Conversation>>(new Map());
  public conversations$ = this.conversationsSubject.asObservable();

  constructor() {}

  addMessage(from: string, to: string, content: string, isMe: boolean): void {
    const conversations = this.conversationsSubject.value;
    const otherUserId = isMe ? to : from;
    
    let conversation = conversations.get(otherUserId);
    if (!conversation) {
      conversation = {
        userId: otherUserId,
        messages: [],
        unreadCount: 0
      };
    }

    conversation.messages.push({
      from,
      to,
      content,
      timestamp: Date.now(),
      isMe
    });

    if (!isMe) {
      conversation.unreadCount++;
    }

    conversations.set(otherUserId, conversation);
    this.conversationsSubject.next(new Map(conversations));
  }

  getConversation(userId: string): Conversation | undefined {
    return this.conversationsSubject.value.get(userId);
  }

  markAsRead(userId: string): void {
    const conversations = this.conversationsSubject.value;
    const conversation = conversations.get(userId);
    
    if (conversation) {
      conversation.unreadCount = 0;
      conversations.set(userId, conversation);
      this.conversationsSubject.next(new Map(conversations));
    }
  }

  getMessages(userId: string): ChatMessage[] {
    const conversation = this.getConversation(userId);
    return conversation ? conversation.messages : [];
  }

  getTotalUnreadCount(): number {
    let total = 0;
    this.conversationsSubject.value.forEach(conversation => {
      total += conversation.unreadCount;
    });
    return total;
  }
}

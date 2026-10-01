export interface ChatMessage {
  id: string;
  from: 'them' | 'me';
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  context: string;
  unread: number;
  messages: ChatMessage[];
}

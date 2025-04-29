export type ChatMode = 'single' | 'multiple';

export class User {
  id: string;

  nickname: string;

  chatRoom: string;

  chatMode: ChatMode;
}

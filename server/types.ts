import { type User } from '@shared/schema';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      password: string;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

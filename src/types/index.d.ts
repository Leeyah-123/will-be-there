import pino from 'pino';
import { User } from '../utils/types';

declare global {
  interface Error {
    data?: any;
    timeout?: number;
    statusCode: number;
  }

  namespace Express {
    interface Request {
      user: User;
      logger: pino.Logger;
      logError: (message: string, error?: unknown) => void;
    }
  }
}

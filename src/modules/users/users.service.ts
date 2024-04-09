import pino from 'pino';
import { ServiceResponse } from '../../core/types';

export default class UsersService {
  async getUsers(logger: pino.Logger): Promise<ServiceResponse> {
    logger.info('Fetching users');
    return {
      message: 'Users fetched successfully',
      data: [],
    };
  }
}

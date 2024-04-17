import axios, { AxiosError } from 'axios';
import { User } from '../../utils/types';

export default class UsersService {
  async getUsers(): Promise<User[]> {
    const response = await axios.get(
      `${process.env.AUTH_SERVER_URL}/api/users`
    );
    return response.data;
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await axios.get(
        `${process.env.AUTH_SERVER_URL}/api/users/${id}`
      );
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.statusCode === 404) {
          return null;
        }
      }

      throw err;
    }
  }
}

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import UsersService from './users.service';

export default class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();

    this.getUsers = this.getUsers.bind(this);
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.usersService.getUsers(req.logger);

      return res.status(response.status || StatusCodes.OK).json({
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }
}

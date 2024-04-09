import { Router } from 'express';
import UsersController from './users.controller';

const router = Router();
const Controller = new UsersController();

router.get('/users', Controller.getUsers);

export default router;

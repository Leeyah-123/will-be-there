import axios, { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.header('Authorization');
  if (!token)
    return res
      .status(401)
      .json({ message: 'Token is missing or not provided' });

  try {
    // Fetch user from authentication server using axios
    const response = await axios.get(
      `${process.env.AUTH_SERVER_URL}/api/profile`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    // Inject user into request object
    req.user = response.data;
    next();
  } catch (err) {
    // Log error for debugging purposes
    console.error(err);

    if (err instanceof AxiosError) {
      if (err.response?.status === 401) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: 'Invalid or expired token provided' });
      }
    }

    return res.status(500).json({ message: 'Something went wrong' });
  }
};

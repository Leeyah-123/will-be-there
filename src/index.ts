import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';

import events from './modules/events';
import rsvp from './modules/rsvp';
import upload from './modules/upload';

import { errorHandler, logger } from './middlewares';

dotenv.config();

const rootLogger = pino().child({
  context: 'server',
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

// Custom middlewares
app.use(logger);

// Used for health checks
app.get('/ping', async (_req, res, _next) => {
  return res.json({
    message: 'pong',
  });
});

// Attach app routes
app.use('/uploads', upload);
app.use('/events', events);
app.use('/rsvps', rsvp);

// Error Boundary
app.use(errorHandler);

// Catch 404 routes
app.use((_req, res, _next) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

app.listen(PORT, async () => {
  rootLogger.info(`App listening on port ${PORT}`);
});

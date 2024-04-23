import { Redis } from 'ioredis';

let redisClient: Redis;

const initClient = () => {
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
  });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
};

export const getRedisClient = () => {
  if (!redisClient) initClient();
  return redisClient;
};

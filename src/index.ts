import 'dotenv/config';
import express from 'express';

import { initSequelizeClient } from './sequelize';
import { initPostsRouter, initUsersRouter } from './routers';
import { initErrorRequestHandler, initNotFoundRequestHandler } from './middleware';

const PORT = process.env.PORT | 8080;

async function main(): Promise<void> {
  const app = express();

  const sequelizeClient = await initSequelizeClient({
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  app.use(express.json());

  app.use('/api/v1/users', initUsersRouter(sequelizeClient));
  app.use('/api/v1/posts', initPostsRouter(sequelizeClient));

  app.use('/', initNotFoundRequestHandler());

  app.use(initErrorRequestHandler());

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.info(`app listening on port: '${PORT}'`);

      resolve();
    });
  });
}

main()
  .then(() => console.info('app started'))
  .catch(console.error);

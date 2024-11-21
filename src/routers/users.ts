import { Router, RequestHandler } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

import type { SequelizeClient } from '../sequelize';
import type { User } from '../repositories/types';

import { BadRequestError, UnauthorizedError } from '../errors';
import { hashPassword, generateToken } from '../security';
import { initTokenValidationRequestHandler, RequestAuth } from '../middleware/security';
import { UserType } from '../constants';
import { createUserRequestBodySchema, loginUserRequestSchema } from '../validation';

export function initUsersRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

  router.route('/').get(tokenValidation, initListUsersRequestHandler(sequelizeClient));

  router.route('/login').post(initLoginUserRequestHandler(sequelizeClient));
  router.route('/register').post(initRegisterUserRequestHandler(sequelizeClient));

  return router;
}

function initListUsersRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listUsersRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const {
        auth: {
          user: { type: userType },
        },
      } = req as unknown as { auth: RequestAuth };

      const isAdmin = userType === UserType.ADMIN;

      const users = await models.users.findAll({
        attributes: isAdmin ? ['id', 'name', 'email'] : ['name', 'email'],
        ...(!isAdmin && { where: { type: { [Op.ne]: UserType.ADMIN } } }),
        raw: true,
      });

      res.send(users);

      res.end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

function initLoginUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function loginUserRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { email, password } = loginUserRequestSchema.parse(req.body);

      const user = (await models.users.findOne({
        attributes: ['id', 'passwordHash'],
        where: { email },
        raw: true,
      })) as Pick<User, 'id' | 'passwordHash'> | null;
      if (!user) {
        throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
      }

      if (!bcrypt.compareSync(password, user.passwordHash)) {
        throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
      }

      const token: string = generateToken({ id: user.id });

      res.send({ token }).end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

function initRegisterUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function registerUserRequestHandler(req, res, next): Promise<void> {
    try {
      const { name, email, password } = createUserRequestBodySchema.parse(req.body);

      const hashedPassword: string = await hashPassword(password);

      await createUser({ type: UserType.BLOGGER, name, email, password: hashedPassword }, sequelizeClient);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

async function createUser(data: CreateUserData, sequelizeClient: SequelizeClient): Promise<void> {
  const { type, name, email, password } = data;

  const { models } = sequelizeClient;

  const similarUser = (await models.users.findOne({
    attributes: ['id', 'name', 'email'],
    where: {
      [Op.or]: [{ name }, { email }],
    },
    raw: true,
  })) as Pick<User, 'id' | 'name' | 'email'> | null;
  if (similarUser) {
    if (similarUser.name === name) {
      throw new BadRequestError('NAME_ALREADY_USED');
    }
    if (similarUser.email === email) {
      throw new BadRequestError('EMAIL_ALREADY_USED');
    }
  }

  await models.users.create({ type, name, email, passwordHash: password });
}

type CreateUserData = Pick<User, 'type' | 'name' | 'email'> & { password: User['passwordHash'] };

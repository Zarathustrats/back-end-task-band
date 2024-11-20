import { RequestHandler } from 'express';

import type { SequelizeClient } from '../sequelize';
import type { User } from '../repositories/types';

import { UnauthorizedError, ForbiddenError, NotImplementedError } from '../errors';
import { isValidToken, extraDataFromToken } from '../security';
import { UserType } from '../constants';

export function initTokenValidationRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function tokenValidationRequestHandler(req, res, next): Promise<void> {
    try {
      const { models } = sequelizeClient;

      const authorizationHeaderValue = req.header('authorization');
      if (!authorizationHeaderValue) {
        throw new UnauthorizedError('AUTH_MISSING');
      }

      const [type, token] = authorizationHeaderValue.split(' ');
      if (type?.toLowerCase() !== 'bearer') {
        throw new UnauthorizedError('AUTH_WRONG_TYPE');
      }

      if (!token) {
        throw new UnauthorizedError('AUTH_TOKEN_MISSING');
      }
      
      if (!isValidToken(token)) {
        throw new UnauthorizedError('AUTH_TOKEN_INVALID');
      }

      const { id } = extraDataFromToken(token);

      const user = await models.users.findByPk(id);
      if (!user) {
        throw new UnauthorizedError('AUTH_TOKEN_INVALID');
      }

      (req as any).auth = {
        token,
        user,
      } as RequestAuth;

      return next();
    } catch (error) {
      return next(error);
    }
  } as RequestHandler;
}

export interface RequestAuth {
  token: string;
  user: User;
}
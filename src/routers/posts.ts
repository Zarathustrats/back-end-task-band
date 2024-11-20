import { Router, RequestHandler } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';

import type { SequelizeClient } from '../sequelize';
import { initTokenValidationRequestHandler, RequestAuth } from '../middleware/security';
import { UserType } from '../constants';
import { BadRequestError } from '../errors';
import { createPostRequestBodySchema, updatePostRequestBodySchema } from '../validation';
import { Post } from '../repositories/posts';

export function initPostsRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });
  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

  router
    .route('/')
    .get(tokenValidation, initListPostsRequestHandler(sequelizeClient))
    .post(tokenValidation, initCreatePostRequestHandler(sequelizeClient));

  router
    .route('/:id')
    .get(tokenValidation, initShowPostRequestHandler(sequelizeClient))
    .put(tokenValidation, initUpdatePostRequestHandler(sequelizeClient))
    .delete(tokenValidation, initRemovePostRequestHandler(sequelizeClient));

  return router;
}

function initShowPostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function showPostRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { id: postId } = req.params;
      const {
        auth: {
          user: { id: userId },
        },
      } = req as unknown as { auth: RequestAuth };

      const post = await models.posts.findOne({
        where: {
          id: postId,
          [Op.or]: [{ authorId: userId }, { isHidden: false }],
        },
      });

      if (!post) {
        throw new BadRequestError(`Post ${postId} not find!`);
      }

      res.send(post);
      res.end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

function initListPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listPostsRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const {
        auth: {
          user: { type: userType, id: userId },
        },
      } = req as unknown as { auth: RequestAuth };
      const isAdmin = userType === UserType.ADMIN;

      const include = !isAdmin
        ? [
            {
              model: models.users,
              as: 'author',
              attributes: ['name'],
            },
          ]
        : [
            {
              model: models.users,
              as: 'author',
              attributes: ['id', 'name'],
            },
          ];

      const posts = await models.posts.findAll({
        where: {
          [Op.or]: [{ authorId: userId }, { isHidden: false }],
        },
        include,
      });

      res.send(posts);
      res.end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

function initCreatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createPostRequestHandler(req, res, next): Promise<void> {
    try {
      const { title, content } = createPostRequestBodySchema.parse(req.body);
      const {
        auth: {
          user: { id: authorId },
        },
      } = req as unknown as { auth: RequestAuth };

      await createPost({ title, content, authorId }, sequelizeClient);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

async function createPost(data: CreatePostData, sequelizeClient: SequelizeClient): Promise<void> {
  const { models } = sequelizeClient;
  const { title, content, authorId } = data;

  await models.posts.create({ title, content, authorId });
}

function initUpdatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function updatePostRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { id: postId } = req.params;
      const { title, content, isHidden } = updatePostRequestBodySchema.parse(req.body);
      const {
        auth: {
          user: { type: userType, id: userId },
        },
      } = req as unknown as { auth: RequestAuth };
      const isAdmin = userType === UserType.ADMIN;

      if (!(title || content || isHidden)) {
        throw new BadRequestError('`Unknown post data!`');
      }

      const post = await models.posts.findOne({
        where: {
          id: postId,
          [Op.or]: [{ authorId: userId }, ...(isAdmin ? [{ isHidden: false }] : [])],
        },
      });

      if (!post) {
        throw new BadRequestError(`Post ${postId} not find or not allowed to be updated!`);
      }

      await post.update({ title, content, isHidden });

      res.end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

function initRemovePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function removePostRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { id: postId } = req.params;
      const {
        auth: {
          user: { type: userType, id: userId },
        },
      } = req as unknown as { auth: RequestAuth };
      const isAdmin = userType === UserType.ADMIN;

      const post = await models.posts.findOne({
        where: {
          id: postId,
          [Op.or]: [{ authorId: userId }, isAdmin ? { isHidden: false } : {}],
        },
      });

      if (!post) {
        throw new BadRequestError(`Post ${postId} not find or not allowed to be remove!`);
      }

      await post.destroy();
      res.end();
    } catch (error) {
      next(error);
    }
  } as RequestHandler;
}

type CreatePostData = z.infer<typeof createPostRequestBodySchema> & Pick<Post, 'authorId'>;

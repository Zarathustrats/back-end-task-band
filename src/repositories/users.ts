import { HasMany, Model } from 'sequelize';

import type { SequelizeModels } from '../sequelize';
import type { Post } from './types';

import { UserType } from '../constants';

export class User extends Model {
  static associations: {
    posts: HasMany<User, Post>;
  };

  declare id: number;
  declare type: UserType;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: SequelizeModels): void {
    this.hasMany(models.posts, { foreignKey: 'authorId', as: 'posts' });
  }
}

export type UsersModel = typeof User;
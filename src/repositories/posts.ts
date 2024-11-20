import { BelongsTo, Model } from 'sequelize';

import type { SequelizeModels } from '../sequelize';
import type { User } from './types';

export class Post extends Model {
  static associations: {
    author: BelongsTo<Post, User>;
  };

  declare id: number;
  declare title: string;
  declare content: string;
  declare authorId: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare isHidden: any;

  static associate(models: SequelizeModels): void {
    this.belongsTo(models.users, { foreignKey: 'authorId', as: 'author' });
  }
}

export type PostsModel = typeof Post;
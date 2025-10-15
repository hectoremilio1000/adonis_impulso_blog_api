import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BlogPost from '#models/blog_post'

export default class BlogPostBlock extends BaseModel {
  @column({ isPrimary: true }) declare id: number

  @column({ columnName: 'post_id' }) declare postId: number
  @column({ columnName: 'sort_order' }) declare sortOrder: number

  @column() declare type: 'heading' | 'paragraph' | 'image'
  @column() declare text: string | null
  @column({ columnName: 'image_url' }) declare imageUrl: string | null

  @belongsTo(() => BlogPost, { foreignKey: 'postId' }) declare post: BelongsTo<typeof BlogPost>
}

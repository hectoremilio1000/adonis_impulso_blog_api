import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BlogPostBlock from '#models/blog_post_block'

export default class BlogPost extends BaseModel {
  @column({ isPrimary: true }) declare id: number

  @column() declare title: string
  @column() declare slug: string
  @column() declare excerpt: string | null
  @column({ columnName: 'cover_image' }) declare coverImage: string | null
  @column({ columnName: 'banner_phrase' }) declare bannerPhrase: string | null

  @column.dateTime({ columnName: 'published_at' }) declare publishedAt: DateTime | null

  @column({ columnName: 'author_name' }) declare authorName: string | null

  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @hasMany(() => BlogPostBlock, { foreignKey: 'postId' }) declare blocks: HasMany<
    typeof BlogPostBlock
  >
}

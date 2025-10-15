import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blog_posts'

  async up() {
    this.schema.createTable(this.tableName, (t) => {
      t.increments('id')
      t.string('title', 255).notNullable()
      t.string('slug', 191).notNullable().unique()
      t.text('excerpt').nullable()
      t.string('cover_image', 1024).nullable()
      t.string('banner_phrase', 512).nullable()

      t.string('author_name', 255).nullable().index()

      t.dateTime('published_at').nullable()
      t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

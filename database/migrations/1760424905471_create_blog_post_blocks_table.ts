import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blog_post_blocks'

  async up() {
    this.schema.createTable(this.tableName, (t) => {
      t.increments('id')
      t.integer('post_id')
        .unsigned()
        .notNullable()
        .index()
        .references('id')
        .inTable('blog_posts')
        .onDelete('CASCADE')
      t.integer('sort_order').unsigned().notNullable()
      t.enum('type', ['heading', 'paragraph', 'image']).notNullable()
      t.text('text').nullable()
      t.string('image_url', 1024).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import router from '@adonisjs/core/services/router'

const BlogPostsController = () => import('#controllers/blog_posts_controller')
const BlogMediaController = () => import('#controllers/blog_media_controller')

router
  .group(() => {
    // públicos (consumidos por tu Next.js)
    router.get('/blog-posts', [BlogPostsController, 'index'])
    router.get('/blog-posts/:slug', [BlogPostsController, 'show'])
    router.get('/blog-posts/id/:id', [BlogPostsController, 'findById'])

    // admin (proteger con auth cuando lo conectes)
    router.post('/blog-posts', [BlogPostsController, 'store'])
    router.put('/blog-posts/:id', [BlogPostsController, 'update'])
    router.delete('/blog-posts/:id', [BlogPostsController, 'destroy'])

    // media
    router.post('/blog-posts/:id/cover', [BlogMediaController, 'uploadCover'])
    router.post('/blog-posts/:id/blocks/image', [BlogMediaController, 'uploadBlockImage'])
  })
  .prefix('/api')

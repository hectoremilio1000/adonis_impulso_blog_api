import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import path from 'node:path'
import FtpMediaUploader from '#services/ftp_media_uploader'
import BlogPost from '#models/blog_post'

export default class BlogMediaController {
  /** POST /api/blog-posts/:id/cover  (multipart: file) → { ok, url } */
  public async uploadCover({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const file = request.file('file', {
      size: '20mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })
    if (!id || !file) return response.badRequest({ error: 'id y file son requeridos' })
    if (!file.isValid) return response.badRequest({ error: file.errors })

    const tmpDir = app.makePath('tmp')
    await file.move(tmpDir, { name: `${Date.now()}_cover_${file.clientName}` })
    const localPath = path.join(tmpDir, file.fileName!)

    const url = await FtpMediaUploader.upload({ dir: 'blog/covers', localPath })

    const post = await BlogPost.find(id)
    if (post) {
      post.coverImage = url
      await post.save()
    }

    return { ok: true, url }
  }

  /** POST /api/blog-posts/:id/blocks/image  (multipart: file) → { ok, url } */
  public async uploadBlockImage({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const file = request.file('file', {
      size: '20mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })
    if (!id || !file) return response.badRequest({ error: 'id y file son requeridos' })
    if (!file.isValid) return response.badRequest({ error: file.errors })

    const tmpDir = app.makePath('tmp')
    await file.move(tmpDir, { name: `${Date.now()}_block_${file.clientName}` })
    const localPath = path.join(tmpDir, file.fileName!)

    // Carpeta por post
    const url = await FtpMediaUploader.upload({ dir: `blog/${id}`, localPath })
    return { ok: true, url }
  }
}

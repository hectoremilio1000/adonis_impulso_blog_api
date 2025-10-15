import type { HttpContext } from '@adonisjs/core/http'
import BlogPost from '#models/blog_post'
import BlogPostBlock from '#models/blog_post_block'
import string from '@adonisjs/core/helpers/string'
import { DateTime } from 'luxon'

function dateTimeOrNull(v: any): DateTime | null {
  if (v === undefined || v === null || v === '') return null

  // Si ya viene DateTime de Luxon
  if (DateTime.isDateTime(v)) return (v as DateTime).isValid ? v : null

  // Si viene Date nativo
  if (v instanceof Date) {
    const dt = DateTime.fromJSDate(v)
    return dt.isValid ? dt : null
  }

  // Si viene número (epoch ms o seg)
  if (typeof v === 'number') {
    const ms = v > 1e12 ? v : v * 1000
    const dt = DateTime.fromMillis(ms)
    return dt.isValid ? dt : null
  }

  // Si viene string (ISO/RFC/lo común)
  if (typeof v === 'string') {
    // intenta ISO primero
    let dt = DateTime.fromISO(v)
    if (!dt.isValid) dt = DateTime.fromRFC2822(v)
    if (!dt.isValid) {
      // último recurso: Date nativo
      const d = new Date(v)
      if (!Number.isNaN(d.getTime())) dt = DateTime.fromJSDate(d)
    }
    return dt.isValid ? dt : null
  }

  return null
}

function strOrNull(v: any): string | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

function normalizeBlocks(raw: any) {
  const arr = Array.isArray(raw) ? raw : []
  return arr
    .map((b) => ({
      sortOrder: Number(b?.sortOrder ?? b?.order ?? 0),
      type: b?.type as 'heading' | 'paragraph' | 'image',
      text: strOrNull(b?.text),
      imageUrl: strOrNull(b?.imageUrl),
    }))
    .filter(
      (b) => ['heading', 'paragraph', 'image'].includes(b.type) && Number.isFinite(b.sortOrder)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Convierte el modelo a payload para tu Next.js (inyecta author.name) */
function serializePostWithAuthorName(p: BlogPost & { blocks?: any[] }) {
  const base = p.serialize()
  const authorName = (p as any).authorName ?? base.authorName ?? null
  const author = authorName ? { name: authorName } : null

  // Compat para blocks: order y sortOrder
  const blocks = (p as any).blocks
    ? p.blocks.map((b) => ({
        id: b.id,
        type: b.type,
        text: b.text,
        imageUrl: b.imageUrl,
        order: b.sortOrder,
        sortOrder: b.sortOrder,
      }))
    : undefined

  return { ...base, author, blocks }
}

export default class BlogPostsController {
  /** GET /api/blog-posts?page=&limit=  → lista publicados */
  public async index({ request }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 10))
    const mode = String(request.input('mode', 'published')) // 'published' | 'draft' | 'all'

    const q = BlogPost.query()
    if (mode === 'draft') q.whereNull('publishedAt')
    else if (mode === 'published') q.whereNotNull('publishedAt')
    // 'all' -> sin filtro

    // ordena: publicados primero; dentro, por fecha desc; luego por creación desc
    q.orderByRaw('published_at IS NULL') // drafts al final
      .orderBy('published_at', 'desc')
      .orderBy('created_at', 'desc')

    const postsPage = await q.paginate(page, limit)
    const serialized = postsPage.all().map((p) => serializePostWithAuthorName(p))
    return { meta: postsPage.getMeta(), data: serialized }
  }

  /** GET /api/blog-posts/:slug → post + blocks */
  public async show({ params, response }: HttpContext) {
    const post = await BlogPost.query()
      .where('slug', params.slug)
      .preload('blocks', (q) => q.orderBy('sort_order', 'asc').orderBy('id', 'asc'))
      .first()

    if (!post) return response.notFound({ error: 'Post no encontrado' })
    return serializePostWithAuthorName(post)
  }

  /** GET /api/blog-posts/id/:id → para admin/edición */
  public async findById({ params, response }: HttpContext) {
    const post = await BlogPost.query()
      .where('id', params.id)
      .preload('blocks', (q) => q.orderBy('sort_order', 'asc').orderBy('id', 'asc'))
      .first()

    if (!post) return response.notFound({ error: 'Post no encontrado' })
    return serializePostWithAuthorName(post)
  }

  /** POST /api/blog-posts  (crear, SIN validators) */
  public async store({ request, response }: HttpContext) {
    const body = request.body() || {}
    const title = strOrNull(body.title)
    if (!title) return response.badRequest({ error: 'title es requerido' })

    const authorName = strOrNull(body.authorName) ?? strOrNull(body.author) // acepta author o authorName

    const post = await BlogPost.create({
      title,
      slug: strOrNull(body.slug) ?? string.slug(title),
      excerpt: strOrNull(body.excerpt),
      coverImage: strOrNull(body.coverImage),
      bannerPhrase: strOrNull(body.bannerPhrase),
      authorName, // 👈 campo directo
      publishedAt: dateTimeOrNull(body.publishedAt),
    })

    const blocks = normalizeBlocks(body.blocks)
    if (blocks.length) {
      await post.related('blocks').createMany(
        blocks.map((b) => ({
          postId: post.id,
          sortOrder: b.sortOrder,
          type: b.type,
          text: b.text,
          imageUrl: b.imageUrl,
        }))
      )
    }

    await post.load('blocks', (q) => q.orderBy('sort_order', 'asc'))
    return serializePostWithAuthorName(post)
  }

  /** PUT /api/blog-posts/:id  (actualizar, SIN validators) */
  public async update({ params, request, response }: HttpContext) {
    const body = request.body() || {}
    const post = await BlogPost.find(params.id)
    if (!post) return response.notFound({ error: 'Post no encontrado' })

    const maybeTitle = strOrNull(body.title)
    const maybeAuthorName = strOrNull(body.authorName) ?? strOrNull(body.author)

    const nextSlug = strOrNull(body.slug) ?? (maybeTitle ? string.slug(maybeTitle) : undefined)

    post.merge({
      title: maybeTitle ?? post.title,
      slug: nextSlug ?? post.slug,
      excerpt: strOrNull(body.excerpt) ?? post.excerpt,
      coverImage: strOrNull(body.coverImage) ?? post.coverImage,
      bannerPhrase: strOrNull(body.bannerPhrase) ?? post.bannerPhrase,
      authorName: maybeAuthorName !== null ? maybeAuthorName : post.authorName,
      publishedAt:
        body.publishedAt !== undefined ? dateTimeOrNull(body.publishedAt) : post.publishedAt,
    })
    await post.save()

    if (body.blocks !== undefined) {
      const blocks = normalizeBlocks(body.blocks)
      await BlogPostBlock.query().where('post_id', post.id).delete()
      if (blocks.length) {
        await post.related('blocks').createMany(
          blocks.map((b) => ({
            postId: post.id,
            sortOrder: b.sortOrder,
            type: b.type,
            text: b.text,
            imageUrl: b.imageUrl,
          }))
        )
      }
    }

    await post.load('blocks', (q) => q.orderBy('sort_order', 'asc'))
    return serializePostWithAuthorName(post)
  }

  /** DELETE /api/blog-posts/:id */
  public async destroy({ params, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post) return response.notFound({ error: 'Post no encontrado' })
    await post.delete()
    return { ok: true }
  }
}

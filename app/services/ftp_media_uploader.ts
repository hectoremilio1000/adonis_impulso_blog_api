// Sube imágenes a cPanel vía FTPS y devuelve la URL pública.
// Usa MEDIA_BASE_URL_BLOG como base. Estructura sugerida:
//  - blog/covers/archivo.webp
//  - blog/<postId>/archivo.webp

import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import ftp from 'basic-ftp'
import sharp from 'sharp'

type UploadOpts = { dir: string; localPath: string }

export default class FtpMediaUploader {
  static async upload({ dir, localPath }: UploadOpts) {
    const host = process.env.FTPS_HOST!
    const port = Number(process.env.FTPS_PORT || 21)
    const user = process.env.FTPS_USER!
    const password = process.env.FTPS_PASS!
    const secure = String(process.env.FTPS_SECURE ?? 'true') === 'true'
    const baseUrl = process.env.MEDIA_BASE_URL_BLOG! // ← ojo con el nombre

    const outExt = 'webp'
    const fileName = `${Date.now()}-${randomUUID()}.${outExt}`
    const tmpOptimized = `${localPath}.opt.${outExt}`

    const client = new ftp.Client()
    try {
      await client.access({ host, port, user, password, secure })
      await client.ensureDir(dir) // p.ej. blog/covers o blog/23

      const MAX_W = 1600
      const input = sharp(localPath, { failOn: 'none' }).rotate()
      const meta = await input.metadata()
      const width = meta.width && meta.width > MAX_W ? MAX_W : meta.width || MAX_W
      await input.resize({ width }).webp({ quality: 80, effort: 4 }).toFile(tmpOptimized)

      await client.uploadFrom(tmpOptimized, fileName)
      try {
        await client.cd('/')
      } catch {}
    } finally {
      try {
        client.close()
      } catch {}
      try {
        fs.unlinkSync(localPath)
      } catch {}
      try {
        fs.unlinkSync(tmpOptimized)
      } catch {}
    }

    return `${baseUrl}/${dir}/${fileName}`
  }
}

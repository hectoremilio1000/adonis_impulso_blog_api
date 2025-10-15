import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  // MySQL por campos
  DB_CONNECTION: Env.schema.enum(['mysql'] as const),
  MYSQL_HOST: Env.schema.string(),
  MYSQL_PORT: Env.schema.number(),
  MYSQL_USER: Env.schema.string(),
  MYSQL_PASSWORD: Env.schema.string.optional(),
  MYSQL_DB_NAME: Env.schema.string(),

  FTPS_HOST: Env.schema.string.optional(),
  FTPS_PORT: Env.schema.number.optional(),
  FTPS_USER: Env.schema.string.optional(),
  FTPS_PASS: Env.schema.string.optional(),
  FTPS_SECURE: Env.schema.boolean.optional(),
  MEDIA_BASE_URL_BLOG: Env.schema.string.optional(),
})

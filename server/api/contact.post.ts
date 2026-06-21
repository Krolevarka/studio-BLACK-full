import { z } from 'zod'

const rateLimitMap = new Map<string, { count: number, timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5

const bodySchema = z.object({
  name: z.string().optional(),
  services: z.array(z.string()).optional(),
  project: z.string().optional(),
  budget: z.string().optional(),
  contact: z.string().min(1, 'Contact info is required')
}).strict()

export default defineEventHandler(async (event) => {
  try {
    // CSRF / Origin Check
    const origin = getHeader(event, 'origin')
    const host = getHeader(event, 'host')
    
    if (origin && host) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          throw createError({ statusCode: 403, statusMessage: 'Forbidden: Invalid Origin' })
        }
      } catch {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Invalid Origin URL' })
      }
    }

    // Rate Limiting
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const now = Date.now()
    const record = rateLimitMap.get(ip)
    
    if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.set(ip, { count: 1, timestamp: now })
    } else if (record.count >= MAX_REQUESTS) {
      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
    } else {
      record.count++
    }

    const rawBody = await readBody(event)
    
    // Базовая валидация: проверяем, что тело соответствует схеме
    const body = bodySchema.parse(rawBody)
    
    console.log('\n============= НОВАЯ АНКЕТА =============')
    console.log(JSON.stringify(body, null, 2))
    console.log('========================================\n')
    
    // В будущем здесь будет интеграция с Telegram Bot API или Email
    // Например: await $fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, ...)
    
    return {
      success: true,
      message: 'Brief accepted successfully'
    }
  } catch (err: unknown) {
    console.error('API Error:', err)
    
    if (err instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Failed',
        data: err.issues
      })
    }
    
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process contact form'
    })
  }
})

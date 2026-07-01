import { z } from 'zod'
import nodemailer from 'nodemailer'

interface RateLimitRecord {
  attempts: number
  successCount: number
  firstAttemptTime: number
  lastSuccessTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Лимиты: максимум 2 успешные отправки за 15 минут, и максимум 5 попыток за час
const SUCCESS_WINDOW = 15 * 60 * 1000 // 15 минут
const ATTEMPT_WINDOW = 60 * 60 * 1000 // 1 час
const MAX_SUCCESS = 2
const MAX_ATTEMPTS = 5

// Очистка старых IP-адресов каждые 15 минут для предотвращения утечки памяти (Memory Leak)
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstAttemptTime > ATTEMPT_WINDOW && now - record.lastSuccessTime > SUCCESS_WINDOW) {
      rateLimitMap.delete(ip)
    }
  }
}, 15 * 60 * 1000)

if (cleanupTimer.unref) {
  cleanupTimer.unref()
}

const bodySchema = z.object({
  name: z.string().optional(),
  services: z.array(z.string()).optional(),
  project: z.string().optional(),
  budget: z.string().optional(),
  contact: z.string().min(1, 'Контактные данные обязательны'),
  devMode: z.string().optional(),
  referenceUrls: z.array(z.string()).optional()
}).strict()

export default defineEventHandler(async (event) => {
  try {
    // Проверка Origin / Host для защиты от CSRF
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

    // Алгоритм Rate Limiting по IP
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const now = Date.now()
    let record = rateLimitMap.get(ip)

    if (!record) {
      record = {
        attempts: 0,
        successCount: 0,
        firstAttemptTime: now,
        lastSuccessTime: 0
      }
      rateLimitMap.set(ip, record)
    }

    // Сброс счетчика попыток, если прошел час
    if (now - record.firstAttemptTime > ATTEMPT_WINDOW) {
      record.attempts = 0
      record.firstAttemptTime = now
    }

    // Сброс счетчика успешных отправок, если прошло 15 минут
    if (now - record.lastSuccessTime > SUCCESS_WINDOW) {
      record.successCount = 0
    }

    // Проверка превышения лимитов
    if (record.successCount >= MAX_SUCCESS || record.attempts >= MAX_ATTEMPTS) {
      throw createError({ 
        statusCode: 429, 
        statusMessage: 'Too Many Requests',
        message: 'Слишком много попыток отправки. Пожалуйста, подождите 15 минут.' 
      })
    }

    record.attempts++

    const contentType = getHeader(event, 'content-type') || ''
    let name = ''
    let services: string[] = []
    let project = ''
    let budget = ''
    let contact = ''
    let devMode = ''
    let referenceUrls: string[] = []
    const files: { filename: string; data: Buffer; contentType: string }[] = []

    if (contentType.includes('multipart/form-data')) {
      const parts = await readMultipartFormData(event)
      if (parts) {
        for (const part of parts) {
          if (!part.name) continue
          const valueStr = part.data.toString('utf-8')

          if (part.name === 'name') name = valueStr
          else if (part.name === 'project') project = valueStr
          else if (part.name === 'budget') budget = valueStr
          else if (part.name === 'contact') contact = valueStr
          else if (part.name === 'devMode') devMode = valueStr
          else if (part.name === 'services') services.push(valueStr)
          else if (part.name === 'referenceUrls') referenceUrls.push(valueStr)
          else if (part.name === 'files' && part.filename) {
            if (files.length >= 4) continue
            if (part.data.length > 5 * 1024 * 1024) continue
            
            const safeName = part.filename.replace(/[^a-zA-Z0-9.\-_а-яА-ЯёЁ\s]/g, '_').slice(0, 100)
            files.push({
              filename: safeName || 'attachment',
              data: part.data,
              contentType: part.type || 'application/octet-stream'
            })
          }
        }
      }
    } else {
      const rawBody = await readBody(event)
      const parsed = bodySchema.parse(rawBody)
      name = parsed.name || ''
      services = parsed.services || []
      project = parsed.project || ''
      budget = parsed.budget || ''
      contact = parsed.contact || ''
      devMode = parsed.devMode || ''
      referenceUrls = parsed.referenceUrls || []
    }

    if (!contact || contact.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Контактные данные обязательны'
      })
    }

    // Логирование в консоль сервера (гарантия сохранности данных)
    console.log('\n============= НОВАЯ АНКЕТА KVAZAR =============')
    console.log('IP:', ip)
    console.log('Время:', new Date().toLocaleString('ru-RU'))
    console.log(JSON.stringify({ name, contact, budget, devMode, services, referenceUrls, filesCount: files.length }, null, 2))
    console.log('===============================================\n')

    // Получение настроек из переменных окружения
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = Number(process.env.SMTP_PORT) || 587
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465
    const smtpUser = process.env.SMTP_USER || 'kvazarweb@gmail.com'
    const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, '')
    const mailTo = process.env.MAIL_TO || 'kvazarweb@gmail.com'

    // Проверка настройки пароля
    if (!smtpPass || smtpPass === 'ваш_16_значный_пароль_приложения') {
      console.warn('⚠️ ВНИМАНИЕ: Пароль приложения (SMTP_PASS) еще не настроен в .env файле!')
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: 'Почтовый сервер еще не настроен. Укажите 16-значный пароль приложения в файле .env'
      })
    }

    // Настройка транспорта Nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    const servicesList = services && services.length > 0 
      ? services.map(s => `<li><b>${s}</b></li>`).join('') 
      : '<li>Не указано</li>'

    const referencesList = referenceUrls && referenceUrls.length > 0
      ? referenceUrls.map(u => `<li style="margin-bottom: 6px;"><a href="${u}" target="_blank" style="color: #4da6ff; text-decoration: none;">${u}</a></li>`).join('')
      : '<li>Не указано</li>'

    const filesList = files && files.length > 0
      ? files.map(f => `<li style="margin-bottom: 6px;"><b>${f.filename}</b> <span style="color:#888888;">(${(f.data.length / 1024).toFixed(1)} КБ)</span></li>`).join('')
      : '<li>Файлы не прикреплены</li>'

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #222222;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #222222; padding-bottom: 20px;">
          <h1 style="font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 0; color: #ffffff;">KVAZAR</h1>
          <p style="font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px;">Новая заявка с сайта</p>
        </div>

        <div style="background-color: #111111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888; text-transform: uppercase;">Контакт для связи:</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; word-break: break-all;">${contact}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 14px; width: 40%;">Имя / Компания:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px; font-weight: 500;">${name || 'Не указано'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 14px;">Режим разработки:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px; font-weight: bold;">${devMode || 'AI-Сборка (-30%)'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 14px;">Планируемый бюджет:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px; font-weight: 500;">${budget || 'Не указано'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 14px; vertical-align: top;">Интересующие услуги:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px;">
              <ul style="margin: 0; padding-left: 18px;">${servicesList}</ul>
            </td>
          </tr>
        </table>

        <div style="background-color: #111111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888; text-transform: uppercase;">Дизайн-референсы (понравившиеся сайты):</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 15px; color: #ffffff;">${referencesList}</ul>
        </div>

        <div style="background-color: #111111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888; text-transform: uppercase;">Прикрепленные файлы:</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 15px; color: #ffffff;">${filesList}</ul>
        </div>

        <div style="background-color: #111111; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888; text-transform: uppercase;">Задача проекта:</p>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #e0e0e0; white-space: pre-wrap;">${project || 'Не указано'}</p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #555555; border-top: 1px solid #1a1a1a; pt: 15px; padding-top: 15px;">
          Отправлено с IP: ${ip} • Время: ${new Date().toLocaleString('ru-RU')}
        </div>
      </div>
    `

    // Отправка письма
    await transporter.sendMail({
      from: `"KVAZAR Studio" <${smtpUser}>`,
      to: mailTo,
      subject: `⚡ Бриф от: ${name || contact} [KVAZAR]`,
      text: `Новый бриф от ${contact}\nРежим: ${devMode || 'AI-Сборка (-30%)'}\nИмя: ${name}\nБюджет: ${budget}\nУслуги: ${(services || []).join(', ')}\nСайты: ${(referenceUrls || []).join(', ')}\nФайлы: ${files.map(f => f.filename).join(', ')}\nЗадача: ${project}`,
      html: htmlContent,
      attachments: files.map(f => ({
        filename: f.filename,
        content: f.data,
        contentType: f.contentType
      }))
    })

    // Фиксируем успешную отправку
    record.successCount++
    record.lastSuccessTime = Date.now()

    return {
      success: true,
      message: 'Бриф успешно отправлен на корпоративную почту'
    }
  } catch (err: unknown) {
    console.error('API Error:', err)
    
    if (err instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Ошибка валидации полей',
        data: err.issues
      })
    }
    
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Ошибка при отправке письма. Пожалуйста, попробуйте позже.'
    })
  }
})

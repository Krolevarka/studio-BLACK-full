import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Тесты API отправки брифа на почту: server/api/contact.post.ts
 *
 * Подход: эндпоинт полностью изолирован от рантайма.
 *  - h3-глобалы (getHeader/readBody/readMultipartFormData/getRequestIP/useRuntimeConfig/createError)
 *    подменяются через vi.stubGlobal и читают мутабельные переменные ниже — так каждый тест
 *    задаёт свой Origin/Host, тело запроса, IP и runtimeConfig.
 *  - nodemailer замокан: реальная почта не отправляется, но мы проверяем, ЧТО именно
 *    ушло бы в письмо (to/subject/html/attachments).
 */

// nodemailer.createTransport().sendMail — единственная точка реальной отправки.
const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn() }))
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: sendMailMock })
  }
}))

// --- Мутабельное состояние окружения запроса (сбрасывается в beforeEach) ---
interface MultipartPart {
  name?: string
  filename?: string
  type?: string
  data: Buffer
}

let headers: Record<string, string>
let body: Record<string, unknown>
let multipart: MultipartPart[] | null
let requestIp: string
let runtimeConfig: Record<string, unknown>

// Уникальный IP на каждый тест, чтобы модульный rate-limit одного теста
// не влиял на другие (карта лимитов живёт на уровне модуля эндпоинта).
let ipCounter = 0

const createErrorStub = (opts: {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: unknown
}) => Object.assign(new Error(opts.message ?? opts.statusMessage ?? 'Error'), opts)

vi.stubGlobal('getHeader', (_event: unknown, name: string) => headers[name.toLowerCase()])
vi.stubGlobal('getRequestIP', () => requestIp)
vi.stubGlobal('readBody', async () => body)
vi.stubGlobal('readMultipartFormData', async () => multipart)
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('createError', createErrorStub)

// Импорт после стабов: на верхнем уровне модуля вызывается defineEventHandler (застаблен в setup.ts).
import handler from '../../server/api/contact.post'

const callHandler = (): Promise<{ success: boolean; message: string }> =>
  (handler as (event: unknown) => Promise<{ success: boolean; message: string }>)({})

beforeEach(() => {
  sendMailMock.mockReset()
  sendMailMock.mockResolvedValue({ messageId: 'test-message-id' })

  requestIp = `10.0.0.${++ipCounter}`

  // По умолчанию: валидный совпадающий Origin/Host (CSRF-проверка проходит) и JSON-тело.
  headers = {
    origin: 'https://kvazar.studio',
    host: 'kvazar.studio',
    'content-type': 'application/json'
  }

  body = {
    name: 'Иван',
    services: ['Дизайн', 'Frontend'],
    project: 'Премиальный лендинг',
    budget: '500000',
    contact: 'client@example.com',
    devMode: 'AI-Сборка (-30%)',
    referenceUrls: ['https://awwwards.com']
  }

  multipart = null

  runtimeConfig = {
    smtpHost: 'smtp.test.local',
    smtpPort: '587',
    smtpSecure: 'false',
    smtpUser: 'studio@kvazar.studio',
    smtpPass: 'app-password-1234',
    mailTo: 'inbox@kvazar.studio'
  }
})

describe('POST /api/contact — успешная отправка', () => {
  it('принимает валидный JSON-бриф и отправляет письмо один раз', async () => {
    const result = await callHandler()

    expect(result).toEqual({
      success: true,
      message: 'Бриф успешно отправлен на корпоративную почту'
    })
    expect(sendMailMock).toHaveBeenCalledTimes(1)
  })

  it('формирует письмо с корректными to / subject / текстом заявки', async () => {
    await callHandler()

    const mail = sendMailMock.mock.calls[0][0]
    expect(mail.to).toBe('inbox@kvazar.studio')
    expect(mail.from).toContain('studio@kvazar.studio')
    expect(mail.subject).toContain('Иван')
    expect(mail.html).toContain('client@example.com')
    expect(mail.html).toContain('Дизайн')
    expect(mail.html).toContain('Премиальный лендинг')
  })

  it('падает обратно на contact в теме письма, если имя не указано', async () => {
    body = { contact: 'noname@example.com' }
    await callHandler()

    const mail = sendMailMock.mock.calls[0][0]
    expect(mail.subject).toContain('noname@example.com')
  })
})

describe('POST /api/contact — валидация (Zod)', () => {
  it('отклоняет запрос без обязательного поля contact (400)', async () => {
    body = { name: 'Иван' }
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('отклоняет некорректную (не http/https) ссылку-референс (400)', async () => {
    body = { contact: 'client@example.com', referenceUrls: ['javascript:alert(1)'] }
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('отклоняет неизвестные поля (schema .strict()) (400)', async () => {
    body = { contact: 'client@example.com', hacker: 'inject' }
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('отклоняет слишком длинное поле contact (>500) (400)', async () => {
    body = { contact: 'x'.repeat(501) }
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/contact — безопасность', () => {
  it('блокирует запрос при несовпадении Origin и Host (403 CSRF)', async () => {
    headers.origin = 'https://evil.com'
    headers.host = 'kvazar.studio'
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 403 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('блокирует запрос с некорректным Origin URL (403)', async () => {
    headers.origin = 'not-a-valid-url'
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 403 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('экранирует HTML в пользовательских данных (защита от инъекций)', async () => {
    body = { contact: '<script>alert(1)</script>', name: '<b>bold</b>' }
    await callHandler()

    const mail = sendMailMock.mock.calls[0][0]
    expect(mail.html).not.toContain('<script>alert(1)</script>')
    expect(mail.html).not.toContain('<b>bold</b>')
    expect(mail.html).toContain('&lt;script&gt;')
    expect(mail.html).toContain('&lt;b&gt;bold&lt;/b&gt;')
  })
})

describe('POST /api/contact — конфигурация SMTP', () => {
  it('возвращает 500, если SMTP не настроен (нет user/pass)', async () => {
    runtimeConfig.smtpUser = ''
    runtimeConfig.smtpPass = ''
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 500 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('возвращает 500, если в pass остался плейсхолдер из .env.example', async () => {
    runtimeConfig.smtpPass = 'ваш_16_значный_пароль_приложения'
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 500 })
    expect(sendMailMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/contact — rate limiting', () => {
  it('блокирует третью отправку с одного IP за 15 минут (429)', async () => {
    // Один и тот же IP на все три попытки в рамках теста.
    requestIp = '203.0.113.77'

    await expect(callHandler()).resolves.toMatchObject({ success: true })
    await expect(callHandler()).resolves.toMatchObject({ success: true })
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 429 })

    expect(sendMailMock).toHaveBeenCalledTimes(2)
  })
})

describe('POST /api/contact — сбой отправки письма', () => {
  it('пробрасывает 500, если nodemailer.sendMail упал', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP connection refused'))
    await expect(callHandler()).rejects.toMatchObject({ statusCode: 500 })
  })
})

describe('POST /api/contact — multipart/form-data', () => {
  it('парсит multipart-поля и отправляет письмо', async () => {
    headers['content-type'] = 'multipart/form-data; boundary=----test'
    multipart = [
      { name: 'contact', data: Buffer.from('multi@example.com', 'utf-8') },
      { name: 'name', data: Buffer.from('Компания X', 'utf-8') },
      { name: 'services', data: Buffer.from('3D', 'utf-8') },
      { name: 'referenceUrls', data: Buffer.from('https://dribbble.com', 'utf-8') }
    ]

    const result = await callHandler()

    expect(result.success).toBe(true)
    const mail = sendMailMock.mock.calls[0][0]
    expect(mail.html).toContain('multi@example.com')
    expect(mail.html).toContain('3D')
  })

  it('прикрепляет загруженный файл к письму', async () => {
    headers['content-type'] = 'multipart/form-data; boundary=----test'
    multipart = [
      { name: 'contact', data: Buffer.from('files@example.com', 'utf-8') },
      { name: 'files', filename: 'brief.pdf', type: 'application/pdf', data: Buffer.from('PDFDATA', 'utf-8') }
    ]

    await callHandler()

    const mail = sendMailMock.mock.calls[0][0]
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].filename).toBe('brief.pdf')
  })
})

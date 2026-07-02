import { vi } from 'vitest'

/**
 * Эндпоинт `server/api/contact.post.ts` собран на автоимпортах Nitro/h3
 * (`defineEventHandler`, `getHeader`, `readBody`, ...). В отрыве от рантайма Nuxt
 * этих глобалов нет, поэтому единственный вызов, который срабатывает уже при импорте
 * модуля (`defineEventHandler(...)` на верхнем уровне), стабаем здесь — до того,
 * как тестовый файл импортирует эндпоинт. Он просто возвращает переданный обработчик
 * как есть, чтобы в тесте можно было вызвать его напрямую с фейковым event.
 *
 * Остальные h3-глобалы (getHeader/readBody/...) читаются уже внутри обработчика
 * во время вызова, поэтому их подменяем per-test в самом тесте (beforeEach).
 */
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

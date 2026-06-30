import type { PriceOption } from '~/types/organic'

interface ProductBuilderModule {
  id: string
  name: string
  price: number
  radiusOffset: number
  description: string
}

const productModules: ProductBuilderModule[] = [
  {
    id: 'prototype',
    name: 'Прототип',
    price: 150000,
    radiusOffset: 0,
    description: 'Сценарии, структура, пользовательские роли и кликабельный прототип. Помогает увидеть будущий продукт до разработки.'
  },
  {
    id: 'uiux',
    name: 'UI/UX',
    price: 250000,
    radiusOffset: 20,
    description: 'Дизайн ключевых экранов, адаптивные состояния, компоненты и визуальная система интерфейса.'
  },
  {
    id: 'frontend',
    name: 'Frontend',
    price: 450000,
    radiusOffset: -10,
    description: 'Клиентская часть приложения: верстка, интерактивные состояния, анимации и подключение к API.'
  },
  {
    id: 'backend',
    name: 'Backend',
    price: 650000,
    radiusOffset: 10,
    description: 'Серверная логика, API, база данных, авторизация, роли пользователей и админские сценарии.'
  },
  {
    id: 'production',
    name: 'Запуск',
    price: 200000,
    radiusOffset: -20,
    description: 'Production-инфраструктура: Docker, CI/CD, домен, сервер, Nginx, базовый мониторинг и передача в поддержку.'
  }
]

export const productModuleNames = productModules.map(item => item.name)

export function createProductBuilderOptions(isMobile = false): PriceOption[] {
  const step = Math.PI * 2 / productModules.length

  return productModules.map((item, index) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    selected: false,
    angle: isMobile ? 0 : step * index,
    radiusOffset: isMobile ? 0 : item.radiusOffset,
    description: item.description
  }))
}

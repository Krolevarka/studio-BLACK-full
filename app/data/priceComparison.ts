export interface ComparisonItem {
  id: string
  title: string
  aiValue: string
  aiDescription: string
  manualValue: string
  manualDescription: string
}

export interface PosterTypoRow {
  id: string
  giantText: string
  align: 'left' | 'center' | 'right'
  offsetClass?: string
  editorial?: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline'
    tag: string
    headline: string
    body: string
    stat?: string
  }
}

export const posterRows: PosterTypoRow[] = [
  {
    id: 'row-ai',
    giantText: 'AI • ARCH',
    align: 'left',
    editorial: {
      position: 'inline',
      tag: '01 / НОВЫЙ СТАНДАРТ',
      headline: 'Отказ от рутинного кодинга',
      body: 'Нейросети собирают фундамент и базовую верстку за секунды. Мы не тратим ваш бюджет на механический набор типового кода.',
      stat: '-30% БЮДЖЕТА'
    }
  },
  {
    id: 'row-senior',
    giantText: 'SENIOR',
    align: 'right',
    editorial: {
      position: 'inline',
      tag: '02 / ЧИСТАЯ АРХИТЕКТУРА',
      headline: 'Абсолютный надзор Senior-инженеров',
      body: 'AI работает в границах паттернов studio-BLACK. Ведущие архитекторы проектируют систему и проводят строгий аудит каждой строчки.',
      stat: '0% ТЕХДОЛГА'
    }
  },
  {
    id: 'row-speed',
    giantText: 'SPEED ×2',
    align: 'left',
    editorial: {
      position: 'inline',
      tag: '03 / СКОРОСТЬ ВЫХОДА',
      headline: 'Релиз в 2 раза быстрее',
      body: 'Мгновенная генерация модулей позволяет сократить общий цикл разработки вдвое. Ваш продукт выходит на рынок рекордными темпами.',
      stat: 'х2 СКОРОСТЬ'
    }
  },
  {
    id: 'row-zero',
    giantText: '0% RISKS',
    align: 'right',
    editorial: {
      position: 'inline',
      tag: '04 / БЕЗ КОМПРОМИССОВ',
      headline: 'Инвестиции в бизнес-логику',
      body: 'Сэкономленные ресурсы направляются на уникальные визуальные решения и продуктовую ценность, создающую вау-эффект у пользователей.',
      stat: '100% ПРЕМИУМ'
    }
  }
]

export const comparisonList: ComparisonItem[] = [
  {
    id: 'architecture',
    title: 'Архитектура и реализация',
    aiValue: 'AI + Senior Архитекторы',
    aiDescription: 'Генерация чистого, модульного кода по проверенным паттернам studio-BLACK под строгим надзором Senior-инженеров. Исключает человеческий фактор в рутинных задачах.',
    manualValue: 'Ручной набор с нуля',
    manualDescription: 'Классическое написание каждого файла вручную командой разработчиков. Значительно больше времени уходит на базовую вёрстку и бойлерплейт.'
  },
  {
    id: 'speed',
    title: 'Скорость выхода на рынок',
    aiValue: 'В 2 раза быстрее',
    aiDescription: 'Мгновенная сборка фундамента и UI-компонентов сокращает общий цикл разработки вдвое. Вы получаете готовый релизный продукт в рекордные сроки.',
    manualValue: 'Стандартные спринты',
    manualDescription: 'Традиционные двухнедельные итерации с последовательной разработкой, ручным тестированием и длительными согласованиями каждого этапа.'
  },
  {
    id: 'cost',
    title: 'Бюджет и инвестиции',
    aiValue: '-30% к стоимости',
    aiDescription: 'Оптимизация сотен часов рутинного кодирования снижает итоговый бюджет на 30%. Вы инвестируете исключительно в архитектуру, дизайн и уникальную бизнес-логику.',
    manualValue: '100% бюджета',
    manualDescription: 'Полная оплата каждого часа работы middle и senior инженеров над стандартными задачами, которые AI выполняет за секунды.'
  },
  {
    id: 'security',
    title: 'Надежность и безопасность',
    aiValue: 'Двойной контроль и 0 рисков',
    aiDescription: 'AI использует только верифицированные безопасные конструкции, а Senior-архитекторы проводят строгий ручной аудит и Code Review перед деплоем.',
    manualValue: 'Классический QA-аудит',
    manualDescription: 'Стандартный процесс тестирования, где человеческая усталость или невнимательность могут приводить к регрессионным багам и уязвимостям.'
  }
]


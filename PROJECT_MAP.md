# 🌟 KVAZAR (studio-BLACK) — AI Codebase Index

> Референсная карта проекта для LLM. Архитектура: Nuxt 4, Vue 3.5+, TypeScript (No-Any), Tailwind CSS v4, GSAP, Three.js/WebGL (60fps). Ключевые принципы: **Device-Split** (разделение десктоп/мобайл UI), **Strict-Cleanup** (очистка хуков/таймеров в `onBeforeUnmount`).

---

## 1. 📂 Root & Server Layer
- [README.md](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/README.md) — Документация шаблона Nuxt Minimal Starter.
- [gemini.md](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/gemini.md) — **Высший приоритет правил ИИ**: Device-Split, Strict-Cleanup, No-Any TS, стандарты 60fps.
- [nuxt.config.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/nuxt.config.ts) — Конфиг Nuxt 4: подключение плагинов, CSS, оптимизация бандла.
- [package.json](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/package.json) — Манифест зависимостей (`nuxt`, `vue`, `gsap`, `@tailwindcss/vite`, `three`, `lenis`).
- [points.json](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/points.json) — Массив базовых геом. координат (92 точки) для интерполяции/форм.
- [tsconfig.json](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/tsconfig.json) — Конфиг TypeScript (strict mode, алиасы путей).
- [public/favicon.ico](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/public/favicon.ico) — Иконка веб-приложения.
- [public/robots.txt](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/public/robots.txt) — SEO-инструкции для поисковых систем.
- [server/api/contact.post.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/server/api/contact.post.ts) — API-эндпоинт приема заявок формы контактов (валидация данных, отправка уведомлений).

---

## 2. 🧱 Core App & Layouts (`app/`)
- [app/app.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/app.vue) — Главный корневой компонент (`Preloader`, `NuxtLayout`, SEO/OpenGraph метатеги, глобальные CSS-токены переходов `:root --reveal-*`).
- [app/assets/css/main.css](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/assets/css/main.css) — Базовые стили Tailwind CSS v4, шрифты Wix Madefor, Fluid Typography (`clamp` в `rem`), утилита матового стекла `.glass`.
- [app/layouts/default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue) — Основной макет страницы: обертка над Header, контентом, `UiKineticText` и подвалом.
- [app/pages/index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue) — Главная (и единственная) страница-лендинг студии KVAZAR, агрегирующая все секции.
- [app/plugins/smooth-scroll.client.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/plugins/smooth-scroll.client.ts) — Клиентский плагин плавного скролла Lenis, синхронизированный с `gsap.ticker` и `ScrollTrigger`.
- [app/data/approachSteps.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/data/approachSteps.ts) — Контент из 5 этапов методологии студии (Бриф, Генерация, Контроль, Разработка, Релиз).

---

## 3. 🖥️📱 Sections & Device-Split (`app/components/sections/`)

### Глобальные секции-обертки (Рендеринг через `<DeviceSwitch>`)
- [app/components/sections/SectionHero.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionHero.vue) — Главный экран.
- [app/components/sections/SectionAbout.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionAbout.vue) — О философии студии.
- [app/components/sections/SectionPortfolio.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionPortfolio.vue) — Сетка кейсов.
- [app/components/sections/SectionApproach.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionApproach.vue) — Методология работы.
- [app/components/sections/SectionPrice.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionPrice.vue) — Интерактивный калькулятор стоимости.
- [app/components/sections/SectionContact.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionContact.vue) — Форма обратной связи.

### Десктопные реализации (`desktop/`)
- [app/components/sections/desktop/HeroContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/HeroContent.vue) — Десктопный Hero с интерактивными эффектами заголовка.
- [app/components/sections/desktop/AboutContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/AboutContent.vue) — Десктопный блок философии бренда.
- [app/components/sections/desktop/PortfolioContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PortfolioContent.vue) — Десктопная галерея проектов.
- [app/components/sections/desktop/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/ApproachContent.vue) — Десктопные шаги разработки с анимацией прохождения.
- [app/components/sections/desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue) — Десктопная 3D/орбитальная физическая сцена калькулятора.
- [app/components/sections/desktop/ContactContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/ContactContent.vue) — Десктопный контейнер формы контактов.
- [app/components/sections/desktop/TechStack.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/TechStack.vue) — Визуализация стека технологий студии.

### Мобильные реализации (`mobile/`)
- [app/components/sections/mobile/HeroContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/HeroContent.vue) — Тач-оптимизированный Hero.
- [app/components/sections/mobile/AboutContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/AboutContent.vue) — Мобильный блок о студии.
- [app/components/sections/mobile/PortfolioContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/PortfolioContent.vue) — Компактный список/слайдер кейсов.
- [app/components/sections/mobile/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/ApproachContent.vue) — Вертикальная лесенка этапов работ.
- [app/components/sections/mobile/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/PriceContent.vue) — Тач-версия расчета стоимости.
- [app/components/sections/mobile/ContactContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/ContactContent.vue) — Мобильная форма обратной связи.
- [app/components/sections/mobile/TechStack.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/TechStack.vue) — Список используемых технологий.
- [app/components/sections/mobile/MobileContactStepInput.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/MobileContactStepInput.vue) — Мобильный шаг ввода полей заявки.
- [app/components/sections/mobile/MobileContactStepPlaques.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/MobileContactStepPlaques.vue) — Мобильный выбор тегов интересов.

### Подкомпоненты секций контактов и цен (`contact/` & `price/`)
- [app/components/sections/contact/ContactStepInput.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/contact/ContactStepInput.vue) — Общий шаг ввода имени/контактов/текста.
- [app/components/sections/contact/ContactStepPlaques.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/contact/ContactStepPlaques.vue) — Выбор тематических плашек проекта.
- [app/components/sections/contact/ContactStepSuccess.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/contact/ContactStepSuccess.vue) — Состояние отправленной заявки.
- [app/components/sections/price/PriceCoreDisplay.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceCoreDisplay.vue) — Центральный индикатор итоговой суммы в калькуляторе.
- [app/components/sections/price/PriceModal.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceModal.vue) — Модальное окно детализации коммерческого предложения.
- [app/components/sections/price/PriceSatellite.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceSatellite.vue) — Интерактивный спутник-плашка конкретной опции в калькуляторе.

---

## 4. 🎨 Shared UI Components (`app/components/`)
- [app/components/DeviceSwitch.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/DeviceSwitch.vue) — Архитектурный коммутатор **Device-Split** (рендер `desktop` или `mobile` ветки).
- [app/components/LogoKvazar.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/LogoKvazar.vue) — Генеративный векторный логотип KVAZAR с анимацией частиц.
- [app/components/LogoText.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/LogoText.vue) — Текстовый логотип с эффектом проявления.
- [app/components/OrganicCore.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/OrganicCore.vue) — Главный интерактивный 3D WebGL-визуализатор (Three.js органическое ядро сайта).
- [app/components/Preloader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/Preloader.vue) — Стартовый прелоадер приложения с прогресс-баром.
- [app/components/UiButton.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiButton.vue) — Премиальная кнопка с магнитным ховером (`role="button"`, доступность).
- [app/components/UiCursor.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiCursor.vue) — Каталитический курсор со смазывающимся шлейфом.
- [app/components/UiKineticText.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiKineticText.vue) — Текстовый блок с инерционным искажением при скролле.
- [app/components/UiScrollHint.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiScrollHint.vue) — Анимированный индикатор призыва к скроллу вниз.
- [app/components/desktop/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/LayoutHeader.vue) — Десктопный верхний бар навигации.
- [app/components/desktop/PhysicsMenu.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/PhysicsMenu.vue) — Десктопное меню с физикой гравитации пунктов.
- [app/components/mobile/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/mobile/LayoutHeader.vue) — Мобильный Header с триггером бургер-меню.
- [app/components/mobile/MobileMenu.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/mobile/MobileMenu.vue) — Полноэкранное мобильное навигационное меню.

---

## 5. 🪝 Composables (`app/composables/`)

### Глобальные стейты и утилиты
- [app/composables/useContactForm.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useContactForm.ts) — Стейт-машина формы контактов, валидация полей, POST-отправка в `/api/contact`.
- [app/composables/useCursor.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useCursor.ts) — Отслеживание координат мыши, масштабирование над кликабельными зонами.
- [app/composables/useDeviceSwitch.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useDeviceSwitch.ts) — Детектор тач/десктоп сред, флаги `needsHeavyAnimations`, `needsHoverEffects`.
- [app/composables/useEventBus.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useEventBus.ts) — Типизированный EventBus с автоотпиской в `onBeforeUnmount` (Strict-Cleanup).
- [app/composables/useMenuVisibility.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useMenuVisibility.ts) — Реактивное скрытие/появление меню при направлениях прокрутки.
- [app/composables/useMouseSmudge.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useMouseSmudge.ts) — Математика жидкостного следа за курсором мыши.
- [app/composables/useMouseVelocity.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useMouseVelocity.ts) — Расчет векторов скорости курсора для кинетической деформации UI.
- [app/composables/useOrganicCore.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useOrganicCore.ts) — Провайдер экземпляра Three.js-сцены органического ядра.
- [app/composables/usePhysicsMenu.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/usePhysicsMenu.ts) — Расчет сил гравитации и отталкивания элементов в меню десктопа.
- [app/composables/usePriceDrag.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/usePriceDrag.ts) — Высокоуровневое управление захватом спутников в калькуляторе цен.
- [app/composables/useSectionReveal.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useSectionReveal.ts) — IntersectionObserver для классов `.reveal-item.is-revealed`.
- [app/composables/useSectionTransition.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useSectionTransition.ts) — Управление анимациями смены активных секций лендинга.

### Подсистема WebGL Ядра (`organic/`)
- [app/composables/organic/useOrganicMenu.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicMenu.ts) — Реакция 3D-ядра на наведение на пункты меню.
- [app/composables/organic/useOrganicState.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicState.ts) — Хранилище текущего морф-состояния 3D фигуры.
- [app/composables/organic/useOrganicSync.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicSync.ts) — Синхронизация вращения/формы 3D-ядра со скроллом страницы.
- [app/composables/organic/usePreloader.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/usePreloader.ts) — Контроллер этапов загрузки геометрии и текстур.

### Подсистема Калькулятора Цен (`price/`)
- [app/composables/price/usePriceCollision.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePriceCollision.ts) — Детектор упругих столкновений орбитальных спутников.
- [app/composables/price/usePriceDragGesture.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePriceDragGesture.ts) — Низкоуровневый парсер PointerEvents для перетаскивания.
- [app/composables/price/usePricePhysics.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePricePhysics.ts) — Итератор физического движка (Verlet / центростремительные силы) на `requestAnimationFrame`.

---

## 6. 🧮 Math, Workers & Types (`app/utils/` & `app/types/`)

### Математика и Воркеры
- [app/utils/animation.config.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/utils/animation.config.ts) — Константы длительностей и easing-функций GSAP.
- [app/utils/format.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/utils/format.ts) — Числовые хелперы (разбиение тысяч, валютные префиксы).
- [app/utils/optimalShift.worker.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/utils/optimalShift.worker.ts) — Web Worker для тяжелых расчетов смещения вершин без фризов 60fps.
- [app/utils/organicStates.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/utils/organicStates.ts) — Конфигурации целевых координат полигонов для состояний OrganicCore.
- [app/utils/shapeMath.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/utils/shapeMath.ts) — Математическое ядро: векторная алгебра, интерполяция Безье, коллизии сфер.

### Декларации типов (`types/`)
- [app/types/device.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/types/device.ts) — Типы режимов DeviceSwitch (`desktop` | `mobile`).
- [app/types/lenis.d.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/types/lenis.d.ts) — Интерфейсы скролл-инстанса Lenis.
- [app/types/organic.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/types/organic.ts) — Типизация пропсов, шейдеров и морф-таргетов 3D-ядра.
- [app/types/price.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/types/price.ts) — Интерфейсы элементов сметы, сателлитов и активных опций.

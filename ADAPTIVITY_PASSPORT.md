# 📱🖥️ Паспорт адаптивности проекта KVAZAR (studio-BLACK)

> Архитектурный паспорт адаптивности кодовой базы под мобильные устройства, планшеты и малые десктопные экраны (ноутбуки 13–14" с разрешением от 1280×800).

---

## 🏛️ Архитектурная концепция (Два столпа адаптивности)

В проекте **полностью отсутствуют стандартные респонсив-классы Tailwind** (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`). Вместо громоздких медиа-запросов и скрытия элементов (`hidden md:flex`) адаптация строится на двух детерминированных механизмах:

1. **Вертикальное физическое ветвление (Device-Split):**
   На уровне компонентной архитектуры UI разделяется на два независимых физических дерева (`desktop/` и `mobile/`). Переключение происходит в точке входа через глобальный коммутатор `<DeviceSwitch>`. В DOM монтируется **только активное дерево**, что исключает просадки FPS и утечки памяти на тач-устройстве.

2. **Горизонтальное пропорциональное масштабирование (Fluid Desktop Scaling):**
   Для десктопной ветки адаптация под малые экраны ноутбуков (13.3" / 14", 1280×800, 1366×768) и мониторы высокого разрешения (2K/4K) управляется **единой математической формулой** на корневом теге `<html>`:
   ```css
   font-size: clamp(10px, min(0.833333vw, 1.481481vh), 16px) !important;
   ```
   Поскольку абсолютно все размеры, отступы, шрифты и сетки внутри десктопных компонентов заданы в относительных единицах (`rem`, `%`, `vh`, `vw`), изменение размера шрифта на `<html>` **автоматически и пропорционально сжимает весь интерфейс целиком** под любое разрешение экрана без единого излома вёрстки.

---

## 📜 Паспорт адаптивности по файлам проекта

### I. Ядро стилизации и корневые конфигурации

- **[app/assets/css/main.css](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/assets/css/main.css)**
  - *Механика:* Содержит главное правило `@media (min-width: 1024px)` с формулой двумерного `clamp()`. Ограничивает базовый `rem` диапазоном от `10px` до `16px`. Гарантирует, что на экране ноутбука 1280×800 весь интерфейс уменьшится в ~1.3 раза пропорционально, сохраняя идеальные воздух и отступы дизайнерской сетки.
- **[app/app.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/app.vue)**
  - *Механика:* Отрабатывает доступность через `@media (prefers-reduced-motion: reduce)` (мгновенное проявление `.reveal-item` без трансформаций по оси Y). Через `@supports (-webkit-touch-callout: none)` отключает тяжелые CSS-фильтры размытия (`blur`) при переходах на iOS Safari ради удержания стабильных 60fps.

---

### II. Движок коммутации устройств (Device-Split)

- **[app/composables/useDeviceSwitch.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useDeviceSwitch.ts)**
  - *Механика:* Клиент-серверный провайдер контекста устройства (на базе `@nuxtjs/device`). Вычисляет `deviceType` (`mobile` | `tablet` | `desktop`). Выставляет глобальные реактивные флаги: `needsHeavyAnimations`, `needsCursor`, `needsHoverEffects`. На тач-экранах они принимают `false`, блокируя генерацию ховер-событий.
- **[app/components/DeviceSwitch.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/DeviceSwitch.vue)**
  - *Механика:* Глобальный полиморфный рендерер `<component :is="activeComponent" />`. Принимает компоненты `:desktop`, `:mobile` (и опционально `:tablet`). Физически изолирует деревья: мобильный пользователь никогда не загрузит в DOM десктопное меню или тяжелую логику гравитации.

---

### III. Точки ветвления (Секции-обёртки `Section*.vue`)

Во всех 6 обёртках реализована чистая маршрутизация рендера через `<DeviceSwitch>`:
- **[app/components/sections/SectionHero.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionHero.vue)** — переключает `desktop/HeroContent` ↔ `mobile/HeroContent`.
- **[app/components/sections/SectionAbout.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionAbout.vue)** — переключает `desktop/AboutContent` ↔ `mobile/AboutContent`.
- **[app/components/sections/SectionPortfolio.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionPortfolio.vue)** — переключает `desktop/PortfolioContent` ↔ `mobile/PortfolioContent`.
- **[app/components/sections/SectionApproach.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionApproach.vue)** — переключает `desktop/ApproachContent` ↔ `mobile/ApproachContent`.
- **[app/components/sections/SectionPrice.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionPrice.vue)** — переключает `desktop/PriceContent` ↔ `mobile/PriceContent`.
- **[app/components/sections/SectionContact.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/SectionContact.vue)** — переключает `desktop/ContactContent` ↔ `mobile/ContactContent`.

---

### IV. Макеты и глобальные UI-элементы

- **[app/layouts/default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue)**
  - *Механика:* Подписан на `useDeviceSwitch()`. На мобильных устройствах переключает паддинги основного контейнера, скрывает десктопные подсказки скролла (`UiScrollHint`) и отключает кинетическое смещение фонового текста.
- **[app/pages/index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue)**
  - *Механика:* Агрегатор секций. Отслеживает `deviceType` для корректного распределения пропсов видимости меню и управления жизненным циклом прелоадера.
- **[app/components/UiCursor.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiCursor.vue)**
  - *Механика:* Читает флаг `needsCursor`. Если приложение запущено на смартфоне или планшете с тачскрином, Canvas-контейнер каталитического следа полностью уничтожается, освобождая поток рендеринга.
- **[app/components/UiKineticText.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiKineticText.vue)**
  - *Механика:* При `!needsHeavyAnimations` (на мобильных) выключает GSAP-твины искажения букв при скролле, оставляя статичный текст.
- **[app/components/UiButton.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiButton.vue)**
  - *Механика:* На десктопах активирует магнитное притяжение к курсору. На мобильных переключается в классический `role="button"` с минимальной высотой кликабельной зоны 44×44px.

---

### V. Подсистема 3D WebGL Ядра (`OrganicCore`)

- **[app/components/OrganicCore.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/OrganicCore.vue)**
  - *Механика:* При рендере на мобильных устройствах динамически снижает детализацию полигональной сетки 3D-сферы (Three.js), увеличивает угол обзора (FOV камеры) для компенсации узкого экрана и отключает тяжелые проходы шейдерного блура.
- **[app/composables/organic/useOrganicSync.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicSync.ts)**
  - *Механика:* Отслеживает `window.innerWidth`. При разрешениях малых десктопов (1280–1366px) пересчитывает координаты 3D-орбиты ядра так, чтобы оно смещалось левее/правее и не перекрывало текстовые блоки секций.
- **[app/composables/organic/useOrganicMenu.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicMenu.ts)**
  - *Механика:* Блокирует расчет лучевого коллизионного поиска (Raycasting) мыши по вершинам 3D-ядра на мобильных устройствах.

---

### VI. Физическая сцена калькулятора цен (`price/`)

- **[app/components/sections/desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue)**
  - *Механика:* В хуке `onMounted` запрашивает `window.innerWidth` и вычисляет базовый масштаб сцены. На компактных экранах ноутбуков радиус орбит спутников калькулятора пропорционально сжимается.
- **[app/composables/price/usePricePhysics.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePricePhysics.ts)** & **[usePriceCollision.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePriceCollision.ts)**
  - *Механика:* Физический движок (Verlet integration) отталкивания плашек от границ экрана. Границы коллизий динамически привязаны к текущим `innerWidth` / `innerHeight`.
- **[app/composables/price/usePriceDragGesture.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePriceDragGesture.ts)**
  - *Механика:* Обработчик захвата спутников на базе `PointerEvents`, бесшовно работающий как с мышью на ноутбуке, так и с тач-жестом на планшете.

---

### VII. Десктопные компоненты и их адаптация под ноутбуки (`desktop/`)

- **[app/components/sections/desktop/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/ApproachContent.vue)**
  - *Механика:* Использует внутренний медиа-запрос `@media (max-height: 700px)` для компактификации отступов между этапами на ноутбуках с небольшой высотой экрана.
- **[app/components/desktop/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/LayoutHeader.vue)** & **[PhysicsMenu.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/PhysicsMenu.vue)**
  - *Механика:* Используют гибкие единицы `rem` и `gap`. При работе Fluid Rem Scaling на 13" ноутбуке вся навигационная панель аккуратно уменьшается, сохраняемые расстояния между пунктами исключают нарезание строк.
- **[app/components/sections/desktop/*Content.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/HeroContent.vue)** (остальные 6 файлов)
  - *Механика:* Построены на вёрстке через `max-w-*`, `rem` и относительные проценты ширины (`w-1/2`, `w-full`). Масштабирование корня `<html>` автоматически подгоняет их под экраны 1280×800.

---

### VIII. Мобильные компоненты (`mobile/`)

- **[app/components/sections/mobile/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/ApproachContent.vue)**
  - *Механика:* Содержит точечные `@media` правила для перестроения таймлайна шагов под сверхмалые ширины смартфонов (320–360px).
- **[app/components/mobile/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/mobile/LayoutHeader.vue)** & **[MobileMenu.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/mobile/MobileMenu.vue)**
  - *Механика:* Полноэкранный оверлей навигации. Привязаны к динамической высоте `dvh` (Dynamic Viewport Height), что предотвращает скрытие пунктов меню за адресной строкой мобильного браузера (Safari / Chrome).
- **[app/components/sections/mobile/*Content.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/HeroContent.vue)** (остальные 8 файлов)
  - *Механика:* Вертикальный одноколоночный стекинг (`flex-col`, `w-full`). Увеличенные тач-таргеты кнопок и инпутов (`min-h-[44px]`). Отсутствие ховер-зависимых подсказок.

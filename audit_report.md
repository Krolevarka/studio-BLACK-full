# 🔬 Аудит кодовой базы studio-BLACK — Полный отчёт (v2)

> **Дата**: 2026-06-24  
> **Стек**: Nuxt 4 · Vue 3.5+ · Composition API · TypeScript · GSAP · Tailwind CSS  
> **Файлов проанализировано**: ~55 (все `.vue`, `.ts` в `app/`)  
> **Ревизия**: v2 — объективный пересмотр

---

## 1. Executive Summary

| Метрика | Оценка |
|---|---|
| **Общая загрязнённость** | 🟡 **Средняя** — чистая поверхность, но под капотом есть проблемы |
| `console.log` / мёртвый debug | ✅ Отсутствует (0 штук) |
| Тип `any` | ✅ Ни одного случая |
| Device-Split | ✅ Строго соблюдён |
| Strict-Cleanup | ⚠️ **2 нарушения** (Preloader, Web Worker) |
| Accessibility (a11y) | 🔴 **Критическое нарушение** — Tab заблокирован глобально |
| Закомментированный код | ✅ Не найдено |
| **Teleport** | 🗑️ Оба на удаление |

**Вердикт**: Визуально кодовая база выглядит чисто — нет `any`, нет `console.log`, нет закомментированных блоков, Device-Split идеален. Но при глубоком анализе обнаруживаются **архитектурные проблемы**: нереактивный стейт с ручной синхронизацией, незавершённый Web Worker, глобальная блокировка Tab (WCAG), подавленные ошибки через try/catch, и магические числа в таймингах. Первая версия отчёта была слишком лояльна к этим вещам.

---

## 2. 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 2.1. [app.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/app.vue#L30-L34) — ГЛОБАЛЬНАЯ БЛОКИРОВКА TAB (Accessibility)

```typescript
const preventTab = (e: KeyboardEvent): void => {
  if (e.key === 'Tab') {
    e.preventDefault()
  }
}
```

| | |
|---|---|
| **Проблема** | Tab заблокирован на ВСЕЙ странице без исключений. Пользователи, полагающиеся на клавиатурную навигацию (screen readers, моторные нарушения), не могут перемещаться по элементам. Это прямое нарушение **WCAG 2.1 Level A** (Success Criterion 2.1.1 Keyboard). |
| **Почему это плохо** | Даже для «иммерсивных» сайтов с нестандартной навигацией блокировка Tab — антипаттерн. Фокус-индикатор можно скрыть CSS (`outline: none` или `:focus-visible`), а переход фокуса по Tab сохранить. |
| **Решение** | Удалить `preventTab`. Если фокусные рамки визуально мешают — использовать `:focus-visible` вместо `:focus` для стилизации, и `outline: none` только на `focus` (не `focus-visible`). |

### 2.2. [Preloader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/Preloader.vue) — **НЕТ `onBeforeUnmount`** (Strict-Cleanup Violation)

```typescript
onMounted(() => {
  on('finish-preloader', () => {
    gsap.to(preloaderRef.value, { /* ... */
      onComplete: () => {
        emit('preloader-done')
        setTimeout(() => { isVisible.value = false }, 100) // ← не очищается
      }
    })
  })
})
// НЕТ onBeforeUnmount!
```

| | |
|---|---|
| **Проблема** | Компонент не имеет `onBeforeUnmount`. GSAP tween на `preloaderRef.value` **не убивается**. `setTimeout` внутри `onComplete` **не очищается**. Если компонент размонтируется во время анимации (HMR, навигация) — GSAP продолжает анимировать detached DOM-элемент. |
| **Решение** | Добавить `onBeforeUnmount(() => { gsap.killTweensOf(preloaderRef.value) })` и сохранить ID таймера для очистки. |

### 2.3. [useOrganicSync.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicSync.ts#L8-L25) — WEB WORKER НИКОГДА НЕ ТЕРМИНИРУЕТСЯ

```typescript
// Module-level state — живёт вечно
let optimalShiftWorker: Worker | null = null;
const workerCallbacks = new Map<number, (offset: number) => void>();

const getWorker = () => {
  if (!optimalShiftWorker) {
    optimalShiftWorker = new Worker(/* ... */);
    // ...
  }
  return optimalShiftWorker;
};
```

| | |
|---|---|
| **Проблема** | Worker создаётся лениво при первом вызове `getWorker()`, но **нигде не вызывается `.terminate()`**. `workerCallbacks` Map растёт при каждом вызове `getBestOffsetAsync()` — если Worker не ответит (ошибка, зависание), callback останется в Map навсегда (memory leak). При HMR Worker не убивается и создаётся новый — **утечка Worker'ов при разработке**. |
| **Решение** | Добавить `terminateWorker()` функцию и вызывать её из `clearSync()` или отдельного lifecycle hook. Добавить timeout для `workerCallbacks` (удалять через 5 сек, если нет ответа). Добавить `import.meta.hot?.dispose(() => optimalShiftWorker?.terminate())`. |

---

## 3. 🟠 АРХИТЕКТУРНЫЕ ПРОБЛЕМЫ

### 3.1. [useOrganicState.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicState.ts#L17-L31) — НЕРЕАКТИВНЫЕ BOOLEAN-ПОЛЯ

```typescript
export interface OrganicCoreState {
  isPreloading: Ref<boolean>     // ← ref (реактивный)
  isAboutActive: boolean          // ← НЕ ref (нереактивный)
  isPortfolioActive: boolean      // ← НЕ ref (нереактивный)
  isApproachActive: boolean       // ← НЕ ref (нереактивный)
  // ...все остальные boolean — тоже plain
}
```

| | |
|---|---|
| **Проблема** | `isPreloading` и `isMenuOpenState` — это `Ref<boolean>`, а все остальные флаги (`isAboutActive`, `isPriceActive`, `isContactActive`, `isTechStackActive`, etc.) — **обычные `boolean`**, не обёрнутые в `ref()`. Это означает, что при их мутации (`s.isAboutActive = true`) **Vue НЕ ЗНАЕТ об изменении**. Код работает только потому, что после каждой мутации вручную вызывается `scheduleSync()`, который через `setTimeout` запускает пересчёт. Если кто-то забудет вызвать `scheduleSync()` — UI молча рассинхронизируется. |
| **Почему не `ref`** | Видимо, осознанное решение для performance: эти поля меняются десятки раз в секунду (каждый кадр анимации), и реактивность добавила бы overhead. Однако это создаёт **хрупкий контракт**: любая мутация ОБЯЗАНА сопровождаться `scheduleSync()`. |
| **Решение** | Задокументировать контракт явно (JSDoc). ИЛИ перейти на `ref()` + `watchEffect` вместо ручного `scheduleSync()` — Vue 3.5+ достаточно быстр для этого. |

### 3.2. [useOrganicSync.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicSync.ts#L343) — ОДИНАКОВЫЙ EASE ДЛЯ РАЗНЫХ ВЕТВЕЙ

```typescript
const duration = s.hoveredTechIndex === -1 ? 0.4 : 0.6;
const ease = s.hoveredTechIndex === -1 ? 'power2.out' : 'power2.out'; // ← ВСЕГДА одно и то же
```

| | |
|---|---|
| **Проблема** | Тернарный оператор с одинаковым результатом в обеих ветвях — мёртвая логика. |
| **Решение** | Упростить до `const ease = 'power2.out'` |

### 3.3. [usePriceDragGesture.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePriceDragGesture.ts#L22-L26) — SILENT TRY/CATCH

```typescript
try {
  const { $lenis } = useNuxtApp()
  lenisInstance = $lenis
} catch (e) {
  // ← Молчаливое подавление
}
```

| | |
|---|---|
| **Проблема** | Если `useNuxtApp()` выбросит ошибку, `lenisInstance` останется `undefined`. Далее по коду: `if (lenisInstance) lenisInstance.stop()` — Lenis не остановится во время drag, и пользователь сможет скроллить одновременно с перетаскиванием. Ошибка будет замаскирована. |
| **Решение** | Убрать try/catch. `useNuxtApp()` в composable, вызываемом из `<script setup>`, не должен падать. Если plugin не загружен — проверять `$lenis` на `undefined` (что уже делается: `if (lenisInstance) lenisInstance.stop()`). |

### 3.4. [useEventBus.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useEventBus.ts#L46-L52) — SILENT TRY/CATCH вокруг `onBeforeUnmount`

```typescript
try {
  onBeforeUnmount(() => {
    listeners.get(event)?.delete(handler)
  })
} catch (e) {
  // If used outside of setup, no auto-cleanup
}
```

| | |
|---|---|
| **Проблема** | Комментарий объясняет замысел, но сам try/catch — грубый паттерн. Vue 3 предоставляет `getCurrentInstance()` для проверки, находимся ли мы в setup-контексте. Также это маскирует **другие** ошибки внутри `onBeforeUnmount`. |
| **Решение** | Заменить try/catch на `if (getCurrentInstance()) { onBeforeUnmount(...) }`. |

---

## 4. 🟡 МЁРТВЫЙ КОД И НЕИСПОЛЬЗУЕМЫЕ ЭКСПОРТЫ

### 4.1. [useNavigation.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useNavigation.ts) — **ПОЛНОСТЬЮ МЁРТВЫЙ ФАЙЛ**

Ни один файл не импортирует. Навигация через EventBus → `'nav-goto'`. 🗑️ **Удалить**.

### 4.2. [types/index.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/types/index.ts) — **ПОЛНОСТЬЮ МЁРТВЫЙ ФАЙЛ**

`NavItem` нигде не импортируется. 🗑️ **Удалить**.

### 4.3. `isOptionSelected` в [useContactForm.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useContactForm.ts#L66) — НЕ ИСПОЛЬЗУЕТСЯ В ШАБЛОНАХ

Деструктурируется в обоих `ContactContent.vue`, но **нигде не применяется в `<template>`**. Подкомпонент `ContactStepPlaques.vue` имеет свою `isSelected()`.

### 4.4. `windowH` в [desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue#L154) — НИКОГДА НЕ ЧИТАЕТСЯ

Обновляется в `resize()`, но нигде не используется.

### 4.5. `triggerDistortion` / `clearDistortion` в [desktop/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/ApproachContent.vue#L159-L168) и [mobile/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/ApproachContent.vue#L155-L164) — НЕ ВЫЗЫВАЮТСЯ ИЗ ШАБЛОНА

Функции определены, но `<template>` не содержит `@mouseenter="triggerDistortion"` / `@mouseleave="clearDistortion"`. Остаток от прошлого рефакторинга.

### 4.6. `const props = defineProps` в [desktop/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/LayoutHeader.vue#L59) — `props` НЕИСПОЛЬЗУЕМАЯ ПЕРЕМЕННАЯ

### 4.7. ScrollTrigger в [desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue#L122) — ИМПОРТ БЕЗ ИСПОЛЬЗОВАНИЯ

Импортируется, регистрируется, чистится в `onBeforeUnmount`, но **ни одного ScrollTrigger не создаётся** в этом компоненте.

### 4.8. Пустой `if ($lenis) {}` в [index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue#L157-L161) — ПУСТОЙ БЛОК

---

## 5. ДУБЛИРОВАНИЕ

### 5.1. `formatPrice` — ТРОЙНОЕ ДУБЛИРОВАНИЕ

| Файл | |
|---|---|
| [PriceCoreDisplay.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceCoreDisplay.vue#L26-L28) | `new Intl.NumberFormat('ru-RU').format(Math.round(price))` |
| [PriceSatellite.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceSatellite.vue#L37-L39) | Идентичная копия |
| [PriceModal.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceModal.vue#L50-L52) | Идентичная копия |

**Решение**: `utils/format.ts` → `export const formatPrice = ...`

### 5.2. Массив `steps` — ДУБЛИРОВАНИЕ (Desktop ↔ Mobile ApproachContent)

5 объектов `{ shortTitle, title, description }` скопированы один в один.

**Решение**: `data/approachSteps.ts`

### 5.3. Easing-функция — ДУБЛИРОВАНИЕ в [index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue)

```typescript
// Строка 92:
easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
// Строка 185:
easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
```

**Решение**: Вынести в `const easeInOutCubic = (t: number) => ...` в начало файла или в `utils/`.

---

## 6. TELEPORT — РАЗБОР

### 6.1. [UiCursor.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiCursor.vue#L11-L32) — `<Teleport to="body">`

| | |
|---|---|
| **Вердикт** | 🗑️ **УДАЛИТЬ** |
| **Причина** | Курсор монтируется на верхнем уровне (`default.vue` → layout). Ни один родитель не имеет `transform`/`filter`/`will-change: transform`. Teleport дублирует гарантию архитектуры. |

### 6.2. [PriceModal.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceModal.vue#L2-L37) — `<Teleport to="body">`

| | |
|---|---|
| **Вердикт** | 🗑️ **УДАЛИТЬ** (⚠️ проверить на iOS Safari) |
| **Причина** | `fixed inset-0 z-[100]` работает без Teleport. Кнопка вызова `md:hidden` — видна только на мобильных, где `overflow: hidden` не влияет на fixed. |

---

## 7. ПЕРЕУСЛОЖНЕНИЯ / OVER-ENGINEERING

### 7.1. [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue#L101) — Двойной вызов `useNuxtApp()` в watcher

`$lenis` уже получен на строке 70, но watcher вызывает `useNuxtApp().$lenis` повторно.

### 7.2. [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue#L89,L100) — `typeof document !== 'undefined'` в watchers

Layout рендерится только на клиенте. Watchers срабатывают только на клиенте. `document` гарантированно существует.

### 7.3. [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue#L88-L96) — Прямая DOM-манипуляция (`document.body.classList`, `document.body.style.overflow`)

| | |
|---|---|
| **Проблема** | `document.body.classList.add('menu-is-open')` и `document.body.style.overflow = 'hidden'` — прямая манипуляция DOM вместо реактивного подхода. В Nuxt для этого есть `useHead({ bodyAttrs: { class: ... } })`. |
| **Решение** | Заменить на `useHead()` с computed `bodyAttrs`. Или как минимум вынести в composable с гарантированной очисткой в `onBeforeUnmount`. Текущий код **не очищает** `body.style.overflow` и `body.classList` при размонтировании layout'а. |

### 7.4. [index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue#L163) — `handleMenuClick` с магическим `setTimeout(1250)`

```typescript
setTimeout(() => {
  emit('nav-goto', href)
}, 1250) // Ждем завершения схлопывания сферы
```

| | |
|---|---|
| **Проблема** | `1250ms` — магическое число, не связанное с реальной длительностью анимации (`1.2s` = `1200ms` в `collapseFromMenu`). Если кто-то изменит длительность анимации — этот timeout перестанет совпадать. |
| **Решение** | Вынести `const MENU_ANIMATION_DURATION = 1200` как константу и использовать `setTimeout(fn, MENU_ANIMATION_DURATION + 50)`. Или лучше — использовать callback `onComplete` вместо timeout. |

### 7.5. [nuxt.config.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/nuxt.config.ts#L24-L27) — `@ts-expect-error` × 2

```typescript
// @ts-expect-error process is available in node but types might be missing
nonce: process.env.NODE_ENV === 'production',
// @ts-expect-error process is available in node but types might be missing
headers: process.env.NODE_ENV === 'development' ? false : { ... }
```

| | |
|---|---|
| **Проблема** | `@ts-expect-error` подавляет ошибки типизации. В Nuxt 4 c TypeScript `process.env.NODE_ENV` должен быть доступен. Если типы не подхватываются — проблема в `tsconfig`, а не в `process`. |
| **Решение** | Добавить `/// <reference types="node" />` в начало файла, или `import.meta.env.MODE` вместо `process.env.NODE_ENV`. |

### 7.6. [DeviceSwitch.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/DeviceSwitch.vue#L2) — `v-bind="props"` прокидывает лишние пропсы

`<component :is="activeComponent" v-bind="props" v-bind:="$attrs" />` — прокидывает `desktop`, `mobile`, `tablet` (Component types) дочернему компоненту. Дочерний компонент не ожидает этих пропсов → Vue warnings.

### 7.7. `md:hidden` в desktop-only [PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue#L98) — БЕСПОЛЕЗНЫЙ КЛАСС

Desktop-only компонент, viewport всегда ≥768px.

### 7.8. Дубль `transform-gpu` в [desktop/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/LayoutHeader.vue#L3)

### 7.9. Дубль `bg-[#050505]` в [app.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/app.vue#L2) + [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue)

### 7.10. Пустые `<style scoped>` блоки

| Файл |
|---|
| [TechStack.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/TechStack.vue#L181-L182) |
| [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue#L199-L201) |
| [UiScrollHint.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiScrollHint.vue#L41-L42) |

---

## 8. DEVICE-SPLIT и NO-ANY — ОК

| Проверка | Результат |
|---|---|
| Device-Split | ✅ Строго соблюдён |
| `any` в TypeScript | ✅ 0 случаев |

---

## 9. План-Фикс (Roadmap)

### Phase 1 — 🟢 Безопасное удаление (0 рисков)

| # | Действие | Файл |
|---|---|---|
| 1 | Удалить файл | [useNavigation.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useNavigation.ts) |
| 2 | Удалить файл | [types/index.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/types/index.ts) |
| 3 | Удалить `windowH` | [desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue#L154) |
| 4 | Удалить `triggerDistortion` / `clearDistortion` | [desktop/ApproachContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/ApproachContent.vue#L159-L168) + [mobile](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/mobile/ApproachContent.vue#L155-L164) |
| 5 | Удалить `ScrollTrigger` import + register + cleanup | [desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue#L122) |
| 6 | Удалить пустой `if ($lenis) {}` | [index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue#L157-L161) |
| 7 | Удалить пустые `<style scoped>` | TechStack, default.vue, UiScrollHint |
| 8 | Удалить дубль `transform-gpu` | [desktop/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/LayoutHeader.vue#L3) |
| 9 | Удалить `bg-[#050505]` | [app.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/app.vue#L2) |
| 10 | Упростить тернарный с одинаковым ease | [useOrganicSync.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicSync.ts#L343) |

---

### Phase 2 — 🟡 Очистка экспортов + мелкие правки

| # | Действие | Файлы |
|---|---|---|
| 1 | Удалить `isOptionSelected` из composable и деструктуризации | useContactForm + оба ContactContent |
| 2 | `const props = defineProps` → `defineProps` | [desktop/LayoutHeader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/desktop/LayoutHeader.vue#L59) |
| 3 | Использовать `$lenis` из замыкания | [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue#L101) |
| 4 | Убрать `typeof document !== 'undefined'` | [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue#L89,L100) |
| 5 | Убрать try/catch в `usePriceDragGesture` | [usePriceDragGesture.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/price/usePriceDragGesture.ts#L22-L26) |
| 6 | `try/catch` → `getCurrentInstance()` в `useEventBus` | [useEventBus.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/useEventBus.ts#L46-L52) |
| 7 | Убрать `@ts-expect-error` в nuxt.config | [nuxt.config.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/nuxt.config.ts#L24-L27) |
| 8 | Вынести easing в константу | [index.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/pages/index.vue#L92,L185) |
| 9 | `setTimeout(1250)` → именованная константа | [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue) |

---

### Phase 3 — 🟠 Strict-Cleanup fixes + дублирование

| # | Действие | Файлы |
|---|---|---|
| 1 | Добавить `onBeforeUnmount` в Preloader | [Preloader.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/Preloader.vue) |
| 2 | Добавить `import.meta.hot?.dispose(worker.terminate)` + timeout для workerCallbacks | [useOrganicSync.ts](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/composables/organic/useOrganicSync.ts#L8-L25) |
| 3 | Создать `utils/format.ts` с `formatPrice` | PriceCoreDisplay, PriceSatellite, PriceModal |
| 4 | Вынести `steps` в `data/approachSteps.ts` | desktop/ApproachContent, mobile/ApproachContent |
| 5 | Очистка `body.classList` и `body.style.overflow` в `onBeforeUnmount` | [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue) |

---

### Phase 4 — 🔴 Архитектурные + a11y (требуют тестирования)

| # | Действие | Файл | Риск |
|---|---|---|---|
| 1 | Убрать `preventTab` (a11y fix) | [app.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/app.vue#L30-L42) | Фокус-рамки станут видны — стилизовать через `:focus-visible` |
| 2 | Убрать `<Teleport to="body">` у UiCursor | [UiCursor.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/UiCursor.vue#L11) | Минимальный |
| 3 | Убрать `<Teleport to="body">` у PriceModal | [PriceModal.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/price/PriceModal.vue#L2) | Низкий, проверить iOS |
| 4 | Исправить `DeviceSwitch` — фильтрация пропсов | [DeviceSwitch.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/DeviceSwitch.vue#L2) | Средний |
| 5 | Решить судьбу `md:hidden` блока в desktop PriceContent | [desktop/PriceContent.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/components/sections/desktop/PriceContent.vue#L98-L115) | UX-решение |
| 6 | Заменить `document.body.*` на `useHead({ bodyAttrs })` | [default.vue](file:///c:/Users/BALDEJ/Desktop/studio-BLACK/app/layouts/default.vue) | Средний |

---

### Phase 5 — 🟣 Архитектурный долг (не блокирует, но стоит запланировать)

| # | Описание |
|---|---|
| 1 | **useOrganicState** — рассмотреть переход нереактивных boolean на `ref()` + `watchEffect` вместо ручного `scheduleSync()`. Снизит хрупкость контракта. |
| 2 | **EventBus** — задокументировать полную карту событий (12 типов) и направление потоков. Текущая EventMap в `useEventBus.ts` — хороший старт, но визуальная диаграмма потоков поможет при онбординге. |
| 3 | **Магические числа анимаций** — собрать все тайминги (1200ms, 1250ms, 2500ms, 2.4s, 2.8s, 3.4s) в единый конфиг `animation.config.ts`. |

---

## 10. Сводная статистика

| Категория | Кол-во |
|---|---|
| 🔴 Критических проблем | 3 (Tab a11y, Preloader cleanup, Worker leak) |
| 🟠 Архитектурных проблем | 4 (нереактивный стейт, мёртвая логика, silent try/catch ×2) |
| Файлов на удаление | 2 |
| Мёртвых функций/переменных | 5 |
| Дублированных блоков | 3 (formatPrice ×3, steps ×2, easing ×2) |
| Teleport на удаление | 2 |
| Teleport на сохранение | 0 |
| Пустых style-блоков | 3 |
| Over-engineering | 10 (двойной useNuxtApp, typeof document, пустой if, лишний ScrollTrigger, прямой DOM, magic numbers, @ts-expect-error, DeviceSwitch props, md:hidden, bg-дубль) |
| Нарушений Device-Split | 0 |
| Нарушений No-Any | 0 |
| Нарушений Strict-Cleanup | 2 |

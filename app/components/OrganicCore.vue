<template>
  <div ref="wrapperRef" class="organic-core-wrapper absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none z-0">
    <svg style="width: 0; height: 0; position: absolute; pointer-events: none;">
      <defs>
        <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur ref="blurRef" in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix ref="colorMatrixRef" in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
    <canvas ref="canvasRef" 
            class="absolute inset-0 w-full h-full pointer-events-none" 
            :class="disableHeavyFilters ? '' : 'mix-blend-screen'"
            :style="disableHeavyFilters ? 'z-index: 0; transform: translateZ(0); will-change: transform;' : 'filter: url(#goo); z-index: 0; transform: translateZ(0); will-change: filter;'"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { drawCatmullRom, getNoise, getTangentNoise } from '~/utils/shapeMath'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'
import { useDevice } from '#imports'
import gsap from 'gsap'

const wrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const blurRef = ref<HTMLElement | null>(null)
const colorMatrixRef = ref<HTMLElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const { shapes, stateConfig, isPreloading, expandForMenu: expand, collapseFromMenu, initOrganicCore, startPreloaderAnimation } = useOrganicCore()
const { isMobileOrTablet } = useDeviceSwitch()
const { isSafari, isIos } = useDevice()
const disableHeavyFilters = isSafari || isIos
const currentDpr = ref(1)


let time = 0
let pulseTime = 0
let cachedWidth = 1024

const render = () => {
  const { noiseSpeed, noiseAmp, morphWeight, tension, pulseWeight, pulseType, xOffset, preloaderProgress, fillProgress, gooBlur, alphaMult, alphaAdd } = stateConfig;
  
  if (blurRef.value) blurRef.value.setAttribute('stdDeviation', gooBlur.toString())
  if (colorMatrixRef.value) colorMatrixRef.value.setAttribute('values', `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alphaMult} ${alphaAdd}`)

  time += 0.01 * (noiseSpeed !== undefined ? noiseSpeed : 1)
  pulseTime += 0.01 * (stateConfig.pulseSpeed ?? 1)
  
  const currentCtx = ctx
  if (currentCtx && canvasRef.value) {
    currentCtx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    currentCtx.fillStyle = 'white'
    currentCtx.save()
    // Центрируем систему координат для холста
    const w = canvasRef.value.width / currentDpr.value
    const h = canvasRef.value.height / currentDpr.value
    currentCtx.translate(w / 2, h / 2)
    
    shapes.forEach(shape => {
      if (shape.physX === undefined) {
         shape.physX = shape.xOffset;
         shape.physY = shape.yOffset;
         shape.lastVx = 0;
         shape.lastVy = 0;
         shape.defX = 0;
         shape.defY = 0;
         shape.defVx = 0;
         shape.defVy = 0;
      }

      // Вычисляем динамическую ширину текущей формы (для идеального масштабирования пульса)
      let minX = Infinity;
      let maxX = -Infinity;
      for (const pt of shape.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
      }
      let currentWw = maxX - minX;
      if (currentWw < 1) currentWw = 1;

      // 1. Вычисляем скорость движения центра
      const vx = shape.xOffset - shape.physX!;
      const vy = shape.yOffset - shape.physY!;
      shape.physX = shape.xOffset;
      shape.physY = shape.yOffset;

      // Убираем слабое ускорение, используем саму скорость для сопротивления среды (вязкости)
      // Чем быстрее тянем, тем сильнее сопротивление тянет форму назад
      const targetDefX = -vx * 1.5;
      const targetDefY = -vy * 1.5;

      // 2. Инерционная деформация (Spring-Mass)
      // Пружина плавно догоняет цель и создает упругое дрожание при остановке
      const spring = 0.15;   // Золотая середина жесткости
      const friction = 0.82; // Золотая середина упругости (jiggle)
      
      shape.defVx = (shape.defVx || 0) + (targetDefX - (shape.defX || 0)) * spring;
      shape.defVy = (shape.defVy || 0) + (targetDefY - (shape.defY || 0)) * spring;
      
      shape.defVx *= friction;
      shape.defVy *= friction;

      shape.defX = (shape.defX || 0) + shape.defVx;
      shape.defY = (shape.defY || 0) + shape.defVy;

      // Ограничитель деформации (чтобы было заметно, но не ломало текст)
      const defLen = Math.sqrt(shape.defX * shape.defX + shape.defY * shape.defY);
      const maxDef = 40; // Ограничение: золотая середина
      if (defLen > maxDef) {
         shape.defX = (shape.defX / defLen) * maxDef;
         shape.defY = (shape.defY / defLen) * maxDef;
      }

      const shapeTime = time + (shape.noisePhaseOffset || 0);
      const amp = noiseAmp * (shape.noiseMult ?? 1);
      const noisyPoints = shape.points.map((p, j) => {
        const noise = getNoise(p.angle, shapeTime, morphWeight) * amp
        const tNoise = getTangentNoise(p.angle, shapeTime, morphWeight) * amp * 0.3
        
        let x = p.x + p.normal.x * noise + (-p.normal.y) * tNoise
        let y = p.y + p.normal.y * noise + (p.normal.x) * tNoise

        // Математика бегущего пульса
        let pulseDisplacementY = 0;
        if (pulseWeight > 0) {
          // Динамический расчет nx, привязанный к габаритам формы.
          // Это заставляет волну сжиматься и растягиваться вместе с формой во время морфинга.
          let nx = (x - minX) / currentWw;
          nx = Math.max(0, Math.min(1, nx));
          
          if (pulseType === 'soft') {
            const pulsePos = (pulseTime * 1.2) % 1.2 - 0.1;
            const dist = (nx - pulsePos) * 8;
            const smoothEcg = Math.cos(dist * Math.PI * 1.5) * Math.exp(-dist * dist * 1.0);
            const edgeFade = Math.sin(nx * Math.PI);
            const softVibration = Math.sin(nx * 30 + pulseTime * 4) * (cachedWidth < 768 ? 1 : 1.5);
            pulseDisplacementY = (smoothEcg * (cachedWidth < 768 ? 60 : 100) + softVibration) * pulseWeight * edgeFade;
          } else {
            const pulsePos = (pulseTime * 1.5) % 1.2 - 0.1;
            // Делаем импульс на мобильных чуть шире (множитель 10 вместо 12), чтобы он не казался слишком узким
            const distMultiplier = cachedWidth < 768 ? 10 : 12;
            const dist = (nx - pulsePos) * distMultiplier;
            const ecg = Math.cos(dist * Math.PI * 2) * Math.exp(-dist * dist * 2.5);
            const edgeFade = Math.sin(nx * Math.PI);
            const vibration = Math.sin(nx * 40 + pulseTime * 5) * (cachedWidth < 768 ? 1 : 2);
            // Существенно уменьшаем высоту пульса для мобильных
            const pulseAmplitude = cachedWidth < 768 ? 55 : 100;
            pulseDisplacementY = (ecg * pulseAmplitude + vibration) * pulseWeight * edgeFade;
          }
        }
        y -= pulseDisplacementY;

        // 3. Настоящая морфологическая деформация без вращения
        let nx_coord = x;
        let ny_coord = y;
        
        if (defLen > 0.1) {
          // Вычисляем, насколько точка совпадает с вектором деформации
          const dot = p.normal.x * (shape.defX || 0) + p.normal.y * (shape.defY || 0);
          
          // Вытягиваем точки (золотая середина)
          const stretchAmount = Math.abs(dot) * 0.55;
          nx_coord += p.normal.x * stretchAmount;
          ny_coord += p.normal.y * stretchAmount;
          
          // Очень легкое сплющивание (чтобы текст 100% влезал)
          const perp = 1 - (Math.abs(dot) / defLen);
          const squashAmount = perp * defLen * 0.15; // всего 15%
          nx_coord -= p.normal.x * squashAmount;
          ny_coord -= p.normal.y * squashAmount;
        }

        // Применяем глобальный shape.scale
        if (shape.scale !== 1) {
          nx_coord *= shape.scale;
          ny_coord *= shape.scale;
        }
        
        // 4. Смещение самого центра массы
        // Удалено смещение через defX/defY, чтобы центр сферы был намертво приклеен к xOffset/yOffset (где находится текст!)
        // Желейность (stretch) все еще применяется к контуру выше.
        nx_coord += shape.xOffset + (shape.pulseOffsetX || 0) + xOffset;
        ny_coord += shape.yOffset + (shape.pulseOffsetY || 0);
        
        return { x: nx_coord, y: ny_coord }
      })
      
      if (shape.isHole) {
        currentCtx.globalCompositeOperation = 'destination-out'
      } else {
        currentCtx.globalCompositeOperation = 'source-over'
      }
      
      drawCatmullRom(currentCtx, noisyPoints, true, tension)

      const cx = shape.xOffset + (shape.pulseOffsetX || 0) + xOffset;
      const cy = shape.yOffset + (shape.pulseOffsetY || 0);

      if (isPreloading.value) {
        currentCtx.save()

        // 1. Анимация кругового появления линии (Pie Clip)
        if (typeof preloaderProgress === 'number' && preloaderProgress < 1) {
          currentCtx.save()
          currentCtx.beginPath()
          currentCtx.moveTo(cx, cy)
          // getCirclePoints начинается с угла 0 (на 3 часа)
          const angle = preloaderProgress * Math.PI * 2
          currentCtx.arc(cx, cy, 3000, 0, angle, false)
          currentCtx.closePath()
          currentCtx.clip()

          drawCatmullRom(currentCtx, noisyPoints, true, tension)
          currentCtx.fillStyle = 'white'
          currentCtx.fill()
          currentCtx.restore()
        } else {
          // Если контур полностью отрисован
          drawCatmullRom(currentCtx, noisyPoints, true, tension)
          currentCtx.fillStyle = 'white'
          currentCtx.fill()
        }

        // 3. Вырезаем внутреннюю дырку, чтобы сфера выглядела как кольцо
        if (typeof fillProgress === 'number' && fillProgress > 0) {
          currentCtx.globalCompositeOperation = 'destination-out'
          currentCtx.save()
          // Смещаем центр трансформации к реальному центру фигуры
          currentCtx.translate(cx, cy)
          // Масштабируем дырку от 0.9 (тонкое кольцо) до 0.0 (сплошной шар)
          currentCtx.scale(fillProgress, fillProgress)
          currentCtx.translate(-cx, -cy)
          drawCatmullRom(currentCtx, noisyPoints, true, tension)
          currentCtx.fillStyle = 'white'
          currentCtx.fill()
          currentCtx.restore()
        }

        currentCtx.restore()
      } else {
        currentCtx.fillStyle = 'white'
        currentCtx.fill()
      }
    })
    
    // Reset blend mode just in case
    currentCtx.globalCompositeOperation = 'source-over'
    
    currentCtx.restore()
  }
}

const resizeCanvas = () => {
  if (canvasRef.value) {
    cachedWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const baseDpr = window.devicePixelRatio || 1;
    // Ограничиваем DPR до 1.25 на десктопе, чтобы тяжелый фильтр goo не перегружал GPU 4K-разрешением
    currentDpr.value = isMobileOrTablet.value ? Math.min(baseDpr, 1.5) : Math.min(baseDpr, 1.25);
    // ОШИБКА БЫЛА ЗДЕСЬ: window.innerHeight может не совпадать с реальным CSS-размером fixed-контейнера.
    // Из-за этого браузер растягивал/сжимал Canvas по вертикали, и сфера двигалась медленнее курсора!
    const rect = canvasRef.value.parentElement?.getBoundingClientRect() || canvasRef.value.getBoundingClientRect();
    canvasRef.value.width = rect.width * currentDpr.value;
    canvasRef.value.height = rect.height * currentDpr.value;
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(currentDpr.value, currentDpr.value);
    }
  }
}

let preloaderTl: gsap.core.Timeline | null = null

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }

  initOrganicCore()
  preloaderTl = startPreloaderAnimation()

  gsap.ticker.add(render)
})

onBeforeUnmount(() => {
  gsap.ticker.remove(render)
  window.removeEventListener('resize', resizeCanvas)
  if (preloaderTl) preloaderTl.kill()
  // Убиваем все GSAP-таймлайны pulse внутри shapes
  shapes.forEach(shape => {
    if (shape.pulseTl) {
      shape.pulseTl.kill()
      shape.pulseTl = undefined
    }
  })
  // Убиваем все текущие gsap tweens на shapes и их points
  gsap.killTweensOf(stateConfig)
  shapes.forEach(shape => {
    gsap.killTweensOf(shape)
    shape.points.forEach(p => {
      gsap.killTweensOf(p)
      gsap.killTweensOf(p.normal)
    })
  })
})

const expandForMenu = () => expand(wrapperRef.value)

defineExpose({ expandForMenu, collapseFromMenu })
</script>


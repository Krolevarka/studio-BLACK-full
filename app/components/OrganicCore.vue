<template>
  <div ref="wrapperRef" class="organic-core-wrapper absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
    <canvas ref="canvasRef" 
            class="absolute pointer-events-none max-w-none" 
            style="width: calc(100% + 160px); height: calc(100% + 160px); top: -80px; left: -80px; transform: translateZ(0); will-change: transform;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { drawCatmullRom, getNoise, getTangentNoise } from '~/utils/shapeMath'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { useDevice } from '#imports'
import gsap from 'gsap'

const wrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

let offscreenCanvas: HTMLCanvasElement | OffscreenCanvas | null = null
let offCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null
const noisyPointsBuffer: {x: number, y: number}[] = []

const { shapes, stateConfig, isPreloading, expandForMenu: expand, collapseFromMenu, initOrganicCore, startPreloaderAnimation, destroyOrganicCore } = useOrganicCore()
const { isSafari } = useDevice()
// На macOS Safari per-frame ctx.filter(blur+contrast) по offscreen-канвасу
// может работать медленно, поэтому для Safari используем оптимизированную destination-out ветку.
const disableHeavyFilters = isSafari
let currentDpr = 1

let time = 0
let pulseTime = 0
let cachedWidth = 1024

const render = () => {
  if (shapes.length === 0) return

  const { noiseSpeed, noiseAmp, morphWeight, tension, pulseWeight, pulseType, xOffset, preloaderProgress, fillProgress, gooBlur, alphaMult } = stateConfig;

  time += 0.01 * (noiseSpeed !== undefined ? noiseSpeed : 1)
  pulseTime += 0.01 * (stateConfig.pulseSpeed ?? 1)
  
  const currentCtx = ctx
  if (currentCtx && canvasRef.value) {
    const targetCtx = (!disableHeavyFilters && offCtx) ? offCtx : currentCtx;
    
    if (!disableHeavyFilters && offCtx && offscreenCanvas) {
      offCtx.save();
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.fillStyle = 'black';
      offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      offCtx.restore();
    } else {
      currentCtx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }
    
    targetCtx.save()
    const w = canvasRef.value.width / currentDpr
    const h = canvasRef.value.height / currentDpr
    targetCtx.translate(w / 2, h / 2)
    
    shapes.forEach(shape => {
      const currentShapeX = shape.xOffset + (shape.pulseOffsetX || 0);
      const currentShapeY = shape.yOffset + (shape.pulseOffsetY || 0);

      if (shape.physX === undefined) {
         shape.physX = currentShapeX;
         shape.physY = currentShapeY;
         shape.lastVx = 0;
         shape.lastVy = 0;
         shape.defX = 0;
         shape.defY = 0;
         shape.defVx = 0;
         shape.defVy = 0;
      }

      let minX = Infinity;
      let maxX = -Infinity;
      for (const pt of shape.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
      }
      let currentWw = maxX - minX;
      if (currentWw < 1) currentWw = 1;

      const vx = currentShapeX - shape.physX!;
      const vy = currentShapeY - shape.physY!;
      shape.physX = currentShapeX;
      shape.physY = currentShapeY;

      const targetDefX = -vx * 1.5;
      const targetDefY = -vy * 1.5;

      const spring = 0.15;   
      const friction = 0.82; 
      
      shape.defVx = (shape.defVx || 0) + (targetDefX - (shape.defX || 0)) * spring;
      shape.defVy = (shape.defVy || 0) + (targetDefY - (shape.defY || 0)) * spring;
      
      shape.defVx *= friction;
      shape.defVy *= friction;

      shape.defX = (shape.defX || 0) + shape.defVx;
      shape.defY = (shape.defY || 0) + shape.defVy;

      const defLen = Math.sqrt(shape.defX * shape.defX + shape.defY * shape.defY);
      const maxDef = 40; 
      if (defLen > maxDef) {
         shape.defX = (shape.defX / defLen) * maxDef;
         shape.defY = (shape.defY / defLen) * maxDef;
      }

      const shapeTime = time + (shape.noisePhaseOffset || 0);
      const amp = noiseAmp * (shape.noiseMult ?? 1);
      
      if (noisyPointsBuffer.length < shape.points.length) {
        for (let j = noisyPointsBuffer.length; j < shape.points.length; j++) {
          noisyPointsBuffer.push({ x: 0, y: 0 })
        }
      }

      shape.points.forEach((p, j) => {
        const noise = getNoise(p.angle, shapeTime, morphWeight) * amp
        const tNoise = getTangentNoise(p.angle, shapeTime, morphWeight) * amp * 0.3
        
        let x = p.x + p.normal.x * noise + (-p.normal.y) * tNoise
        let y = p.y + p.normal.y * noise + (p.normal.x) * tNoise

        let pulseDisplacementY = 0;
        if (pulseWeight > 0) {
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
            const distMultiplier = cachedWidth < 768 ? 10 : 12;
            const dist = (nx - pulsePos) * distMultiplier;
            const ecg = Math.cos(dist * Math.PI * 2) * Math.exp(-dist * dist * 2.5);
            const edgeFade = Math.sin(nx * Math.PI);
            const vibration = Math.sin(nx * 20 + pulseTime * 4) * (cachedWidth < 768 ? 0.5 : 1);
            const pulseAmplitude = cachedWidth < 768 ? 25 : (cachedWidth < 1440 ? 35 : 50);
            pulseDisplacementY = (ecg * pulseAmplitude + vibration) * pulseWeight * edgeFade;
          }
        }
        y -= pulseDisplacementY;

        let nx_coord = x;
        let ny_coord = y;
        
        if (defLen > 0.1) {
          const dot = p.normal.x * (shape.defX || 0) + p.normal.y * (shape.defY || 0);
          
          const stretchAmount = Math.abs(dot) * 0.55;
          nx_coord += p.normal.x * stretchAmount;
          ny_coord += p.normal.y * stretchAmount;
          
          const perp = 1 - (Math.abs(dot) / defLen);
          const squashAmount = perp * defLen * 0.15; 
          nx_coord -= p.normal.x * squashAmount;
          ny_coord -= p.normal.y * squashAmount;
        }

        if (shape.scale !== 1) {
          nx_coord *= shape.scale;
          ny_coord *= shape.scale;
        }
        
        nx_coord += shape.xOffset + (shape.pulseOffsetX || 0) + xOffset;
        ny_coord += shape.yOffset + (shape.pulseOffsetY || 0);
        
        noisyPointsBuffer[j]!.x = nx_coord
        noisyPointsBuffer[j]!.y = ny_coord
      })
      
      if (!disableHeavyFilters) {
        if (shape.isHole) {
          targetCtx.fillStyle = 'black'
        } else {
          targetCtx.fillStyle = 'white'
        }
      } else {
        if (shape.isHole) {
          targetCtx.globalCompositeOperation = 'destination-out'
        } else {
          targetCtx.globalCompositeOperation = 'source-over'
          targetCtx.fillStyle = 'white'
        }
      }
      
      const shapePath = new Path2D()
      drawCatmullRom(shapePath, noisyPointsBuffer, shape.points.length, true, tension)

      const cx = shape.xOffset + (shape.pulseOffsetX || 0) + xOffset;
      const cy = shape.yOffset + (shape.pulseOffsetY || 0);

      if (isPreloading.value) {
        targetCtx.save()

        if (typeof preloaderProgress === 'number' && preloaderProgress < 1) {
          targetCtx.save()
          targetCtx.beginPath()
          targetCtx.moveTo(cx, cy)
          const angle = preloaderProgress * Math.PI * 2
          targetCtx.arc(cx, cy, 3000, 0, angle, false)
          targetCtx.closePath()
          targetCtx.clip()

          targetCtx.fill(shapePath)
          targetCtx.restore()
        } else {
          targetCtx.fill(shapePath)
        }

        if (typeof fillProgress === 'number' && fillProgress > 0) {
          if (!disableHeavyFilters) {
            targetCtx.fillStyle = 'black'
          } else {
            targetCtx.globalCompositeOperation = 'destination-out'
          }
          targetCtx.save()
          targetCtx.translate(cx, cy)
          targetCtx.scale(fillProgress, fillProgress)
          targetCtx.translate(-cx, -cy)
          targetCtx.fill(shapePath)
          targetCtx.restore()
        }

        targetCtx.restore()
      } else {
        targetCtx.fill(shapePath)
      }
    })
    
    if (disableHeavyFilters) {
      targetCtx.globalCompositeOperation = 'source-over'
    }
    targetCtx.restore()

    if (!disableHeavyFilters && offCtx && offscreenCanvas) {
      currentCtx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      currentCtx.globalCompositeOperation = 'screen';
      currentCtx.filter = `blur(${gooBlur}px) contrast(${alphaMult || 30})`;
      
      currentCtx.save();
      currentCtx.setTransform(1, 0, 0, 1, 0, 0);
      currentCtx.drawImage(offscreenCanvas, 0, 0);
      currentCtx.restore();
      
      currentCtx.filter = 'none';
      currentCtx.globalCompositeOperation = 'source-over';
    }
  }
}

const resizeCanvas = () => {
  if (canvasRef.value) {
    cachedWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const baseDpr = window.devicePixelRatio || 1;
    currentDpr = Math.min(baseDpr, 1.25);
    const rect = canvasRef.value.getBoundingClientRect();
    canvasRef.value.width = rect.width * currentDpr;
    canvasRef.value.height = rect.height * currentDpr;
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(currentDpr, currentDpr);
    }
    
    if (!disableHeavyFilters) {
      if (!offscreenCanvas) {
        if (typeof OffscreenCanvas !== 'undefined') {
          offscreenCanvas = new OffscreenCanvas(canvasRef.value.width, canvasRef.value.height);
          offCtx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        } else {
          offscreenCanvas = document.createElement('canvas');
          offCtx = offscreenCanvas.getContext('2d');
        }
      }
      offscreenCanvas.width = canvasRef.value.width;
      offscreenCanvas.height = canvasRef.value.height;
      if (offCtx) {
        offCtx.setTransform(1, 0, 0, 1, 0, 0);
        offCtx.scale(currentDpr, currentDpr);
      }
    }
  }
}

let preloaderTl: gsap.core.Timeline | null = null

let tickerRunning = false
const startTicker = () => {
  if (!tickerRunning) { gsap.ticker.add(render); tickerRunning = true }
}
const stopTicker = () => {
  if (tickerRunning) { gsap.ticker.remove(render); tickerRunning = false }
}

// Page Visibility: в фоне вкладки полностью останавливаем рендер для экономии батареи/CPU ноутбука.
const onVisibilityChange = () => {
  if (typeof document === 'undefined') return
  if (document.hidden) stopTicker()
  else startTicker()
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }

  initOrganicCore()
  preloaderTl = startPreloaderAnimation()

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  startTicker()
})

onBeforeUnmount(() => {
  stopTicker()
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  window.removeEventListener('resize', resizeCanvas)
  if (preloaderTl) preloaderTl.kill()
  shapes.forEach(shape => {
    if (shape.pulseTl) {
      shape.pulseTl.kill()
      shape.pulseTl = undefined
    }
  })
  gsap.killTweensOf(stateConfig)
  shapes.forEach(shape => {
    gsap.killTweensOf(shape)
    shape.points.forEach(p => {
      gsap.killTweensOf(p)
      gsap.killTweensOf(p.normal)
    })
  })
  destroyOrganicCore()
})

const expandForMenu = () => {
  expand(wrapperRef.value)
}
const collapseFromMenuSafe = () => {
  collapseFromMenu()
}

defineExpose({ expandForMenu, collapseFromMenu: collapseFromMenuSafe })
</script>

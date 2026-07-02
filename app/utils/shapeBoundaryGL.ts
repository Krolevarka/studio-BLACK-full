import { getNoise, getTangentNoise } from '~/utils/shapeMath'
import type { ShapeState, StateConfig } from '~/types/organic'

/**
 * Расчёт точек контура одного блоба для мобильного WebGL-движка.
 *
 * ВЕРНЫЙ ПОРТ попадной математики из desktop `OrganicCore.vue` render() (noise + pulse +
 * физика деформации squash/stretch). Вынесен в отдельный модуль СПЕЦИАЛЬНО, чтобы НЕ трогать
 * десктопный рендер: десктоп продолжает считать у себя, мобайл — здесь. Общими остаются только
 * чистые функции shapeMath (getNoise/getTangentNoise), которые НЕ модифицируются.
 *
 * Возвращает количество точек, записанных в out как пары [x0,y0, x1,y1, ...] в CSS-пикселях,
 * с началом координат в ЦЕНТРЕ канваса (как desktop после translate(w/2,h/2), ось Y вниз).
 * Мутирует поля физики деформации на самом shape (physX/defX/...), как и desktop — допустимо,
 * т.к. на мобиле работает только этот движок (v-if), конфликта с desktop нет.
 */
export interface BoundaryFrame {
  time: number
  pulseTime: number
  cachedWidth: number
  isPreloading: boolean
}

export function computeShapeBoundary(
  shape: ShapeState,
  cfg: StateConfig,
  frame: BoundaryFrame,
  out: Float32Array
): number {
  const { noiseAmp, morphWeight, pulseWeight, pulseType, xOffset } = cfg
  const { time, pulseTime, cachedWidth } = frame

  const currentShapeX = shape.xOffset + (shape.pulseOffsetX || 0)
  const currentShapeY = shape.yOffset + (shape.pulseOffsetY || 0)

  if (shape.physX === undefined) {
    shape.physX = currentShapeX
    shape.physY = currentShapeY
    shape.lastVx = 0
    shape.lastVy = 0
    shape.defX = 0
    shape.defY = 0
    shape.defVx = 0
    shape.defVy = 0
  }

  let minX = Infinity
  let maxX = -Infinity
  for (const pt of shape.points) {
    if (pt.x < minX) minX = pt.x
    if (pt.x > maxX) maxX = pt.x
  }
  let currentWw = maxX - minX
  if (currentWw < 1) currentWw = 1

  let vx = currentShapeX - shape.physX!
  let vy = currentShapeY - shape.physY!
  if (Math.abs(vx) > 100 || Math.abs(vy) > 100) {
    vx = 0
    vy = 0
    shape.defX = 0
    shape.defY = 0
    shape.defVx = 0
    shape.defVy = 0
  }
  shape.physX = currentShapeX
  shape.physY = currentShapeY

  const targetDefX = -vx * 1.5
  const targetDefY = -vy * 1.5

  const spring = 0.15
  const friction = 0.82

  shape.defVx = (shape.defVx || 0) + (targetDefX - (shape.defX || 0)) * spring
  shape.defVy = (shape.defVy || 0) + (targetDefY - (shape.defY || 0)) * spring

  shape.defVx *= friction
  shape.defVy *= friction

  shape.defX = (shape.defX || 0) + shape.defVx
  shape.defY = (shape.defY || 0) + shape.defVy

  const defLen = Math.sqrt(shape.defX * shape.defX + shape.defY * shape.defY)
  const maxDef = 40
  if (defLen > maxDef) {
    shape.defX = (shape.defX / defLen) * maxDef
    shape.defY = (shape.defY / defLen) * maxDef
  }

  const shapeTime = time + (shape.noisePhaseOffset || 0)
  const amp = noiseAmp * (shape.noiseMult ?? 1)

  const points = shape.points
  const n = points.length

  for (let j = 0; j < n; j++) {
    const p = points[j]!
    const noise = getNoise(p.angle, shapeTime, morphWeight) * amp
    const tNoise = getTangentNoise(p.angle, shapeTime, morphWeight) * amp * 0.3

    const x = p.x + p.normal.x * noise + (-p.normal.y) * tNoise
    let y = p.y + p.normal.y * noise + (p.normal.x) * tNoise

    if (pulseWeight > 0) {
      let nx = (x - minX) / currentWw
      nx = Math.max(0, Math.min(1, nx))

      let pulseDisplacementY: number
      if (pulseType === 'soft') {
        const pulsePos = (pulseTime * 1.2) % 1.2 - 0.1
        const dist = (nx - pulsePos) * 8
        const smoothEcg = Math.cos(dist * Math.PI * 1.5) * Math.exp(-dist * dist * 1.0)
        const edgeFade = Math.sin(nx * Math.PI)
        const softVibration = Math.sin(nx * 30 + pulseTime * 4) * (cachedWidth < 768 ? 1.2 : 1.5)
        pulseDisplacementY = (smoothEcg * (cachedWidth < 768 ? 70 : 100) + softVibration) * pulseWeight * edgeFade
      } else {
        const pulsePos = (pulseTime * 1.5) % 1.2 - 0.1
        const distMultiplier = cachedWidth < 768 ? 8 : 12
        const dist = (nx - pulsePos) * distMultiplier
        const ecg = Math.cos(dist * Math.PI * 2) * Math.exp(-dist * dist * 2.5)
        const edgeFade = Math.sin(nx * Math.PI)
        const vibration = Math.sin(nx * 20 + pulseTime * 4) * (cachedWidth < 768 ? 1.0 : 1)
        const pulseAmplitude = cachedWidth < 768 ? 38 : (cachedWidth < 1440 ? 45 : 50)
        pulseDisplacementY = (ecg * pulseAmplitude + vibration) * pulseWeight * edgeFade
      }

      // Применяем смещение строго по оси Y, идентично десктопной логике OrganicCore.vue.
      // Благодаря продвинутой триангуляции (Ear Clipping) линия изгибается волной ЭКГ без искажения толщины и артефактов.
      y -= pulseDisplacementY
    }

    let nx_coord = x
    let ny_coord = y

    if (defLen > 0.1) {
      const dot = p.normal.x * (shape.defX || 0) + p.normal.y * (shape.defY || 0)

      const stretchAmount = Math.abs(dot) * 0.55
      nx_coord += p.normal.x * stretchAmount
      ny_coord += p.normal.y * stretchAmount

      const perp = 1 - (Math.abs(dot) / defLen)
      const squashAmount = perp * defLen * 0.15
      nx_coord -= p.normal.x * squashAmount
      ny_coord -= p.normal.y * squashAmount
    }

    if (shape.scale !== 1) {
      nx_coord *= shape.scale
      ny_coord *= shape.scale
    }

    nx_coord += shape.xOffset + (shape.pulseOffsetX || 0) + xOffset
    ny_coord += shape.yOffset + (shape.pulseOffsetY || 0)

    out[j * 2] = nx_coord
    out[j * 2 + 1] = ny_coord
  }

  return n
}

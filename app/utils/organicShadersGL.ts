/**
 * Шейдеры и математика триангуляции для мобильного WebGL-движка (OrganicCoreMobile).
 * Вынесено в отдельный модуль согласно правилу декомпозиции (< 150-200 строк в файле).
 */

export const maskVert = `
attribute vec2 position;
attribute float aFill;
uniform vec2 uResolution;
varying float vFill;
varying vec2 vWorld;
void main() {
  vFill = aFill;
  vWorld = position;
  vec2 clip = position / (uResolution * 0.5);
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`

export const maskFrag = `
precision highp float;
varying float vFill;
varying vec2 vWorld;
uniform float uArc;
uniform vec2 uCenter;
void main() {
  if (uArc < 6.2831853) {
    vec2 d = vWorld - uCenter;
    float a = atan(d.y, d.x);
    if (a < 0.0) a += 6.2831853;
    if (a > uArc) discard;
  }
  gl_FragColor = vec4(vFill, 0.0, 0.0, 1.0);
}
`

export const fsVert = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

export const blurFrag = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  float w0 = 0.197638;
  float w1 = 0.174866;
  float w2 = 0.121116;
  float w3 = 0.065666;
  float w4 = 0.027867;
  float w5 = 0.009255;
  float w6 = 0.002410;
  float s = texture2D(uTex, vUv).r * w0;
  s += texture2D(uTex, vUv + uDir * 1.0).r * w1;
  s += texture2D(uTex, vUv - uDir * 1.0).r * w1;
  s += texture2D(uTex, vUv + uDir * 2.0).r * w2;
  s += texture2D(uTex, vUv - uDir * 2.0).r * w2;
  s += texture2D(uTex, vUv + uDir * 3.0).r * w3;
  s += texture2D(uTex, vUv - uDir * 3.0).r * w3;
  s += texture2D(uTex, vUv + uDir * 4.0).r * w4;
  s += texture2D(uTex, vUv - uDir * 4.0).r * w4;
  s += texture2D(uTex, vUv + uDir * 5.0).r * w5;
  s += texture2D(uTex, vUv - uDir * 5.0).r * w5;
  s += texture2D(uTex, vUv + uDir * 6.0).r * w6;
  s += texture2D(uTex, vUv - uDir * 6.0).r * w6;
  gl_FragColor = vec4(s, 0.0, 0.0, 1.0);
}
`

export const thresholdFrag = `
precision highp float;
uniform sampler2D uTex;
uniform float uContrast;
varying vec2 vUv;
void main() {
  float m = texture2D(uTex, vUv).r;
  float aaBand = max(0.5 / max(uContrast, 1.0), 0.12);
  float goo = smoothstep(0.5 - aaBand, 0.5 + aaBand, m);
  gl_FragColor = vec4(goo, goo, goo, goo);
}
`

const MAX_POINTS = 512
const subScratch = new Float32Array(MAX_POINTS * 2)
const idx = new Int16Array(MAX_POINTS)

function isPointInTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
  const v0x = cx - ax, v0y = cy - ay
  const v1x = bx - ax, v1y = by - ay
  const v2x = px - ax, v2y = py - ay
  const dot00 = v0x * v0x + v0y * v0y
  const dot01 = v0x * v1x + v0y * v1y
  const dot02 = v0x * v2x + v0y * v2y
  const dot11 = v1x * v1x + v1y * v1y
  const dot12 = v1x * v2x + v1y * v2y
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01 || 1e-6)
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom
  return (u >= 0) && (v >= 0) && (u + v < 1)
}

export function triangulateShape(
  scratch: Float32Array,
  count: number,
  positions: Float32Array,
  fills: Float32Array,
  startV: number,
  maxVerts: number,
  fill: number,
  isPre: boolean,
  fillProgress: number,
  outCenter: { x: number; y: number }
): number {
  let v = startV

  // Быстрое 1-проходное сглаживание Catmull-Rom
  let subCount = 0
  for (let i = 0; i < count; i++) {
    if (subCount + 2 > MAX_POINTS) break
    const p0i = (i - 1 + count) % count
    const p1i = i
    const p2i = (i + 1) % count
    const p3i = (i + 2) % count

    const x0 = scratch[p0i * 2]!, y0 = scratch[p0i * 2 + 1]!
    const x1 = scratch[p1i * 2]!, y1 = scratch[p1i * 2 + 1]!
    const x2 = scratch[p2i * 2]!, y2 = scratch[p2i * 2 + 1]!
    const x3 = scratch[p3i * 2]!, y3 = scratch[p3i * 2 + 1]!

    subScratch[subCount * 2] = x1
    subScratch[subCount * 2 + 1] = y1
    subCount++

    subScratch[subCount * 2] = 0.0625 * (-x0 + 9 * x1 + 9 * x2 - x3)
    subScratch[subCount * 2 + 1] = 0.0625 * (-y0 + 9 * y1 + 9 * y2 - y3)
    subCount++
  }

  let cxs = 0, cys = 0
  for (let i = 0; i < subCount; i++) {
    cxs += subScratch[i * 2]!
    cys += subScratch[i * 2 + 1]!
  }
  cxs /= subCount || 1
  cys /= subCount || 1
  outCenter.x = cxs
  outCenter.y = cys

  if (isPre && fillProgress > 0.001 && fill === 1) {
    for (let i = 0; i < subCount; i++) {
      if (v + 6 > maxVerts) break
      const ni = (i + 1) % subCount
      const x0 = subScratch[i * 2]!, y0 = subScratch[i * 2 + 1]!
      const x1 = subScratch[ni * 2]!, y1 = subScratch[ni * 2 + 1]!
      const ax0 = cxs + (x0 - cxs) * fillProgress, ay0 = cys + (y0 - cys) * fillProgress
      const ax1 = cxs + (x1 - cxs) * fillProgress, ay1 = cys + (y1 - cys) * fillProgress

      positions[v * 2] = x0; positions[v * 2 + 1] = y0; fills[v] = fill; v++
      positions[v * 2] = x1; positions[v * 2 + 1] = y1; fills[v] = fill; v++
      positions[v * 2] = ax0; positions[v * 2 + 1] = ay0; fills[v] = fill; v++

      positions[v * 2] = x1; positions[v * 2 + 1] = y1; fills[v] = fill; v++
      positions[v * 2] = ax1; positions[v * 2 + 1] = ay1; fills[v] = fill; v++
      positions[v * 2] = ax0; positions[v * 2 + 1] = ay0; fills[v] = fill; v++
    }
    return v
  }

  // Ear Clipping без аллокаций памяти
  let area = 0
  for (let i = 0; i < subCount; i++) {
    const ni = (i + 1) % subCount
    area += subScratch[i * 2]! * subScratch[ni * 2 + 1]! - subScratch[ni * 2]! * subScratch[i * 2 + 1]!
  }
  const sign = area > 0 ? 1 : -1

  // Быстрая веерная триангуляция (Center Fan O(N)) для простых и звездообразных форм без дырок
  if (fill === 1 && subCount >= 3) {
    let canUseFan = true
    for (let i = 0; i < subCount; i++) {
      const ni = (i + 1) % subCount
      const x0 = subScratch[i * 2]!, y0 = subScratch[i * 2 + 1]!
      const x1 = subScratch[ni * 2]!, y1 = subScratch[ni * 2 + 1]!
      const cross = (x0 - cxs) * (y1 - cys) - (y0 - cys) * (x1 - cxs)
      if (cross * sign < -1e-4) {
        canUseFan = false
        break
      }
    }
    if (canUseFan) {
      for (let i = 0; i < subCount; i++) {
        if (v + 3 > maxVerts) break
        const ni = (i + 1) % subCount
        positions[v * 2] = cxs; positions[v * 2 + 1] = cys; fills[v] = fill; v++
        if (sign > 0) {
          positions[v * 2] = subScratch[i * 2]!; positions[v * 2 + 1] = subScratch[i * 2 + 1]!; fills[v] = fill; v++
          positions[v * 2] = subScratch[ni * 2]!; positions[v * 2 + 1] = subScratch[ni * 2 + 1]!; fills[v] = fill; v++
        } else {
          positions[v * 2] = subScratch[ni * 2]!; positions[v * 2 + 1] = subScratch[ni * 2 + 1]!; fills[v] = fill; v++
          positions[v * 2] = subScratch[i * 2]!; positions[v * 2 + 1] = subScratch[i * 2 + 1]!; fills[v] = fill; v++
        }
      }
      return v
    }
  }
  let rem = subCount
  for (let i = 0; i < subCount; i++) idx[i] = i

  let countStop = 2 * rem
  let curr = 0
  while (rem > 2) {
    if (countStop-- <= 0) break
    const eu = curr % rem
    const ev = (curr + 1) % rem
    const ew = (curr + 2) % rem
    const iu = idx[eu]!, iv = idx[ev]!, iw = idx[ew]!
    const ax = subScratch[iu * 2]!, ay = subScratch[iu * 2 + 1]!
    const bx = subScratch[iv * 2]!, by = subScratch[iv * 2 + 1]!
    const cx = subScratch[iw * 2]!, cy = subScratch[iw * 2 + 1]!

    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    if (cross * sign > 1e-5) {
      let ear = true
      for (let j = 0; j < rem; j++) {
        if (j === eu || j === ev || j === ew) continue
        const ij = idx[j]!
        if (isPointInTriangle(subScratch[ij * 2]!, subScratch[ij * 2 + 1]!, ax, ay, bx, by, cx, cy)) {
          ear = false
          break
        }
      }
      if (ear) {
        if (v + 3 <= maxVerts) {
          positions[v * 2] = ax; positions[v * 2 + 1] = ay; fills[v] = fill; v++
          positions[v * 2] = bx; positions[v * 2 + 1] = by; fills[v] = fill; v++
          positions[v * 2] = cx; positions[v * 2 + 1] = cy; fills[v] = fill; v++
        }
        for (let k = ev; k < rem - 1; k++) idx[k] = idx[k + 1]!
        rem--
        curr = 0
        countStop = 2 * rem
        continue
      }
    }
    curr++
  }

  if (rem > 2) {
    const i0 = idx[0]!
    const fx = subScratch[i0 * 2]!, fy = subScratch[i0 * 2 + 1]!
    for (let i = 1; i < rem - 1; i++) {
      if (v + 3 > maxVerts) break
      const i1 = idx[i]!, i2 = idx[i + 1]!
      positions[v * 2] = fx; positions[v * 2 + 1] = fy; fills[v] = fill; v++
      positions[v * 2] = subScratch[i1 * 2]!; positions[v * 2 + 1] = subScratch[i1 * 2 + 1]!; fills[v] = fill; v++
      positions[v * 2] = subScratch[i2 * 2]!; positions[v * 2 + 1] = subScratch[i2 * 2 + 1]!; fills[v] = fill; v++
    }
  }

  return v
}

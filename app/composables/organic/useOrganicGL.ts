import { Renderer, Program, Mesh, Geometry, Triangle, RenderTarget, Vec2 } from 'ogl'
import { computeShapeBoundary, type BoundaryFrame } from '~/utils/shapeBoundaryGL'
import { maskVert, maskFrag, fsVert, blurFrag, thresholdFrag, triangulateShape } from '~/utils/organicShadersGL'
import type { ShapeState, StateConfig } from '~/types/organic'

const MAX_BOUNDARY_POINTS = 4096
const MAX_POINTS_PER_SHAPE = 512
const MAX_DPR = 2.5
const DOWNSAMPLE = 1.0
const BLUR_TAP_SCALE = 0.65

export interface OrganicGL {
  resize: (cssW: number, cssH: number) => void
  renderFrame: (shapes: ShapeState[], cfg: StateConfig, frame: BoundaryFrame) => void
  dispose: () => void
  isReady: () => boolean
}

export function createOrganicGL(canvas: HTMLCanvasElement): OrganicGL | null {
  let renderer: Renderer
  try {
    renderer = new Renderer({
      canvas,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR)
    })
  } catch {
    return null
  }

  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  const maxVerts = MAX_BOUNDARY_POINTS * 3
  const positions = new Float32Array(maxVerts * 2)
  const fills = new Float32Array(maxVerts)
  const maskGeometry = new Geometry(gl, {
    position: { size: 2, data: positions, usage: gl.DYNAMIC_DRAW },
    aFill: { size: 1, data: fills, usage: gl.DYNAMIC_DRAW }
  })

  const maskProgram = new Program(gl, {
    vertex: maskVert,
    fragment: maskFrag,
    uniforms: {
      uResolution: { value: new Vec2(1, 1) },
      uArc: { value: 100 },
      uCenter: { value: new Vec2(0, 0) }
    },
    depthTest: false,
    depthWrite: false,
    cullFace: false,
    transparent: false
  })
  const maskMesh = new Mesh(gl, { geometry: maskGeometry, program: maskProgram })

  const fsGeometry = new Triangle(gl)
  const blurProgram = new Program(gl, {
    vertex: fsVert,
    fragment: blurFrag,
    uniforms: { uTex: { value: null }, uDir: { value: new Vec2(0, 0) } },
    depthTest: false,
    depthWrite: false
  })
  const blurMesh = new Mesh(gl, { geometry: fsGeometry, program: blurProgram })

  const thresholdProgram = new Program(gl, {
    vertex: fsVert,
    fragment: thresholdFrag,
    uniforms: { uTex: { value: null }, uContrast: { value: 35 } },
    depthTest: false,
    depthWrite: false
  })
  const thresholdMesh = new Mesh(gl, { geometry: fsGeometry, program: thresholdProgram })

  let maskRT: RenderTarget | null = null
  let blurA: RenderTarget | null = null
  let blurB: RenderTarget | null = null
  let ready = false

  const scratch = new Float32Array(MAX_POINTS_PER_SHAPE * 2)
  const centerPos = { x: 0, y: 0 }

  const allocTargets = () => {
    const dw = gl.drawingBufferWidth
    const dh = gl.drawingBufferHeight
    if (dw < 1 || dh < 1) return
    const lin = { magFilter: gl.LINEAR, minFilter: gl.LINEAR, depth: false }
    const qw = Math.max(1, Math.floor(dw / DOWNSAMPLE))
    const qh = Math.max(1, Math.floor(dh / DOWNSAMPLE))
    maskRT = new RenderTarget(gl, { width: qw, height: qh, ...lin })
    blurA = new RenderTarget(gl, { width: qw, height: qh, ...lin })
    blurB = new RenderTarget(gl, { width: qw, height: qh, ...lin })
    ready = true
  }

  const resize = (w: number, h: number) => {
    const cssW = Math.max(1, w)
    const cssH = Math.max(1, h)
    renderer.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    renderer.setSize(cssW, cssH)
    maskProgram.uniforms.uResolution.value.set(cssW, cssH)
    allocTargets()
  }

  const renderFrame = (shapes: ShapeState[], cfg: StateConfig, frame: BoundaryFrame) => {
    if (!ready || !maskRT || !blurA || !blurB) return

    const isPre = frame.isPreloading
    const fillProgress = cfg.fillProgress ?? 0
    const preloaderProgress = cfg.preloaderProgress ?? 1

    let v = 0
    let firstCx = 0, firstCy = 0, haveFirst = false

    for (const shape of shapes) {
      if (shape.scale <= 0.001) continue
      const cnt = computeShapeBoundary(shape, cfg, frame, scratch)
      const count = Math.min(cnt, MAX_POINTS_PER_SHAPE)
      if (count < 3) continue

      v = triangulateShape(scratch, count, positions, fills, v, maxVerts, shape.isHole ? 0 : 1, isPre, fillProgress, centerPos)
      if (!haveFirst) { firstCx = centerPos.x; firstCy = centerPos.y; haveFirst = true }
    }

    if (isPre && preloaderProgress < 1) {
      maskProgram.uniforms.uArc.value = preloaderProgress * Math.PI * 2
      maskProgram.uniforms.uCenter.value.set(firstCx, firstCy)
    } else {
      maskProgram.uniforms.uArc.value = 100
    }

    if (maskGeometry.attributes.position) maskGeometry.attributes.position.needsUpdate = true
    if (maskGeometry.attributes.aFill) maskGeometry.attributes.aFill.needsUpdate = true
    maskGeometry.drawRange.count = v

    renderer.render({ scene: maskMesh, target: maskRT, clear: true })
    if (v === 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return
    }

    const dpr = renderer.dpr
    const blurPx = Math.max(cfg.gooBlur ?? 15, 6) * dpr * BLUR_TAP_SCALE
    let sourceTex = maskRT.texture
    if (blurPx >= 0.05) {
      const tapStep = Math.min(2.2, Math.max(0.3, blurPx * 0.15))
      blurProgram.uniforms.uTex.value = maskRT.texture
      blurProgram.uniforms.uDir.value.set(tapStep / maskRT.width, 0)
      renderer.render({ scene: blurMesh, target: blurA, clear: true })
      blurProgram.uniforms.uTex.value = blurA.texture
      blurProgram.uniforms.uDir.value.set(0, tapStep / blurA.height)
      renderer.render({ scene: blurMesh, target: blurB, clear: true })
      sourceTex = blurB.texture
    }

    thresholdProgram.uniforms.uTex.value = sourceTex
    thresholdProgram.uniforms.uContrast.value = Math.max(cfg.alphaMult || 35, 35)
    renderer.render({ scene: thresholdMesh, target: undefined, clear: true })
  }

  const onLost = (e: Event) => { e.preventDefault(); ready = false }
  const onRestored = () => { allocTargets() }
  canvas.addEventListener('webglcontextlost', onLost as EventListener, false)
  canvas.addEventListener('webglcontextrestored', onRestored, false)

  const dispose = () => {
    ready = false
    canvas.removeEventListener('webglcontextlost', onLost as EventListener, false)
    canvas.removeEventListener('webglcontextrestored', onRestored, false)
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()
  }

  return {
    resize,
    renderFrame,
    dispose,
    isReady: () => ready
  }
}

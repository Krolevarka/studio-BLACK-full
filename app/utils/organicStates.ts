import { getCirclePoints, getRectanglePoints, getDiamondPoints, getDividedDropPoints, getBracketPoints, getSvgPathPoints, getHexagonPoints, getInfinityPoints } from '~/utils/shapeMath'
import type { TargetStateConfig, TargetShape, PriceOption } from '~/types/organic'

export function getCurrencyShapes(index: number, isMobile: boolean): TargetShape[] {
  const pts = isMobile ? 90 : 240;
  const s = isMobile ? 0.6 : 1.2; // scale factor
  const targetShapes: TargetShape[] = [];

  if (index === 0) { // ₽ (Ruble)
    targetShapes.push({ points: getRectanglePoints(pts, 24 * s, 140 * s, 0, 0), xOffset: -20 * s, yOffset: 0, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getCirclePoints(pts, 45 * s, 0, 0), xOffset: 10 * s, yOffset: -25 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getRectanglePoints(pts, 90 * s, 20 * s, 0, 0), xOffset: 0, yOffset: 25 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getCirclePoints(pts, 20 * s, 0, 0), xOffset: 10 * s, yOffset: -25 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
  } else if (index === 1) { // $ (Dollar)
    targetShapes.push({ points: getRectanglePoints(pts, 16 * s, 160 * s, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getCirclePoints(pts, 40 * s, 0, 0), xOffset: 0, yOffset: -30 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getCirclePoints(pts, 40 * s, 0, 0), xOffset: 0, yOffset: 30 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getCirclePoints(pts, 16 * s, 0, 0), xOffset: 0, yOffset: -30 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
    targetShapes.push({ points: getCirclePoints(pts, 16 * s, 0, 0), xOffset: 0, yOffset: 30 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
    targetShapes.push({ points: getRectanglePoints(pts, 40 * s, 40 * s, 0, 0), xOffset: 30 * s, yOffset: -30 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
    targetShapes.push({ points: getRectanglePoints(pts, 40 * s, 40 * s, 0, 0), xOffset: -30 * s, yOffset: 30 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
  } else if (index === 2) { // € (Euro)
    targetShapes.push({ points: getCirclePoints(pts, 60 * s, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getRectanglePoints(pts, 80 * s, 16 * s, 0, 0), xOffset: -10 * s, yOffset: -12 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getRectanglePoints(pts, 80 * s, 16 * s, 0, 0), xOffset: -10 * s, yOffset: 12 * s, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2 });
    targetShapes.push({ points: getCirclePoints(pts, 35 * s, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
    targetShapes.push({ points: getRectanglePoints(pts, 60 * s, 80 * s, 0, 0), xOffset: 40 * s, yOffset: 0, scale: 1, rotation: 0, pulseX: 0, pulseY: 0, noiseMult: 0.2, isHole: true });
  }
  return targetShapes;
}

export interface TargetStateOptions {
  w: number;
  h: number;
  isMobile: boolean;
  isPriceActive: boolean;
  isApproachActive: boolean;
  approachStep: number;
  isPortfolioActive: boolean;
  isAboutActive: boolean;
  currentCurrencyIndex: number;
  priceOptions?: PriceOption[];
  totalPrice?: number;
  isContactActive?: boolean;
  contactStep?: number;
  isContactTyping?: boolean;
  isTechStackActive?: boolean;
  hoveredTechIndex?: number;
}

function getPriceState({ w, h, isMobile, priceOptions = [], totalPrice = 0, isContactActive }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;

  const baseCoreRadius = isMobile ? 80 : 120;
  const priceScale = Math.min(totalPrice / 1000000, 1);
  const coreRadius = baseCoreRadius + priceScale * (isMobile ? 40 : 80);

  const targetShapes: TargetShape[] = [];

  targetShapes.push({

    points: getCirclePoints(pts, coreRadius, 0, 0),
    xOffset: 0,
    yOffset: 0,
    scale: 1,
    rotation: 0,
    pulseX: 0,
    pulseY: 0,
    noiseMult: 1.0 + priceScale * 0.5,
    isHole: false
  });

  priceOptions.forEach((opt) => {
    const satRadius = isMobile ? 50 : 80;
    const orbitDistance = isMobile ? Math.min(200, Math.min(w, h) * 0.28) + opt.radiusOffset * 0.5 : 310 + opt.radiusOffset;
    const xOff = opt.selected ? 0 : Math.cos(opt.angle) * orbitDistance;
    const yOff = opt.selected ? 0 : Math.sin(opt.angle) * orbitDistance;

    targetShapes.push({
      id: opt.id,
      points: getCirclePoints(pts, satRadius, 0, 0),
      xOffset: xOff,
      yOffset: yOff,
      scale: 1,
      rotation: 0,
      pulseX: 0,
      pulseY: 0,
      noiseMult: 0.5,
      isHole: false
    });
  });

  return {
    shapes: targetShapes,
    config: { tension: 1, noiseAmp: 25, noiseSpeed: 1.2, morphWeight: 0, gooBlur: 20, alphaMult: 30, alphaAdd: -12, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: 0 }
  }
}

function getApproachState({ w, h, isMobile, approachStep, isContactActive }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;

  const xOff = isMobile ? 0 : w / 4;

  if (approachStep === 0) {
    const radius = isMobile ? 140 : 250;
    return {
      shapes: [
        { points: getDividedDropPoints(pts, radius, 0.4, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0 }
      ],
      config: { tension: 1, noiseAmp: 30, noiseSpeed: 0.5, morphWeight: 0, gooBlur: 20, alphaMult: 30, alphaAdd: -10, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: xOff }
    }
  } else if (approachStep === 1) {
    const coreRadius = isMobile ? 100 : 160;
    const satRadius = isMobile ? 40 : 60;
    const pulseDist = isMobile ? 180 : 300;
    const targetShapes: TargetShape[] = [];

    targetShapes.push({

      points: getCirclePoints(pts, coreRadius, 0, 0),
      xOffset: 0,
      yOffset: 0,
      scale: 1,
      rotation: 0,
      pulseX: 0,
      pulseY: 0,
      noiseMult: 1
    });

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      targetShapes.push({
        id: `sat-${i}`,
        points: getCirclePoints(pts, satRadius, 0, 0),
        xOffset: Math.cos(angle) * 5,
        yOffset: Math.sin(angle) * 5,
        scale: 1,
        rotation: 0,
        pulseX: Math.cos(angle) * pulseDist,
        pulseY: Math.sin(angle) * pulseDist,
        noiseMult: 0.2
      });
    }
    return {
      shapes: targetShapes,
      config: { tension: 1, noiseAmp: 30, noiseSpeed: 1.5, morphWeight: 0, gooBlur: 20, alphaMult: 30, alphaAdd: -12, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: xOff }
    }
  } else if (approachStep === 2) {
    const dim = isMobile ? 240 : 360;
    return {
      shapes: [
        { points: getDiamondPoints(pts, dim, dim, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0 }
      ],
      config: { tension: 0, noiseAmp: 0, noiseSpeed: 0, morphWeight: 1, gooBlur: 0, alphaMult: 1, alphaAdd: 0, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: xOff }
    }
  } else if (approachStep === 3) {
    const rectH = isMobile ? 180 : 280;
    const thick = isMobile ? 30 : 50;
    const spread = isMobile ? 100 : 180;
    const bracketW = isMobile ? 80 : 140;
    return {
      shapes: [
        { points: getBracketPoints(pts, bracketW, rectH, 0, 0, thick, 'left'), xOffset: -spread, yOffset: 0, scale: 1, rotation: 0 },
        { points: getBracketPoints(pts, bracketW, rectH, 0, 0, thick, 'right'), xOffset: spread, yOffset: 0, scale: 1, rotation: 0 }
      ],
      config: { tension: 0, noiseAmp: 0, noiseSpeed: 0, morphWeight: 1, gooBlur: 0, alphaMult: 1, alphaAdd: 0, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: xOff }
    }
  } else {
    const radius = isMobile ? 160 : 280;
    return {
      shapes: [
        { points: getCirclePoints(pts, radius, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0 }
      ],
      config: { tension: 1, noiseAmp: 0, noiseSpeed: 0, morphWeight: 0, gooBlur: 0, alphaMult: 1, alphaAdd: 0, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: xOff }
    }
  }
}

function getPortfolioState({ w, h, isMobile, isContactActive }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;
  const rectW = isMobile ? w * 0.9 : w * 0.6
  const rectH = isMobile ? 12 : 14
  return {
    shapes: [
      { points: getRectanglePoints(pts, rectW, rectH, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0 }
    ],
    config: { tension: 1, noiseAmp: 0, noiseSpeed: 1, morphWeight: 0, gooBlur: 0, alphaMult: 1, alphaAdd: 0, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 1, pulseSpeed: 0.8, xOffset: 0 }
  }
}

function getAboutState({ w, h, isMobile, isContactActive }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;
  const rectW = isMobile ? w * 1.1 : w / 2;
  const rectH = isMobile ? h * 0.5 : h * 1.1;
  const shapeYOffset = isMobile ? -h * 0.25 : 0;
  const configXOffset = isMobile ? 0 : -w / 4;

  return {
    shapes: [
      { points: getRectanglePoints(pts, rectW, rectH, 0, 0), xOffset: 0, yOffset: shapeYOffset, scale: 1, rotation: 0 }
    ],
    config: { tension: 0, noiseAmp: 0, noiseSpeed: 0.25, morphWeight: 1, gooBlur: 0, alphaMult: 1, alphaAdd: 0, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: configXOffset }
  }
}

function getContactState({ w, h, isMobile, contactStep = 1, isContactTyping = false, isContactActive }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;
  if (contactStep === -1) {
    const rectW = isMobile ? w * 0.8 : w * 0.5;
    const rectH = 10;
    return {
      shapes: [
        { points: getRectanglePoints(pts, rectW, rectH, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0 }
      ],
      config: { tension: 1, noiseAmp: 60, noiseSpeed: 3, morphWeight: 0.5, gooBlur: 10, alphaMult: 1, alphaAdd: 0, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 1, xOffset: 0 }
    };
  } else if (contactStep === 6) {
    const radius = isMobile ? 180 : 300;
    const xOff = isMobile ? 0 : (w >= 1536 ? w * 0.12 : w * 0.18);
    const yOff = isMobile ? -150 : (w >= 1536 ? -40 : 0);
    return {
      shapes: [
        { points: getCirclePoints(pts, radius, 0, 0), xOffset: xOff, yOffset: yOff, scale: 1, rotation: 0 }
      ],
      config: { tension: 1, noiseAmp: 100, noiseSpeed: 8, morphWeight: 0, gooBlur: 20, alphaMult: 25, alphaAdd: -10, pulseType: 'soft', pulseWeight: 0.5, pulseSpeed: 2.5, xOffset: 0 }
    };
  } else if (contactStep >= 1 && contactStep <= 5) {
    const paths = [
      "",
      "M11.748 5.773S11.418 5 10.914 5c-.496 0-.754.229-.926.387S6.938 7.91 6.938 7.91s-.837.731-.773 2.106c.054 1.375.323 3.332 1.719 6.058 1.386 2.72 4.855 6.876 7.047 8.337 0 0 2.031 1.558 3.921 2.191.549.173 1.647.398 1.903.398.26 0 .719 0 1.246-.385.536-.389 3.543-2.807 3.543-2.807s.736-.665-.119-1.438c-.859-.773-3.467-2.492-4.025-2.944-.559-.459-1.355-.257-1.699.054-.343.313-.956.828-1.031.893-.112.086-.419.365-.763.226-.438-.173-2.234-1.148-3.899-3.426-1.655-2.276-1.837-3.02-2.084-3.824a.56.56 0 0 1 .225-.657c.248-.172 1.161-.933 1.161-.933s.591-.583.344-1.27-1.906-4.716-1.906-4.716z",
      "M12,2 C9.24,2 7,4.24 7,7 C7,9.08 8.27,10.87 10.07,11.61 C6.6,12.71 4,16.03 4,20 C4,21.5 7.5,22 12,22 C16.5,22 20,21.5 20,20 C20,16.03 17.4,12.71 13.93,11.61 C15.73,10.87 17,9.08 17,7 C17,4.24 14.76,2 12,2 Z",
      "M12 1 L14 9 L22 12 L14 15 L12 23 L10 15 L2 12 L10 9 Z",
      "M12 2 C8.13 2 5 5.13 5 9 C5 11.38 6.19 13.47 8 14.74 L9 21 C9 21.55 9.45 22 10 22 L14 22 C14.55 22 15 21.55 15 21 L16 14.74 C17.81 13.47 19 11.38 19 9 C19 5.13 15.87 2 12 2 Z",
      "M6 4 L18 4 L22 10 L12 22 L2 10 Z"
    ];

    const currentSvg = paths[contactStep]!;
    const scale = isMobile ? 10 : 15;

    const xOff = isMobile ? 0 : (w >= 1536 ? w * 0.12 : w * 0.18);
    const yOff = isMobile ? -150 : (w >= 1536 ? -40 : 0);

    const noiseA = 0;
    const noiseS = 0;

    const pulseWeight = isContactTyping ? 0.15 : 0;

    const tension = (contactStep === 3 || contactStep === 5) ? 0.7 : 1;

    return {
      shapes: [
        { id: `contact-svg-${contactStep}`, points: getSvgPathPoints(pts, currentSvg, 0, 0, scale), xOffset: xOff, yOffset: yOff, scale: 1, rotation: 0 }
      ],
      config: { tension, noiseAmp: noiseA, noiseSpeed: noiseS, morphWeight: 0, gooBlur: 0, alphaMult: 1, alphaAdd: 0, pulseType: 'soft', pulseWeight, xOffset: 0 }
    };
  } else {
    return getDefaultState({ w, h, isMobile, isContactActive } as TargetStateOptions);
  }
}

function getDefaultState({ w, h, isMobile, isContactActive }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;
  const radius = isMobile ? 120 : 180
  return {
    shapes: [
      { points: getCirclePoints(pts, radius, 0, 0), xOffset: 0, yOffset: 0, scale: 1, rotation: 0 }
    ],
    config: { tension: 1, noiseAmp: isMobile ? 25 : 40, noiseSpeed: 1, morphWeight: 0, gooBlur: 15, alphaMult: 25, alphaAdd: -10, pulseType: isContactActive ? 'soft' : 'sharp', pulseWeight: 0, xOffset: 0 }
  }
}

function getTechStackState({ w, h, isMobile, hoveredTechIndex = -1 }: TargetStateOptions): TargetStateConfig {
  const pts = isMobile ? 90 : 240;
  const targetShapes: TargetShape[] = [];

  const xOff = isMobile ? 0 : -w / 4;
  const yOff = isMobile ? -h * 0.15 : 0;

  if (hoveredTechIndex === -1) {
    const radius = isMobile ? 120 : 180;
    targetShapes.push({

      points: getCirclePoints(pts, radius, 0, 0),
      xOffset: xOff,
      yOffset: yOff,
      scale: 1,
      rotation: 0,
      pulseX: 0,
      pulseY: 0,
      noiseMult: 1.0
    });

    return {
      shapes: targetShapes,
      config: {
        tension: 0,
        noiseAmp: 30,
        noiseSpeed: 1,
        morphWeight: 0,
        gooBlur: 20,
        alphaMult: 30,
        alphaAdd: -12,
        pulseType: 'soft',
        pulseWeight: 0,
        xOffset: 0
      }
    }
  } else {
    const ids = ['tech-vue', 'tech-gsap', 'tech-tailwind', 'tech-canvas'];
    let shapePts;
    let shapeConfig: TargetStateConfig['config'] = {
      tension: 0,
      noiseAmp: 0,
      noiseSpeed: 0,
      morphWeight: 0,
      gooBlur: 0,
      alphaMult: 1,
      alphaAdd: 0,
      pulseType: 'sharp',
      pulseWeight: 0,
      xOffset: 0
    };

    if (hoveredTechIndex === 0) { // Vue & Nuxt (Реактивное ядро)
      const radius = isMobile ? 120 : 180;
      shapePts = getHexagonPoints(pts, radius, 0, 0);
      shapeConfig = {
        tension: 0,
        noiseAmp: 5,
        noiseSpeed: 0.5,
        morphWeight: 0,
        gooBlur: 0,
        alphaMult: 1,
        alphaAdd: 0,
        pulseType: 'sharp',
        pulseWeight: 0,
        xOffset: 0
      };
    } else if (hoveredTechIndex === 1) { // GSAP (Кривая времени)
      const width = isMobile ? 240 : 360;
      shapePts = getInfinityPoints(pts, width, 0, 0);
      shapeConfig = {
        tension: 1,
        noiseAmp: 0,
        noiseSpeed: 0,
        morphWeight: 1,
        gooBlur: 10,
        alphaMult: 25,
        alphaAdd: -10,
        pulseType: 'soft',
        pulseWeight: 0,
        xOffset: 0
      };
    } else if (hoveredTechIndex === 2) { // Tailwind (Модульная матрица)
      const width = isMobile ? 180 : 260;
      shapePts = getRectanglePoints(pts, width, width, 0, 0);
      shapeConfig = {
        tension: 0,
        noiseAmp: 0,
        noiseSpeed: 0,
        morphWeight: 0,
        gooBlur: 0,
        alphaMult: 1,
        alphaAdd: 0,
        pulseType: 'sharp',
        pulseWeight: 0,
        xOffset: 0
      };
    } else if (hoveredTechIndex === 3) { // Canvas & SVG (Симбиот)
      const radius = isMobile ? 120 : 180;
      shapePts = getCirclePoints(pts, radius, 0, 0);
      shapeConfig = {
        tension: 1,
        noiseAmp: 80,
        noiseSpeed: 3,
        morphWeight: 0,
        gooBlur: 25,
        alphaMult: 30,
        alphaAdd: -12,
        pulseType: 'soft',
        pulseWeight: 0,
        xOffset: 0
      };
    }

    targetShapes.push({
      id: ids[hoveredTechIndex] || 'tech-default',
      points: shapePts || [],
      xOffset: xOff,
      yOffset: yOff,
      scale: 1,
      rotation: 0,
      pulseX: 0,
      pulseY: 0,
      noiseMult: hoveredTechIndex === 3 ? 1 : 0
    });

    return {
      shapes: targetShapes,
      config: shapeConfig
    }
  }
}

export function getTargetState(options: TargetStateOptions): TargetStateConfig {
  let target: TargetStateConfig;
  if (options.isTechStackActive) target = getTechStackState(options);
  else if (options.isPriceActive) target = getPriceState(options);
  else if (options.isApproachActive) target = getApproachState(options);
  else if (options.isPortfolioActive) target = getPortfolioState(options);
  else if (options.isAboutActive) target = getAboutState(options);
  else if (options.isContactActive) target = getContactState(options);
  else target = getDefaultState(options);

  if (!options.isMobile) {
    // Синхронизируем размер Canvas-сферы с двумерной Fluid Typography (16px @ 1920x1080)
    const scaleW = options.w / 1920;
    const scaleH = options.h / 1080;
    const baseScale = Math.min(scaleW, scaleH);
    // Максимальный масштаб 1.0 (соответствует 16px), чтобы на 2K/4K сфера не становилась огромной
    const remScale = Math.max(0.45, Math.min(1.0, baseScale));

    // Исключаем About-состояние из масштабирования, так как оно жестко привязано к w/2
    if (!options.isAboutActive) {
      target.shapes.forEach(shape => {
        shape.xOffset *= remScale;
        shape.yOffset *= remScale;
        if (shape.pulseX !== undefined) shape.pulseX *= remScale;
        if (shape.pulseY !== undefined) shape.pulseY *= remScale;

        shape.points.forEach(p => {
          p.x *= remScale;
          p.y *= remScale;
        });
      });

      if (target.config.xOffset !== undefined) {
        target.config.xOffset *= remScale;
      }
    }
  }

  return target;
}

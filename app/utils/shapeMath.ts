import { svgPathProperties } from 'svg-path-properties';

export interface Point {
  x: number;
  y: number;
  angle: number;
  normal: { x: number; y: number };
  renderX?: number;
  renderY?: number;
  vx?: number;
  vy?: number;
  targetX?: number;
  targetY?: number;
  targetAngle?: number;
  targetNormal?: { x: number; y: number };
}

export function getCirclePoints(n: number, radius: number, cx: number, cy: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    // Clockwise: angle goes from 0 to 2PI
    const angle = (i / n) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      angle: angle,
      normal: { x: Math.cos(angle), y: Math.sin(angle) }
    });
  }
  return points;
}

// Плавная интерполяция для сглаживания нормалей на углах прямоугольника
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Общая функция для построения формы по вершинам с равномерным распределением точек
function getPointsFromVertices(n: number, vertices: {x: number, y: number}[], cx: number, cy: number, cornerRadius: number = 0): Point[] {
  const points: Point[] = [];
  const edges = [];
  let totalPerimeter = 0;

  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % vertices.length]!;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Нормаль к ребру (повернута на 90 градусов наружу: если по часовой, то (-dy, dx), нормализованная)
    // В SVG координаты Y идут вниз, обход по часовой. Наружу это (-dy/len, dx/len).
    const nx = -dy / length;
    const ny = dx / length;
    
    edges.push({ p1, p2, length, nx, ny });
    totalPerimeter += length;
  }

  if (edges.length === 0) return points;

  const step = totalPerimeter / n;
  let currentDist = 0;

  for (let i = 0; i < n; i++) {
    let distOnEdge = currentDist;
    let edgeIdx = 0;
    for (let j = 0; j < edges.length; j++) {
      if (distOnEdge <= edges[j]!.length || j === edges.length - 1) {
        edgeIdx = j;
        break;
      }
      distOnEdge -= edges[j]!.length;
    }

    const edge = edges[edgeIdx]!;
    const t = distOnEdge / edge.length;
    const x = edge.p1.x + t * (edge.p2.x - edge.p1.x);
    const y = edge.p1.y + t * (edge.p2.y - edge.p1.y);

    let normal = { x: edge.nx, y: edge.ny };
    
    if (cornerRadius > 0) {
      const distToP1 = distOnEdge;
      const distToP2 = edge.length - distOnEdge;
      
      if (distToP1 < cornerRadius) {
        const prevEdge = edges[(edgeIdx - 1 + edges.length) % edges.length]!;
        const t_blend = distToP1 / cornerRadius;
        const blend = smoothstep(0, 1, t_blend);
        normal.x = prevEdge.nx * (1 - blend) + edge.nx * blend;
        normal.y = prevEdge.ny * (1 - blend) + edge.ny * blend;
      } else if (distToP2 < cornerRadius) {
         const nextEdge = edges[(edgeIdx + 1) % edges.length]!;
         const t_blend = distToP2 / cornerRadius;
         const blend = smoothstep(0, 1, t_blend);
         normal.x = nextEdge.nx * (1 - blend) + edge.nx * blend;
         normal.y = nextEdge.ny * (1 - blend) + edge.ny * blend;
      }
      
      const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      if (len > 0) {
        normal.x /= len;
        normal.y /= len;
      }
    }

    let angle = Math.atan2(y, x);
    if (angle < 0) angle += 2 * Math.PI;

    points.push({ x: cx + x, y: cy + y, angle, normal });
    currentDist += step;
  }

  return points;
}

export function getDiamondPoints(n: number, width: number, height: number, cx: number, cy: number): Point[] {
  const vertices = [
    { x: 0, y: -height / 2 },
    { x: width / 2, y: 0 },
    { x: 0, y: height / 2 },
    { x: -width / 2, y: 0 }
  ];
  return getPointsFromVertices(n, vertices, cx, cy, Math.min(width, height) * 0.1);
}

export function getHexagonPoints(n: number, radius: number, cx: number, cy: number): Point[] {
  const vertices = [];
  // Flat-topped hexagon
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2; 
    vertices.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  return getPointsFromVertices(n, vertices, cx, cy, radius * 0.05);
}

export function getInfinityPoints(n: number, width: number, cx: number, cy: number): Point[] {
  const points: Point[] = [];
  const a = width / 2;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    // Lemniscate of Bernoulli
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const x = (a * Math.cos(t)) / denom;
    const y = (a * Math.sin(t) * Math.cos(t)) / denom;
    
    const t_next = ((i + 1) / n) * Math.PI * 2;
    const denom_next = 1 + Math.sin(t_next) * Math.sin(t_next);
    const x_next = (a * Math.cos(t_next)) / denom_next;
    const y_next = (a * Math.sin(t_next) * Math.cos(t_next)) / denom_next;
    
    const dx = x_next - x;
    const dy = y_next - y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    let nx = length > 0 ? -dy / length : 0;
    let ny = length > 0 ? dx / length : 1;
    
    let angle = Math.atan2(y, x);
    if (angle < 0) angle += 2 * Math.PI;
    
    points.push({
      x: cx + x,
      y: cy + y,
      angle: angle,
      normal: { x: nx, y: ny }
    });
  }
  return points;
}



export function getDividedDropPoints(n: number, radius: number, stretch: number, cx: number, cy: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    // Создаем форму "гантели" или делящейся клетки: сужение по центру оси X
    // Формула: r = radius * (1 - stretch * cos(2 * angle)^2) -> или лучше (1 + stretch * cos(angle)^2) для овала
    // Для гантели, где Y сжимается:
    
    // Но лучше просто растянутый овал, так как "восьмерка" сложно описывается нормалями в центре
    // Сделаем вытянутый по горизонтали овал (восьмерку сделаем за счет GSAP шума)
    const rx = radius * (1 + stretch);
    const ry = radius * (1 - stretch * 0.5);
    
    // Эллипс, но сжатый посередине
    const press = 1 - 0.4 * Math.pow(Math.cos(angle), 2);
    
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry * press;
    
    points.push({
      x: cx + x,
      y: cy + y,
      angle: angle,
      // Упрощенная нормаль
      normal: { x: Math.cos(angle), y: Math.sin(angle) }
    });
  }
  return points;
}


export function getBracketPoints(n: number, width: number, height: number, cx: number, cy: number, thickness: number, direction: 'left' | 'right'): Point[] {
  const vertices = direction === 'left' ? [
    { x: width/2, y: -height/2 }, // Top Right Outer
    { x: width/2, y: -height/2 + thickness }, // Top Right Inner (vertical cap)
    { x: -width/2 + thickness * 1.5, y: 0 }, // Inner Tip (shifted slightly right to keep thickness consistent)
    { x: width/2, y: height/2 - thickness }, // Bottom Right Inner
    { x: width/2, y: height/2 }, // Bottom Right Outer
    { x: -width/2, y: 0 } // Outer Tip
  ] : [
    { x: -width/2, y: -height/2 }, // Top Left Outer
    { x: width/2, y: 0 }, // Outer Tip
    { x: -width/2, y: height/2 }, // Bottom Left Outer
    { x: -width/2, y: height/2 - thickness }, // Bottom Left Inner (vertical cap)
    { x: width/2 - thickness * 1.5, y: 0 }, // Inner Tip
    { x: -width/2, y: -height/2 + thickness } // Top Left Inner
  ];
  // Отключаем сглаживание углов (0), чтобы скобки были максимально острыми и "айтишными"
  return getPointsFromVertices(n, vertices, cx, cy, 0);
}

export function getRectanglePoints(n: number, width: number, height: number, cx: number, cy: number): Point[] {
  const points: Point[] = [];
  const perimeter = 2 * width + 2 * height;
  const step = perimeter / n;

  // Позиции углов вдоль периметра и нормали смежных рёбер.
  // Обход начинается с середины правого ребра (width/2, 0) по часовой стрелке.
  const corners = [
    { dist: height / 2,                          nBefore: { x: 1, y: 0 },  nAfter: { x: 0, y: 1 } },   // bottom-right
    { dist: height / 2 + width,                   nBefore: { x: 0, y: 1 },  nAfter: { x: -1, y: 0 } },  // bottom-left
    { dist: height / 2 + width + height,           nBefore: { x: -1, y: 0 }, nAfter: { x: 0, y: -1 } },  // top-left
    { dist: height / 2 + 2 * width + height,       nBefore: { x: 0, y: -1 }, nAfter: { x: 1, y: 0 } },   // top-right
  ];

  // Зона сглаживания углов: 15% от меньшей стороны.
  // В этой зоне нормаль плавно переходит от одного ребра к другому через smoothstep.
  const cornerRadius = Math.min(width, height) * 0.15;

  let currentDist = 0;
  for (let i = 0; i < n; i++) {
    let x = 0, y = 0;
    let edgeNormal = { x: 0, y: 0 };

    if (currentDist <= height / 2) {
      // Right edge (bottom half)
      x = width / 2;
      y = currentDist;
      edgeNormal = { x: 1, y: 0 };
    } else if (currentDist <= height / 2 + width) {
      // Bottom edge
      x = width / 2 - (currentDist - height / 2);
      y = height / 2;
      edgeNormal = { x: 0, y: 1 };
    } else if (currentDist <= height / 2 + width + height) {
      // Left edge
      x = -width / 2;
      y = height / 2 - (currentDist - height / 2 - width);
      edgeNormal = { x: -1, y: 0 };
    } else if (currentDist <= height / 2 + 2 * width + height) {
      // Top edge
      x = -width / 2 + (currentDist - height / 2 - width - height);
      y = -height / 2;
      edgeNormal = { x: 0, y: -1 };
    } else {
      // Right edge (top half)
      x = width / 2;
      y = -height / 2 + (currentDist - height / 2 - 2 * width - height);
      edgeNormal = { x: 1, y: 0 };
    }

    // Сглаживание нормалей вблизи углов: плавный переход через smoothstep
    // между нормалями смежных рёбер. Это предотвращает «защипы» и разрывы.
    let normal = { ...edgeNormal };
    for (const corner of corners) {
      if (currentDist > corner.dist - cornerRadius && currentDist < corner.dist + cornerRadius) {
        const t = smoothstep(corner.dist - cornerRadius, corner.dist + cornerRadius, currentDist);
        normal = {
          x: corner.nBefore.x * (1 - t) + corner.nAfter.x * t,
          y: corner.nBefore.y * (1 - t) + corner.nAfter.y * t,
        };
        // Нормализация интерполированного вектора
        const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        if (len > 0) {
          normal.x /= len;
          normal.y /= len;
        }
        break;
      }
    }

    let angle = Math.atan2(y, x);
    if (angle < 0) angle += 2 * Math.PI;
    points.push({ x: cx + x, y: cy + y, angle, normal });
    currentDist += step;
  }
  return points;
}


export function getNoise(angle: number, time: number, morphWeight: number = 0): number {
  // Идеальный шум для Сферы (высокочастотный, хаотичный)
  const sphereNoise = Math.sin(angle * 3 + time * 0.8) * 0.5 
                    + Math.sin(angle * 5 - time * 1.2) * 0.25 
                    + Math.sin(angle * 2 + time * 0.5) * 0.25;

  // Шум для Квадрата: повышенные частоты (4, 6, 8) создают несколько
  // независимых «рябей» на каждом ребре вместо одной волны на всё ребро.
  // ВАЖНО: все частоты — чётные числа, чтобы начало и конец кривой (0 и 2PI)
  // идеально совпадали. Иначе будет "разрыв", создающий щупальце медузы!
  const squareNoise = Math.sin(angle * 4 + time * 0.5) * 0.35 
                    + Math.sin(angle * 6 - time * 0.4) * 0.35 
                    + Math.sin(angle * 8 + time * 0.6) * 0.3;

  // Плавный бленд между двумя типами шума
  return sphereNoise * (1 - morphWeight) + squareNoise * morphWeight;
}

/**
 * Касательный (тангенциальный) шум — смещение точек ВДОЛЬ поверхности.
 * Использует другие фазы и частоты, чтобы движение по касательной
 * было независимо от нормального шума.
 */
export function getTangentNoise(angle: number, time: number, morphWeight: number = 0): number {
  const sphereTangent = Math.sin(angle * 4 + time * 1.1) * 0.5
                      + Math.sin(angle * 6 - time * 0.7) * 0.3
                      + Math.sin(angle * 2 + time * 1.5) * 0.2;

  const squareTangent = Math.sin(angle * 6 + time * 0.6 + 1.0) * 0.4
                      + Math.sin(angle * 4 - time * 0.5 + 2.0) * 0.35
                      + Math.sin(angle * 8 + time * 0.7) * 0.25;

  return sphereTangent * (1 - morphWeight) + squareTangent * morphWeight;
}

export function drawCatmullRom(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | Path2D, points: {x: number, y: number}[], length: number, close = true, tension = 1) {
  const n = length;
  if (n < 3) return;
  
  if ('beginPath' in ctx) ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  
  const getPoint = close
    ? (i: number) => points[((i % n) + n) % n]!
    : (i: number) => points[Math.max(0, Math.min(n - 1, i))]!;
  
  for (let i = 0; i < n; i++) {
    const p0 = getPoint(i - 1);
    const p1 = getPoint(i);
    const p2 = getPoint(i + 1);
    const p3 = getPoint(i + 2);
    
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  
  if (close) {
    if ('closePath' in ctx) ctx.closePath();
  }
}

const svgPathCache = new Map<string, Point[]>();

/**
 * Парсит SVG-путь и возвращает заданное количество точек с рассчитанными нормалями.
 * Иконка автоматически центрируется относительно переданных cx, cy.
 * Сама тяжелая операция парсинга кэшируется, чтобы не тратить CPU при повторных вызовах.
 */
export function getSvgPathPoints(n: number, pathString: string, cx: number, cy: number, scale: number = 1): Point[] {
  const cacheKey = `${pathString}_${n}`;
  
  let basePoints: Point[];
  
  if (svgPathCache.has(cacheKey)) {
    basePoints = svgPathCache.get(cacheKey)!;
  } else {
    basePoints = [];
    const properties = new svgPathProperties(pathString);
    const totalLength = properties.getTotalLength();
    const step = totalLength / n;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    const sampled = [];
    for (let i = 0; i < n; i++) {
      const dist = i * step;
      const pt = properties.getPointAtLength(dist);
      const tangent = properties.getTangentAtLength(dist);
      
      minX = Math.min(minX, pt.x);
      maxX = Math.max(maxX, pt.x);
      minY = Math.min(minY, pt.y);
      maxY = Math.max(maxY, pt.y);
      
      sampled.push({ pt, tangent });
    }
    
    const bboxCx = (minX + maxX) / 2;
    const bboxCy = (minY + maxY) / 2;
    
    for (let i = 0; i < n; i++) {
      const { pt, tangent } = sampled[i]!;
      const x = pt.x - bboxCx;
      const y = pt.y - bboxCy;
      
      // Вектор касательной (dx, dy). Нормаль наружу (при обходе по часовой) = (-dy, dx)
      const len = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
      let normal = len > 0 ? { x: -tangent.y / len, y: tangent.x / len } : { x: 0, y: -1 };
      
      let angle = Math.atan2(y, x);
      if (angle < 0) angle += 2 * Math.PI;
      
      basePoints.push({ x, y, angle, normal });
    }

    // 1. Нормализация направления обхода
    // Для плавного морфинга все контуры должны иметь одно направление (по часовой стрелке).
    // Вычисляем знаковую площадь многоугольника. В координатах Canvas (Y вниз) > 0 значит по часовой.
    let signedArea = 0;
    for (let i = 0; i < n; i++) {
      const p1 = basePoints[i]!;
      const p2 = basePoints[(i + 1) % n]!;
      signedArea += (p1.x * p2.y - p2.x * p1.y);
    }

    if (signedArea < 0) {
      // Контур нарисован против часовой стрелки. Разворачиваем массив точек.
      basePoints.reverse();
      // Так как мы шли против часовой, нормали смотрели вовнутрь. Выворачиваем их наружу.
      for (let i = 0; i < n; i++) {
        basePoints[i]!.normal.x *= -1;
        basePoints[i]!.normal.y *= -1;
        // Углы остаются корректными, так как мы их просто переставили местами вместе с точками.
      }
    }

    // 2. Выравнивание стартовой точки
    // Чтобы при морфинге фигуры не "перекручивались", начальная точка массива (индекс 0)
    // должна находиться в одном и том же месте у всех фигур (ближе всего к углу 0 / правый край).
    let bestStartIndex = 0;
    let minAngleDiff = Infinity;
    for (let i = 0; i < n; i++) {
      let a = basePoints[i]!.angle;
      let diff = Math.min(a, 2 * Math.PI - a);
      if (diff < minAngleDiff) {
        minAngleDiff = diff;
        bestStartIndex = i;
      }
    }

    if (bestStartIndex > 0) {
      // Сдвигаем массив точек, чтобы самая "правая" точка стала первой
      basePoints = basePoints.slice(bestStartIndex).concat(basePoints.slice(0, bestStartIndex));
    }
    
    svgPathCache.set(cacheKey, basePoints);
  }
  
  return basePoints.map(p => {
    return {
      x: cx + p.x * scale,
      y: cy + p.y * scale,
      angle: p.angle,
      normal: { x: p.normal.x, y: p.normal.y }
    };
  });
}



import type { Point } from '~/utils/shapeMath'
import type gsap from 'gsap'

export interface PriceOption {
  id: string;
  name: string;
  price: number;
  selected: boolean;
  angle: number;
  radiusOffset: number;
  description?: string;
}

export interface ShapeState {
  id: string | number;
  points: Point[];
  targetPoints?: Point[];
  xOffset: number;
  yOffset: number;
  scale: number;
  rotation: number;
  active: boolean;
  pulseTl?: gsap.core.Timeline;
  pointsTween?: gsap.core.Tween;
  pulseOffsetX: number;
  pulseOffsetY?: number;
  noisePhaseOffset?: number;
  noiseMult?: number;
  isHole?: boolean;
  physX?: number;
  physY?: number;
  lastVx?: number;
  lastVy?: number;
  defX?: number;
  defY?: number;
  defVx?: number;
  defVy?: number;
}

export interface StateConfig {
  tension: number;
  noiseAmp: number;
  noiseSpeed: number;
  morphWeight: number;
  gooBlur: number;
  alphaMult: number;
  alphaAdd: number;
  pulseWeight: number;
  pulseSpeed?: number;
  pulseType?: 'sharp' | 'soft';
  xOffset: number;
  preloaderProgress?: number;
  fillProgress?: number;
  duration?: number;
  ease?: string;
}

export interface TargetShape {
  id?: string;
  points: Point[];
  xOffset: number;
  yOffset: number;
  scale: number;
  rotation: number;
  pulseX?: number;
  pulseY?: number;
  noiseMult?: number;
  isHole?: boolean;
}

export interface TargetStateConfig {
  shapes: TargetShape[];
  config: StateConfig;
}

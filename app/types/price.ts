export interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastX: number;
  lastY: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  isDragging: boolean;
  isTextHidden: boolean;
}

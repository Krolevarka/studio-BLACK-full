// Use module-scoped variables to avoid creating refs/reactivity overhead
// and maintain a singleton pattern for the global mouse listener.
let isListening = false;
let activeInstances = 0;
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let vx = 0;
let vy = 0;
let speed = 0;
let rafId: number | null = null;

function updateVelocity() {
  // Calculate velocity based on delta since last frame
  vx = mouseX - prevMouseX;
  vy = mouseY - prevMouseY;
  speed = Math.sqrt(vx * vx + vy * vy);

  // Damping / interpolation for smooth falloff
  prevMouseX += (mouseX - prevMouseX) * 0.5;
  prevMouseY += (mouseY - prevMouseY) * 0.5;

  // Auto-stop RAF if velocity is extremely low and we are very close to the target
  if (speed < 0.01 && Math.abs(mouseX - prevMouseX) < 0.01 && Math.abs(mouseY - prevMouseY) < 0.01) {
    vx = 0;
    vy = 0;
    speed = 0;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    return;
  }

  rafId = requestAnimationFrame(updateVelocity);
}

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  
  // Resume RAF if it was stopped
  if (rafId === null && isListening) {
    rafId = requestAnimationFrame(updateVelocity);
  }
}

export function useMouseVelocity() {
  const startListening = () => {
    if (typeof window === 'undefined') return;
    activeInstances++;
    if (isListening) return;
    isListening = true;
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    
    // Initialize previous position to current mouse position to prevent initial jump
    // But since we don't know the position yet, we'll wait for the first mousemove
    // or just let it smoothly interpolate from 0
    if (rafId === null) {
      rafId = requestAnimationFrame(updateVelocity);
    }
  };

  const stopListening = () => {
    if (activeInstances > 0) activeInstances--;
    if (activeInstances === 0 && isListening) {
      isListening = false;
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };

  const getVelocity = () => ({ vx, vy, speed });

  return {
    startListening,
    stopListening,
    getVelocity
  };
}

import type { Ref } from 'vue'
import type { PriceOption } from '~/types/organic'
import type { PhysicsState } from '~/types/price'

let cachedObstacles: { el: Element, rect: DOMRect }[] = []

export function usePriceCollision(options: Ref<PriceOption[]>, isMobile: Ref<boolean>) {
  const updateObstaclesCache = () => {
    cachedObstacles = Array.from(document.querySelectorAll('.price-collision-obstacle')).map(el => ({
      el,
      rect: el.getBoundingClientRect()
    }))
  }

  const checkCollision = (pState: PhysicsState, el: HTMLElement, opt: PriceOption, physicsMap: Map<string, PhysicsState>) => {
    let collision = false;
    
    const absX = window.innerWidth / 2 + pState.x;
    const absY = window.innerHeight / 2 + pState.y;
    
    const collisionRadius = isMobile.value ? 20 : 35;
    const coreCollisionRadius = isMobile.value ? 80 : 110;

    const distToCenter = Math.hypot(pState.x, pState.y);
    if (distToCenter < coreCollisionRadius + collisionRadius) {
      collision = true;
    }

    if (!collision) {
      for (const otherOpt of options.value) {
        if (otherOpt.id === opt.id || otherOpt.selected) continue;
        const otherPState = physicsMap.get(otherOpt.id);
        if (otherPState) {
          const dist = Math.hypot(pState.x - otherPState.x, pState.y - otherPState.y);
          if (dist < collisionRadius * 2 + 10) {
            collision = true;
            break;
          }
        }
      }
    }

    if (!collision) {
      if (cachedObstacles.length === 0) updateObstaclesCache();
      const satelliteRadius = isMobile.value ? 48 : 80;
      const uiCollisionMargin = satelliteRadius + 15; 
      
      for (let i = 0; i < cachedObstacles.length; i++) {
        const obs = cachedObstacles[i];
        if (!obs || !obs.el) continue;
        const rect = obs.el.getBoundingClientRect();

        const expandedLeft = rect.left - uiCollisionMargin;
        const expandedRight = rect.right + uiCollisionMargin;
        const expandedTop = rect.top - uiCollisionMargin;
        const expandedBottom = rect.bottom + uiCollisionMargin;

        if (absX > expandedLeft && absX < expandedRight && absY > expandedTop && absY < expandedBottom) {
          collision = true;
          break;
        }
      }
    }
    return collision
  }

  return {
    updateObstaclesCache,
    checkCollision
  }
}

import { useOrganicState } from './organic/useOrganicState'
import { useOrganicSync } from './organic/useOrganicSync'
import { useOrganicMenu } from './organic/useOrganicMenu'
import { usePreloader } from './organic/usePreloader'

export function useOrganicCore() {
  const state = useOrganicState()
  const { initOrganicCore, updateShapeOffset, destroyOrganicCore } = useOrganicSync()
  const { expandForMenu, collapseFromMenu } = useOrganicMenu()
  const { startPreloaderAnimation } = usePreloader()

  return {
    shapes: state.shapes,
    stateConfig: state.stateConfig,
    isPreloading: state.isPreloading,
    expandForMenu,
    collapseFromMenu,
    initOrganicCore,
    updateShapeOffset,
    startPreloaderAnimation,
    destroyOrganicCore
  }
}


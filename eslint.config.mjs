// Базовый конфиг от @nuxt/eslint (генерируется в .nuxt при `nuxt prepare`)
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Служебные папки, не относящиеся к коду приложения (глобальный ignore — отдельным объектом)
    ignores: ['skills/**', 'host/**', 'site/**']
  },
  {
    rules: {
      // Проект использует однословные имена секционных компонентов через префиксы папок
      'vue/multi-word-component-names': 'off'
    }
  }
)

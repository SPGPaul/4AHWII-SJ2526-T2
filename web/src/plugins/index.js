/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import router from '@/router'
import VChart from 'vue-echarts'

export function registerPlugins (app) {
  app
    .use(vuetify)
    .use(router)
    .component('VChart', VChart)
}
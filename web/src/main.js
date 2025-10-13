/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

// Icons
import 'material-design-icons-iconfont/dist/material-design-icons.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

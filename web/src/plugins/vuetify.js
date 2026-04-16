/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import colors from 'vuetify/util/colors'
// Composables

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme-preference') : null
const defaultTheme = savedTheme === 'dark' ? 'dark' : savedTheme === 'light' ? 'light' : 'light'

export default createVuetify({
  theme: {
    defaultTheme,
    themes: {
      light: {
        dark: false,
        colors: {
          primary: colors.green.darken1,
          secondary: colors.green.base,
          background: '#f7fff8',
          surface: '#ffffff',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: colors.green.lighten1,
          secondary: colors.green.lighten2,
          background: '#121812',
          surface: '#1d251d',
        },
      }
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets:{
      mdi,
    },
  },

},
)

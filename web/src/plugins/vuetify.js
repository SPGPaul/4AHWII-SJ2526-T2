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

const THEME_STORAGE_KEY = 'rechnungsradar-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: getInitialTheme(),
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#f4fbf6',
          surface: '#ffffff',
          'surface-bright': '#ffffff',
          primary: colors.green.base,
          secondary: colors.green.lighten1,
          accent: colors.green.accent2,
          'on-background': '#28282B',
          'on-surface': '#28282B',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#111613',
          surface: '#18211d',
          'surface-bright': '#203029',
          primary: '#8ad3a4',
          secondary: '#6fd19b',
          accent: '#a2e3b6',
          'on-background': '#edf5ef',
          'on-surface': '#edf5ef',
        },
      },
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

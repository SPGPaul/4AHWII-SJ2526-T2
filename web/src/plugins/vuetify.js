/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { color } from 'echarts'
import colors from 'vuetify/util/colors'
// Composables

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: {
      colors:{
        'primary' :  '#ffffff',
        'secondary' : colors.green.base,
      }
    }
    
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

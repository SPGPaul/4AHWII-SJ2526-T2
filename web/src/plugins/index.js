/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import router from "@/router";
import vuetify from "./vuetify";
import VChart from "vue-echarts";

export function registerPlugins(app) {
  app.use(vuetify).use(router).component("VChart", VChart);
}

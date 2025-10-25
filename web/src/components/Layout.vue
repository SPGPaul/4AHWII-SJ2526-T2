<template>
  <v-toolbar class="bg-white">
    <v-col cols="12" offset-sm="3" sm="6">
      <span class="text-h5 text-primary bg-white align-right">Menu</span>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn class="align-right" variant="text" v-bind="props">
            <v-icon color="primary" icon="$menu" />
          </v-btn>
        </template>

        <v-list>
          <v-list-item v-for="(item, i) in items" :key="i" :value="i">
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-col>

      <v-row align="center" justify="center">
      <v-col cols="auto">
        <v-btn icon="mdi-account" class="text-primary"></v-btn>
      </v-col>
    </v-row>
  </v-toolbar>

  <v-card>
    <v-layout>
      <v-navigation-drawer floating permanent class="bg-white">
        <v-list density="compact" nav>
          <v-list-item
            class="text-primary"
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            value="Dashboard"
            to=""
          ></v-list-item>
          <v-list-item
            class="text-primary"
            prepend-icon="mdi-account-box"
            title="Account"
            value="Account"
            to=""
          ></v-list-item>
          <v-list-item
            class="text-primary"
            prepend-icon="mdi-poll"
            title="Analysis"
            value="Analysis"
            to="/analysis"
          ></v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-1">
            <v-btn block class="bg-primary"> Logout </v-btn>
          </div>
        </template>
      </v-navigation-drawer>
      <v-main style="height: 870px">
        <slot />
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup lang="ts">
const items = [
  {
    title: "Analysis Area",
  },
  {
    title: "Da muss ncoh n name her",
  },
  {
    title: "Account",
  },
];
/* const links = [
    {
      href: 'https://vuetifyjs.com/',
      icon: 'mdi-text-box-outline',
      subtitle: 'Learn about all things Vuetify in our documentation.',
      title: 'Documentation',
    },
    {
      href: 'https://vuetifyjs.com/introduction/why-vuetify/#feature-guides',
      icon: 'mdi-star-circle-outline',
      subtitle: 'Explore available framework Features.',
      title: 'Features',
    },
    {
      href: 'https://vuetifyjs.com/components/all',
      icon: 'mdi-widgets-outline',
      subtitle: 'Discover components in the API Explorer.',
      title: 'Components',
    },
    {
      href: 'https://discord.vuetifyjs.com',
      icon: 'mdi-account-group-outline',
      subtitle: 'Connect with Vuetify developers.',
      title: 'Community',
    },
  ] */
</script>

<style lang="scss">
.v-navigation-drawer {
  background-color: #e1f5fe;
}
.v-menu {
  margin-right: 0;
}
.v-card {
  margin-bottom: 0;
}
.v-col {
  margin-right: 0;
}
.v-icon {
  margin-right: 0;
}
</style>

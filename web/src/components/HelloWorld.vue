<template>
  <v-card height="200">
    <v-toolbar>
      <v-toolbar-title text="Toolbar"></v-toolbar-title>

      <template v-slot:append>
        <v-btn icon="mdi-magnify"></v-btn>

        <v-btn icon="mdi-heart"></v-btn>

        <v-btn icon="mdi-dots-vertical"></v-btn>
      </template>
    </v-toolbar>
  </v-card>
  <v-container fluid="true">
    <v-row no-gutters>
      <v-col v-for="n in 2" key="n">
        <v-sheet class="pa-2 ma-2">
          .v-col-auto
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
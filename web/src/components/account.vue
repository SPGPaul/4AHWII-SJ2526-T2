<template class="bg-primary">
  <form>
    <v-container class="my-5">
<v-row>
<v-col>
    <v-card elevation="12" variant="outlined" class=" align-center justify-center" color="primary" min-height="250">
    <v-card-item class="align-center justify-center">
    <v-text-field
    class="text-secondary"
      v-model="state.name"
      :counter="10"
      :error-messages="v$.name.$errors.map(e => e.$message)"
      label="Name"
      required
      @blur="v$.name.$touch"
      @input="v$.name.$touch"
    ></v-text-field>
    </v-card-item>
<v-card-item class="align-center justify-center">
    <v-text-field
    class="text-secondary"
      v-model="state.email"
      :error-messages="v$.email.$errors.map(e => e.$message)"
      label="E-mail"
      required
      @blur="v$.email.$touch"
      @input="v$.email.$touch"
    ></v-text-field>
</v-card-item>
<v-card-item class="align-center justify-center">
    <v-text-field
    class="text-secondary"
      v-model="state.password"
      :error-messages="v$.password.$errors.map(e => e.$message)"
      label="Password"
      required
      @blur="v$.password.$touch"
      @input="v$.password.$touch"
    ></v-text-field>
</v-card-item>
<v-card-item class="align-center justify-center">
    <v-btn
      class="justify-center"
      @click="v$.$validate"
    >
      Submit
    </v-btn>
    </v-card-item>
    </v-card>
    
  </v-col>
  </v-row>
  </v-container>
  </form>
</template>
<script setup>
  import { reactive } from 'vue'
  import { useVuelidate } from '@vuelidate/core'
  import { email, required } from '@vuelidate/validators'
  
  const password = String;

  const initialState = {
    name: '',
    email: '',
    password:'',
  }

  const state = reactive({
    ...initialState,
  })


  const rules = {
    name: { required },
    email: { required, email },
    password: { required, password },
  }

  const v$ = useVuelidate(rules, state)

  function clear () {
    v$.value.$reset()

    for (const [key, value] of Object.entries(initialState)) {
      state[key] = value
    }
  }
</script>

<style>
.v-card{
    margin: 300px;
    justify-self: center;
    
}
.v-text-field{
    width: 200px;
    justify-self: center;
    align-items: center;
}
</style>
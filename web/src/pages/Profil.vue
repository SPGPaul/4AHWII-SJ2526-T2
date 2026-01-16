<template class="bg-primary">
  <layout>
    <form>
      <v-container class="my-5">
        <v-row>
          <v-col>
            <v-card
              variant= "outlined"
              class="align-center justify-center" 
            
              elevation="2"
             min-height="250"
            >
              <v-card-item class="align-center justify-center">
              <v-responsive
                    class="mx-auto"
                     max-width="344"
                            >
                <v-text-field
                  variant="outlined"
                  class="text-black bg-white"
                  v-model="state.name"
                  :counter="10"
                  :error-messages="v$.name.$errors.map((e) => e.$message)"
                  label="Name"
                  required
                  @blur="v$.name.$touch"
                  @input="v$.name.$touch"
                ></v-text-field>
                </v-responsive>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                <v-text-field
                variant="outlined"
                  class="text-black bg-white"
                  v-model="state.email"
                  :error-messages="v$.email.$errors.map((e) => e.$message)"
                  label="E-mail"
                  required
                  @blur="v$.email.$touch"
                  @input="v$.email.$touch"
                ></v-text-field>
              </v-card-item>
              <v-card-item class="align-center justify-center">
                 
                <v-text-field
                      v-model="state.password"
                      class="text-black bg-white "
                      variant="outlined"
                      :rules="[rules.required, rules.min]"
                      :type="show1 ? 'text' : 'password'"
                      hint="At least 8 characters"
                      label="Passwort"
                      
                      name="input-10-1"
                    
                      :error-messages="v$.password.$errors.map((e) => e.$message)"
                      @click:append="show1 = !show1"  
                      @blur="v$.password.$touch"
                      @input="v$.password.$touch"
                    >
                 <v-btn class="align-right   justify-right bg-white show-btn"
                    variant="flat">
                    
                      <v-icon class="align-right justify-right mr-20"> mdi-eye</v-icon>
                      
                    </v-btn>  
                  </v-text-field>
                    
              </v-card-item>
               <v-card-item class="align-center justify-center">
                <v-text-field
                variant="outlined"
                  class="text-black bg-white"
                  v-model="state.location"
                  :error-messages="v$.email.$errors.map((e) => e.$message)"
                  label="location"
                  required

                ></v-text-field>
              </v-card-item>
              
              <v-card-item class="align-bottom justify-center">
                <v-btn class="justify-center align-center text-black bg-white"> Submit </v-btn>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </form>
  </layout>
</template>
<script setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";

const password = String;

const initialState = {
  name: "",
  email: "",
  password: "", 
  location:""
};

const state = reactive({
  ...initialState,
});

const rules = {
  name: { required },
  email: { required, email },
  password: { required, password },

};

const v$ = useVuelidate(rules, state);

function clear() {
  v$.value.$reset();

  for (const [key, value] of Object.entries(initialState)) {
    state[key] = value;
  }
}

// Alle verwendeten Methoden
async function fetchData() {
  const apiUrl =
    "https://elegant-eggs-b247740f2b.strapiapp.com/api/Rechnungs-Radar-Users";
  const token =
    "54a258000325fcbff04e65b292fecd2ca70258552324762fd2520e1932269765803183eb47586c2203f12b3abd7c7dbbe3dffe729c8334508eeba14656a85aa5bb7441ec939788a76a8a7e6066b1973362e5cdb6770a50dbecf0d74a4bcebe7c650eb54f08b757e0770003032e5817aa26dc6664c373e2c2e8667888d2d3f2c1";
  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  console.log("Fetch response:", res);
  if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
  return await res.json();
}
</script>

<style>
.v-card {
  margin: 300px;
  width: 600px;
  height: 600px;
  justify-self: center;
  background-color:#bcefc2 ;
  color: #bcefc2;
}
.v-text-field {
  width: 200px;
  justify-self: center;
  align-items: center;
}
.show-btn{
  margin-right: 10px;
  size: 50px;
}
</style>

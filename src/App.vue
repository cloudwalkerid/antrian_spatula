<script setup>
import View from './components/View.vue'
import { ref, watch} from 'vue'

const satker = ref('')

// if (sessionStorage.getItem("satker")) {
//   satker.value = sessionStorage.getItem("satker")
// }

// watch(satker, async (newValue, oldValue) => {
//   console.log(newValue);
//   sessionStorage.setItem("satker", newValue);
// })

</script>

<template>
  <template v-if="satker == null || satker == ''">
    <div class="w-full h-full flex justify-center items-center content-center">
      <div class="w-full md:w-1/3">
        <select class="local-input text-2xl" v-model="satker" placeholder="Pilih Satuan Kerja">
          <Option value="" disabled selected>Pilih Satuan Kerja</Option>
          <Option value="7600">BPS Provinsi Sulawesi Barat</Option>
          <Option value="7601">BPS Kabupaten Majene</Option>
          <Option value="7602">BPS Kabupaten Polewali Mandar</Option>
          <Option value="7603">BPS Kabupaten Mamasa</Option>
          <Option value="7604">BPS Kabupaten Mamuju</Option>
          <Option value="7605">BPS Kabupaten Pasangkayu</Option>
          <Option value="7606">BPS Kabupaten Mamuju Tengah</Option>
        </select>
      </div>
    </div>
  </template>
  <template v-else>
    <View :satker="satker" />
  </template>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

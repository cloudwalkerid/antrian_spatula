import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import YouTube from 'vue3-youtube'

const app =  createApp(App)
app.config.globalProperties.$kode_satker = '';
//'loket_nama' : 'id_aktif'
app.config.globalProperties.$loket_dan_antrian_aktif = {};

app.config.globalProperties.$gabung_list = (list_nama) => {
    if(list_nama.length == 0){
        return '-'
    }else if(list_nama.length == 1){
        return list_nama.join(" dan ");
    }else if (list_nama.length > 1){
        let list_selain_terakhir = list_nama.slice(0, (list_nama.length - 1))
        return list_selain_terakhir.join(', ')+', dan '+list_nama[(list_nama.length - 1)]
    }
}



app.component('YouTube', YouTube)

app.mount('#app');

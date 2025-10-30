<script setup>
  import { ref, reactive , computed, watch } from 'vue'
  import { initializeApp } from 'firebase/app'
  import { getFirestore, doc , onSnapshot } from 'firebase/firestore'
  import getYouTubeID from 'get-youtube-id'


  const props = defineProps({
    satker: String,
  })

  const nama_satker = ref('')
  if(props.satker == '7600'){
    nama_satker.value = 'PROVINSI SULAWESI BARAT'
  }else if(props.satker == '7601'){
    nama_satker.value = 'KABUPATEN MAJENE'
  }else if(props.satker == '7602'){
    nama_satker.value = 'KABUPATEN POLEWALI MANDAR'
  }else if(props.satker == '7603'){
    nama_satker.value = 'KABUPATEN MAMASA'
  }else if(props.satker == '7604'){
    nama_satker.value = 'KABUPATEN MAMUJU'
  }else if(props.satker == '7605'){
    nama_satker.value = 'KABUPATEN PASANGKAYU'
  }else if(props.satker == '7606'){
    nama_satker.value = 'KABUPATEN MAMUJU TENGAH'
  }

  let layanan = {}
  let antrian = {}
  let antrian_change_counter = 0
  const sound_antrian = reactive([]) // {'loket': A, 'play': []}
  const sound_antrian_key = [] 
  const sound_antrian_file_play = reactive([])

  const konfigurasi = ref({})
  const show_data = ref([])
  const audio_sound = ref(null)


  watch(sound_antrian, (newValue, oldValue) => {
    if(newValue.length > 0){
      audio_sound.value.volume = 1
      if(youtube_video){
        if(['video_and_audio', 'no_video_and_audio'].includes(playlist_type.value)){
          youtube_video.value.setVolume(5)
        }
      }
      if(sound_antrian_file_play.length == 0){
        sound_antrian_file_play.push(...newValue[0].play)
      }
    }else{
      if(youtube_video){
        if(['video_and_audio', 'no_video_and_audio'].includes(playlist_type.value)){
          youtube_video.value.setVolume(80) 
        }
      }
    }
  })

  watch(sound_antrian_file_play, (newValue, oldValue) => {
    if(newValue.length > 0){
      audio_sound.value.volume = 1
      if(youtube_video){
        if(['video_and_audio', 'no_video_and_audio'].includes(playlist_type.value)){
          youtube_video.value.setVolume(5)
        }
      }
      audio_sound.value.src = newValue[0]
      audio_sound.value.currentTime = 0
      audio_sound.value.play()
    }else{
      sound_antrian.shift()
    }
  })

  function ended_audio(){
    sound_antrian_file_play.shift()
  }

  function calculetd_show() {
    let ada_layanan = false
    let ada_antrian = false

    const layanan_loket = {};
    const show_data_dict = {};
    for(const key in layanan){
      ada_layanan = true
      const value = {...layanan[key]}
      layanan_loket[value['kode_layanan']] = value['loket']
      if(! (value['loket'] in show_data_dict) ){
        show_data_dict[value['loket']] = {'loket' : value['loket'], 'layanan_id': [], 'layanan': [], 'active': null, 'daftar' : []}
      }
      show_data_dict[value['loket']]['layanan_id'].push(value['kode_layanan'])
      show_data_dict[value['loket']]['layanan'].push(value['layanan']['nama_layanan'])
    }

    let locale_date =  get_date_now_locale()
    for(let id in antrian){
      ada_antrian = true
      if(locale_date != antrian[id]['tanggal']){
        continue
      }
      const value = {...antrian[id]}
      value['id'] = id
      if (value['kode_layanan'] in layanan_loket){
        value['id'] = id
        if(value['status'] == 1){
          show_data_dict[layanan_loket[value['kode_layanan']]]['active'] = value
        }
        show_data_dict[layanan_loket[value['kode_layanan']]]['daftar'].push(value)
      }
    }

    if(ada_layanan && ada_antrian){
      antrian_change_counter += 1
    }else{
      return
    }

    const return_data = [];
    for(const key in show_data_dict){
      show_data_dict[key]['daftar'].sort((a, b) => {
        if(a.status != 2 && b.status == 2){
          return -1
        }else if(a.status == 2 && b.status !=2){
          return 1
        }else if(a.status != 2 && b.status != 2){
          return parseInt(a.antrian) - parseInt(b.antrian)
        }
      })
      return_data.push(show_data_dict[key])
    }

    return_data.sort((a,b) => {
      if(a.loket < b.loket){
        return -1
      }else if(a.loket > b.loket){
        return 1
      }else{
        return 0;
      }
    })
    if(antrian_change_counter > 1){
      return_data.forEach(element => {
        load_file_sound(element)
      });
    }else{
      return_data.forEach(item_loket => {
        if(item_loket['active']){
          const key_id = item_loket['loket'] + '++' + item_loket['active']['id'] + '++' + item_loket['active']['antrian_counter']
          sound_antrian_key.push(key_id)
        }
       
      });
    }
    show_data.value = return_data
    change_load_type_view()
  }

  function load_file_sound(item_loket){
    if(!item_loket['active']){
      return
    }
    const key_id = item_loket['loket'] + '++' + item_loket['active']['id'] + '++' + item_loket['active']['antrian_counter']
    if(sound_antrian_key.includes(key_id)){
      return
    }
    sound_antrian_key.push(key_id)
    sound_antrian.push({'key': key_id, 'loket': item_loket['loket']
          , 'play': load_audio_from_antrian_name(item_loket['loket']
          , item_loket['active']['antrian'])})
  }

  function load_audio_from_antrian_name(loket, antrian)
  {
    const audio_location = '/audio/'
    const return_data = []
    return_data.push(audio_location+"antrian.wav")
    return_data.push(audio_location+loket.toLowerCase()+".wav")

    for (let i = 0; i < antrian.length; i++){ 
      let n = antrian[i]
      if(n == 0){
        return_data.push(audio_location+"nol.wav")
      }else if(n == 1){
        return_data.push(audio_location+"satu.wav")
      }else if(n == 2){
        return_data.push(audio_location+"dua.wav")
      }else if(n == 3){
        return_data.push(audio_location+"tiga.wav")
      }else if(n == 4){
        return_data.push(audio_location+"empat.wav")
      }else if(n == 5){
        return_data.push(audio_location+"lima.wav")
      }else if(n == 6){
        return_data.push(audio_location+"enam.wav")
      }else if(n == 7){
        return_data.push(audio_location+"tujuh.wav")
      }else if(n == 8){
        return_data.push(audio_location+"delapan.wav")
      }else if(n == 9){
        return_data.push(audio_location+"sembilan.wav")
      }
    }
    return_data.push(audio_location+"loket.wav")
    return_data.push(audio_location+loket.toLowerCase()+".wav")
    return return_data
  }

  //time and date
  function get_date_now_locale() {
    let date_time_awal = (new Date()).toLocaleString("id-ID");
    let date_time_awal_arr = date_time_awal.split(',');
    let date_arr = date_time_awal_arr[0].split('/');

    return date_arr[2]+'-'+pad(date_arr[1], 2)+'-'+pad(date_arr[0], 2);
  }

  function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length-size);
  }

  function get_data_dan_time () {
    let date_time_awal = (new Date()).toLocaleString("id-ID");
    let date_time_awal_arr = date_time_awal.split(',');
    let date_arr = date_time_awal_arr[0].split('/');

    let month_name = '';
    if(date_arr[1] == '1'){
        month_name = 'Januari'
    }else if(date_arr[1] == '2'){
        month_name = 'Februari'
    }else if(date_arr[1] == '3'){
        month_name = 'Maret'
    }else if(date_arr[1] == '4'){
        month_name = 'April'
    }else if(date_arr[1] == '5'){
        month_name = 'Mei'
    }else if(date_arr[1] == '6'){
        month_name = 'Juni'
    }else if(date_arr[1] == '7'){
        month_name = 'Juli'
    }else if(date_arr[1] == '8'){
        month_name = 'Agustus'
    }else if(date_arr[1] == '9'){
        month_name = 'September'
    }else if(date_arr[1] == '10'){
        month_name = 'Oktober'
    }else if(date_arr[1] == '11'){
        month_name = 'November'
    }else if(date_arr[1] == '12'){
        month_name = 'Desember'
    }

    return date_arr[0]+' '+month_name+' '+date_arr[2]+', '+date_time_awal_arr[1];
  }

  const date_time_locale = ref('')
  date_time_locale.value = get_data_dan_time()
  setInterval(()=>{
    date_time_locale.value = get_data_dan_time()
  }, 1000);
  
  //video
  let url_active_video = ''
  let index_active_video = 0
  const arr_url_video = []
  const youtube_video = ref(null)
  const playlist_type = ref('no_video_and_no_audio')
  function onReady_youtube()
  {
    if(arr_url_video.length > 0){
      url_active_video = arr_url_video[0]
      index_active_video = 0
      youtube_video.value.loadVideoById(getYouTubeID(arr_url_video[0]), 0)
      youtube_video.value.playVideo()
      if(['video_and_audio', 'no_video_and_audio'].includes(playlist_type.value)){
        youtube_video.value.setVolume(80)
      }else{
        youtube_video.value.setVolume(0)
      }
    }
  }
  function onStateChange_youtube(e)
  {
    if (e.data !== null) {
      if(e.data == 0){
        let index = index_active_video + 1
        if(index >= arr_url_video.length){
          index = 0
        }
        index_active_video = index
        url_active_video = arr_url_video[index]
        youtube_video.value.loadVideoById(getYouTubeID(arr_url_video[index]), 0)
        youtube_video.value.playVideo()
      }
    }
  }
  //end video

  // type view
  const type_view = ref(0) // 0:kosong 1: no konfigurasi 2:
  function change_load_type_view(){
    if(show_data.value.length > 0){
      if(!['video_and_audio', 'video_and_no_audio'].includes(playlist_type.value)){
        //tidak video
        if(show_data.value.length <= 4){
          type_view.value = 0
        }else{
          type_view.value = 1
        }
      }else{
        //ada video
        if(show_data.value.length <= 2){
          type_view.value = 2
        }else{
          type_view.value = 3
        }
      }
    }
  }
    
  // end type view

  
  const firebaseApp = initializeApp({
    projectId: "spatula-antrian"
  })

  const db = getFirestore(firebaseApp)

  const footer_type = ref('without_footer')

  onSnapshot(doc(db, "konfigurasi", props.satker), (doc) => {
    konfigurasi.value = doc.data()

    while(arr_url_video.length > 0) {
      arr_url_video.pop();
    }

    if('playlist_type' in doc.data()){
      playlist_type.value = doc.data()['playlist_type']['1']
    }else{
      playlist_type.value = 'no_video_and_no_audio'
    }
    if('playlist' in doc.data()){
      for(let key in doc.data()['playlist']){
        arr_url_video.push(doc.data()['playlist'][key])
      }
    }
    if('footer_type' in doc.data()){
      footer_type.value = doc.data()['footer_type']['1']
    }else{
      footer_type.value = 'without_footer'
    }
    
    
    if(url_active_video){
      if(!arr_url_video.includes(url_active_video)){
        url_active_video = arr_url_video[0]
        index_active_video = 0
      }
    }

    if(youtube_video){
      if(url_active_video){
        if(!arr_url_video.includes(url_active_video)){
          youtube_video.value.loadVideoById(getYouTubeID(arr_url_video[0]), 0)
          youtube_video.value.playVideo()
        }
      }
      if(['video_and_audio', 'no_video_and_audio'].includes(playlist_type.value)){
        youtube_video.value.setVolume(80)
      }else{
        youtube_video.value.setVolume(0)
      }
    }
    change_load_type_view()
  });

  onSnapshot(doc(db, "layanan", props.satker), (doc) => {
    layanan = doc.data()
    calculetd_show()
  });

  onSnapshot(doc(db, "antrian", props.satker), (doc) => {
    antrian = doc.data()
    calculetd_show()
  });
</script>

<template>
  <div class="w-full h-full flex flex-col h-screen justify-between bg-gradient-to-r from-primary-500 to-fuchsia-700">
    <div class="px-6">
      <div class="flex flex-row justify-center items-center px-24 pt-5">
        <div class="flex-none">
          <svg version="1.1" viewBox="0 0 1900 300" xmlns="http://www.w3.org/2000/svg" width="350" height="85.698">
            <g transform="matrix(0.71557223,0,0,0.74246749,9.8830573,2.9246831)">
                <path style="fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none"
                    d="m 374.87393,237.91266 -3.99281,2.33441 -3.9928,2.30628 -4.04905,2.30628 -4.10528,2.27816 -4.1334,2.25003 -4.16151,2.2219 -4.18964,2.19378 -4.24587,2.19378 -4.30211,2.13753 -4.30211,2.13753 -4.35834,2.10941 -4.38647,2.08127 -4.41458,2.05316 -4.47082,2.02503 -4.49893,1.9969 -13.21563,5.62508 -13.18751,5.25944 -13.13127,4.8657 -13.0188,4.50006 -12.93445,4.1063 -12.82197,3.71256 -12.68137,3.37504 -12.51267,2.95317 -12.34396,2.61566 -12.14713,2.2219 -11.92219,1.82815 -11.69723,1.46252 -11.44417,1.0969 -11.16299,0.70313 -10.8818,0.3375 -10.54439,-0.0281 -10.23508,-0.39376 -9.869543,-0.78751 -9.504004,-1.18126 -9.110348,-1.51877 -8.71669,-1.91253 -8.266797,-2.27816 -7.816903,-2.64378 -7.36701,-3.03755 -6.888997,-3.37504 -6.354749,-3.7688 -5.848618,-4.13444 -5.314369,-4.50006 -4.723884,-4.86569 -4.161517,-5.25945 -3.5710312,-5.59695 -2.924309,-5.99071 -1.968285,-5.3157 L 1.5183913,253.15662 0.53424877,247.55967 0.02811836,241.82209 0,235.97201 l 0.44989371,-5.99071 0.87166909,-6.07509 1.3496811,-6.15946 1.7995748,-6.27196 2.2213502,-6.35633 2.6431255,-6.41259 3.0649006,-6.46884 3.486676,-6.55322 3.880334,-6.58134 4.27399,-6.58134 4.667647,-6.66572 5.033186,-6.63759 5.426843,-6.66571 5.764263,-6.66572 6.15792,-6.63759 6.467222,-6.66572 6.832761,-6.60947 7.142062,-6.58134 7.479483,-6.52509 7.788785,-6.46884 8.098086,-6.412585 8.407387,-6.356338 8.68857,-6.271962 8.96976,-6.187585 9.27906,-6.075084 9.504,-5.962582 9.78519,-5.850081 -8.51986,5.596952 -8.29492,5.709454 -8.04185,5.765705 -7.78878,5.850081 -7.53572,5.878206 -7.25454,5.934457 -6.97335,5.990712 -6.720287,6.04695 -6.410985,6.04696 -6.15792,6.07509 -5.8205,6.10321 -5.539316,6.1032 -5.201896,6.13134 -4.920713,6.10321 -4.583292,6.07508 -4.245872,6.10321 -3.908451,6.04696 -3.571032,6.01883 -3.233611,5.96259 -2.868072,5.93445 -2.530652,5.87821 -2.136995,5.85008 -1.771457,5.7657 -1.405917,5.68133 -1.012261,5.59695 -0.618604,5.54071 -0.224947,5.4282 0.196829,5.31569 0.590485,5.23133 1.012261,5.11882 1.434036,4.97819 1.855812,4.86569 2.980545,5.93446 3.59915,5.59695 4.245872,5.23132 4.808239,4.83757 5.398724,4.50006 5.932974,4.10631 6.467222,3.74068 7.00147,3.37504 7.479483,3.00942 7.957495,2.64379 8.407389,2.27815 8.857284,1.8844 9.25094,1.51877 9.67271,1.15314 10.03826,0.78752 10.37567,0.42188 10.74121,0.0281 11.05052,-0.3375 11.33169,-0.70314 11.641,-1.09689 11.86595,-1.46252 12.11901,-1.82815 12.34396,-2.19378 12.5689,-2.58753 12.7095,-2.9813 12.87821,-3.31879 13.04692,-3.71255 13.13127,-4.10631 13.27186,-4.47194 13.3281,-4.83756 13.38434,-5.23132 13.44058,-5.59696 2.615,-1.12501 2.58689,-1.15314 2.55877,-1.12502 2.55877,-1.15314 2.55877,-1.15314 2.53066,-1.18127 2.53065,-1.18126 2.50253,-1.18127 2.50254,-1.18127 2.50253,-1.20939 2.47441,-1.20939 2.47442,-1.23752 2.4463,-1.20939 2.44629,-1.23752 2.41818,-1.23751 2.41818,-1.23752 z">
                </path>
                <path style="fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none"
                    d="m 307.53047,117.45162 -19.37355,108.36712 63.18195,-0.14063 0.47801,-0.25312 0.44989,-0.25313 0.39366,-0.16876 0.36554,-0.16875 0.33742,-0.1125 0.28118,-0.0844 0.25307,-0.0563 0.22494,-0.0281 h 0.70296 l 0.42178,0.0281 0.11247,-0.0281 0.0844,-0.0563 0.0844,-0.0563 0.0844,-0.0844 0.19682,-0.28125 0.22495,-0.45001 0.67484,-1.49064 1.09662,-2.53129 22.12914,-105.66708 -0.36553,-1.20939 -0.25307,-0.95627 -0.14059,-0.75938 -0.0844,-0.59064 -0.0562,-0.39375 -0.0281,-0.30938 -0.0281,-0.19688 -0.0562,-0.14063 -0.11247,-0.1125 -0.19683,-0.1125 -0.3093,-0.1125 -0.44989,-0.19688 -0.59049,-0.28125 -0.7592,-0.42188 -0.98414,-0.53439 -1.20909,-0.75938 -73.24832,0.84376 1.12474,-5.82195 1.18097,-5.765709 1.15285,-5.709454 1.18097,-5.653203 1.18097,-5.625077 1.20909,-5.568827 1.20909,-5.568827 1.20909,-5.540701 1.23721,-5.540702 1.23721,-5.512576 1.26532,-5.512576 1.29345,-5.540701 1.29344,-5.512577 1.29345,-5.568826 1.32156,-5.568827 1.34968,-5.596952 -0.28118,-0.140627 -0.11248,-0.168753 0.0562,-0.225003 0.16871,-0.281254 0.3093,-0.337504 0.4499,-0.36563 0.56236,-0.421881 0.70296,-0.450006 0.7592,-0.478132 0.89978,-0.534382 0.95603,-0.562508 1.04038,-0.590633 2.27758,-1.237517 2.53066,-1.321894 2.64312,-1.3781437 2.7556,-1.4343948 2.7556,-1.4343947 2.69936,-1.4343948 2.58689,-1.4062694 2.41818,-1.3781441 1.12473,-0.6468839 1.0685,-0.6468839 0.95603,-0.61875855 L 351.02956,0 l -97.23327,0.7031347 -0.92791,3.6000497 -0.92791,3.6000497 -0.89978,3.6281749 -0.89979,3.60005 -1.74334,7.25635 -1.71522,7.25635 -1.65898,7.25635 -1.65898,7.284476 -1.60275,7.284475 -1.60275,7.284476 -1.57462,7.284475 -1.57463,7.312601 -1.57463,7.312601 -1.57463,7.312601 -1.57463,7.312601 -1.60274,7.340725 -1.63087,7.3126 -1.65898,7.34073 5.03319,-0.0844 5.00506,-0.0563 5.00507,-0.0281 5.00507,-0.0281 h 5.00507 l 5.03318,0.0281 5.00507,0.0281 5.00507,0.0281 5.00506,0.0562 5.00507,0.0563 5.00507,0.0281 5.00507,0.0562 5.00506,0.0281 5.00507,0.0281 5.00507,0.0281 z m 102.74447,60.69459 -0.36554,0.64688 -0.39365,0.67501 -0.39366,0.70314 -0.36554,0.67501 -0.39366,0.70313 -0.36554,0.67501 -0.39365,0.70313 -0.36554,0.70314 5.53931,-5.48445 z m -0.0281,-140.570691 -0.6186,-0.337505 -0.61861,-0.309379 -0.6186,-0.337505 -0.64672,-0.309379 -0.22495,1.293768 z m -261.64131,14.287697 -1.12473,0.337504 0.64672,2.193781 z">
                </path>
                <path style="fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none"
                    d="m 344.61858,15.215835 10.29132,0.646884 9.75707,1.068765 9.25094,1.46252 8.7448,1.884401 8.21056,2.278156 7.70443,2.643787 7.17019,3.009416 6.66405,3.375047 6.10168,3.740676 5.56743,4.078182 5.06131,4.415686 4.49894,4.725065 3.96468,5.06257 3.40232,5.343823 2.86808,5.625078 2.3057,5.934457 1.77146,6.215711 1.20909,6.468839 0.64672,6.721968 0.0844,6.975096 -0.47802,7.200098 -1.04038,7.4251 -1.63086,7.65011 -2.19323,7.84698 -2.78372,8.04386 -3.34608,8.24074 -3.90846,8.43762 -4.52705,8.57824 -5.08942,8.747 -5.70803,8.8595 -6.27039,9.02824 4.27399,-8.49386 3.76786,-8.35324 3.26173,-8.21262 2.78371,-8.01573 2.24947,-7.87511 1.77146,-7.67823 1.26532,-7.48135 0.7592,-7.31261 0.28118,-7.08759 -0.19683,-6.8626 -0.70295,-6.66571 -1.18098,-6.412593 -1.6871,-6.187586 -2.13699,-5.934457 -2.64313,-5.681328 -3.12113,-5.4282 -3.57104,-5.146946 -4.04904,-4.893818 -4.52705,-4.584438 -5.00507,-4.303184 -5.48308,-4.021931 -5.90486,-3.684426 -6.41098,-3.403171 -6.83276,-3.037542 -7.31078,-2.728163 -7.76066,-2.390658 -8.21056,-2.053153 -8.66046,-1.687524 -9.13846,-1.321893 -9.56024,-0.956263 -10.01014,-0.590633 -10.43191,-0.196878 -5.56743,0.05625 -5.65179,0.140627 -5.67991,0.281254 -5.73615,0.36563 -5.8205,0.450006 -5.84861,0.590633 -5.90486,0.646884 -5.93297,0.759385 -6.01733,0.871887 -6.01733,0.956264 -6.07356,1.068764 -6.1298,1.153141 -6.15792,1.237517 -6.18604,1.321894 -6.21416,1.434394 -6.24228,1.518771 -6.27039,1.603148 -6.29851,1.687523 -6.32663,1.771899 -6.35475,1.856276 -6.35475,1.940652 -6.38286,2.025028 -6.41099,2.109404 -6.41099,2.19378 -6.41098,2.278156 -6.41099,2.362533 -6.4391,2.418783 -6.4391,2.50316 -6.43911,2.587536 -6.4391,2.643786 -6.4391,2.728163 -6.41099,2.812539 7.08583,-3.515674 7.14206,-3.431297 7.17018,-3.346921 7.17018,-3.262545 7.17018,-3.150044 7.1983,-3.093793 7.22642,-2.981291 7.1983,-2.868789 7.22642,-2.784414 7.19829,-2.700037 7.1983,-2.587536 7.1983,-2.475034 7.17018,-2.390658 7.17019,-2.250031 7.11394,-2.165655 7.14206,-2.053153 7.08583,-1.940652 7.05771,-1.856276 7.00147,-1.715648 7.00147,-1.603147 6.91711,-1.462521 6.91712,-1.378144 6.83276,-1.237517 6.80464,-1.09689 6.74841,-1.012514 6.66405,-0.843761 6.60781,-0.759386 6.55158,-0.590633 6.49534,-0.478132 6.41098,-0.337504 6.32663,-0.225003 6.24228,-0.05625 z">
                </path>
                <path style="fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none"
                    d="m 200.73695,233.21572 -87.53245,2.92504 -24.266138,116.38285 71.701808,-0.42188 0.98414,-4.16255 1.26533,-5.4282 1.49027,-6.52509 1.71522,-7.39698 1.8277,-8.10011 1.96828,-8.55012 2.02452,-8.8595 2.05264,-8.91575 2.02452,-8.77512 1.94017,-8.46574 1.82769,-7.93136 1.65899,-7.2001 1.46215,-6.24383 1.20909,-5.11882 0.89979,-3.76881 0.56237,-2.25003 76.45381,-0.25313 0.59048,-0.36563 0.59049,-0.3375 0.53425,-0.28125 0.50613,-0.25313 0.47801,-0.19688 0.44989,-0.16875 0.42178,-0.14063 0.39365,-0.1125 1.32157,-0.30938 1.01226,-0.19688 0.19683,-0.0844 0.19683,-0.0844 0.19682,-0.0844 0.16871,-0.1125 0.16871,-0.16875 0.1406,-0.16875 0.16871,-0.22501 0.14059,-0.225 0.14059,-0.30938 0.14059,-0.3375 0.14059,-0.39376 0.14059,-0.42188 0.28119,-1.06876 0.3093,-1.3219 1.20909,-5.7657 1.26533,-5.99071 1.29344,-6.21571 1.32156,-6.38446 1.32157,-6.55322 1.34968,-6.66572 1.34968,-6.75009 1.34968,-6.80634 1.34968,-6.8626 1.32156,-6.80634 1.32157,-6.80635 1.29344,-6.75009 1.29344,-6.66572 1.23721,-6.52509 1.20909,-6.38446 1.15285,-6.21571 -68.60879,-0.70313 -3.73974,15.01895 z">
                </path>
                <path style="fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none"
                    d="m 136.06473,119.81415 -0.0281,2.67192 -0.0844,2.70003 -0.0844,2.78442 -0.11247,2.84066 -0.16871,2.89692 -0.16871,2.92504 -0.19683,2.95316 -0.22495,2.95317 -0.28118,3.00941 -0.28119,2.98129 -0.28118,3.00942 -0.33742,2.98129 -0.36554,2.95317 -0.39366,2.95316 -0.39365,2.89692 -0.4499,2.86879 -0.44989,2.75629 -0.47801,2.78441 -0.50613,2.67191 -0.53425,2.64379 -0.53425,2.50316 -0.59049,2.44691 -0.59048,2.3344 -0.61861,2.22191 -0.64672,2.13753 -0.67484,1.9969 -0.67484,1.85628 -0.70296,1.74377 -0.73108,1.57502 -0.75919,1.4344 -0.7592,1.26564 -1.65898,2.39066 -1.57463,2.16565 -1.57463,1.94065 -1.49027,1.7719 -1.49027,1.5469 -1.43404,1.40627 -1.40592,1.23752 -1.34968,1.09689 -1.32156,0.95626 -1.29344,0.84376 -1.26533,0.70314 -1.20909,0.64688 -1.20909,0.53438 -1.15285,0.45001 -1.12474,0.39375 -1.09661,0.33751 -2.108878,0.56251 -1.968285,0.53438 -0.956024,0.25313 -0.927906,0.28125 -0.899787,0.33751 -0.871669,0.36563 -0.871669,0.42188 -0.815433,0.47813 -0.815432,0.56251 -0.759196,0.67501 -0.787314,0.75938 -0.731077,0.90001 -0.731077,1.01252 -0.702959,1.15314 7.648193,0.0281 7.226413,0.0563 6.83277,0.11251 6.46722,0.14062 6.10168,0.14063 5.76426,0.16875 5.39873,0.16875 5.08942,0.16876 4.752,0.14062 4.47082,0.16876 4.16152,0.1125 3.88033,0.0844 3.62727,0.0563 3.34608,0.0281 3.09302,-0.0281 2.86808,-0.11251 2.67124,-0.14062 2.41818,-0.25313 2.24947,-0.30938 2.02452,-0.39376 1.88393,-0.47813 1.71522,-0.59063 1.54651,-0.70314 1.40592,-0.81563 1.26532,-0.95627 1.18097,-1.06876 1.04038,-1.18127 0.98414,-1.35002 0.87167,-1.51877 0.81544,-1.63127 0.73107,-1.82815 0.70296,-1.9969 0.50613,-1.74378 0.50613,-1.91252 0.53425,-2.10941 0.56237,-2.25003 0.59048,-2.41878 0.59049,-2.53129 0.6186,-2.70003 0.61861,-2.81254 1.26532,-5.93446 1.32157,-6.27196 1.32156,-6.55322 1.32156,-6.75009 1.29345,-6.83447 1.26532,-6.86259 1.20909,-6.80635 1.15285,-6.63759 1.0685,-6.41259 0.98414,-6.07508 0.87167,-5.6532 0.7592,-5.17507 0.22495,-1.57503 0.14059,-1.29376 0.11247,-1.06877 0.0844,-0.84376 v -0.33751 -0.30937 l -0.0281,-0.28126 -0.0281,-0.225 -0.0281,-0.225 -0.0562,-0.19688 -0.0844,-0.14063 -0.0844,-0.14063 -0.11247,-0.14062 -0.11247,-0.1125 -0.14059,-0.11251 -0.1406,-0.1125 -0.36554,-0.25313 -0.39365,-0.25312 -0.47801,-0.36563 -0.56237,-0.42189 -0.28119,-0.28125 -0.33742,-0.30938 -0.33742,-0.3375 -0.33742,-0.39376 -76.5944,-2.13753 L 152.99198,1.0406394 81.740063,0.78751087 58.570537,117.67662 l 5.061304,-0.0281 h 4.976949 l 4.948831,-0.0281 4.920712,-0.0281 4.892594,-0.0281 4.836358,-0.0281 4.836357,-0.0281 4.808239,-0.0562 4.780119,-0.0281 4.78012,-0.0281 4.78012,-0.0563 4.78012,-0.0281 4.75201,-0.0281 h 4.78012 l 4.78012,-0.0281 h 4.80824 z">
                </path>
            </g>
            <text
                style="font-style:normal;font-weight:normal;font-size:87.29743958px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:2.18243599;"
                x="385.56268" y="110.56847">
                <tspan sodipodi:role="line" x="385.56268" y="110.56847"
                    style="font-style:italic;font-variant:normal;font-weight:bold;font-stretch:normal;font-family:sans-serif;-inkscape-font-specification:'sans-serif Bold Italic';fill:#ffffff;stroke-width:2.18243599;">
                    BADAN PUSAT STATISTIK</tspan>
                <tspan sodipodi:role="line" x="390" y="219.69026"
                    style="font-style:italic;font-variant:normal;font-weight:bold;font-stretch:normal;font-family:sans-serif;-inkscape-font-specification:'sans-serif Bold Italic';fill:#ffffff;stroke-width:2.18243599;">
                    {{ nama_satker }}</tspan>
            </text>
          </svg>
        </div>
        <div class="flex-grow"></div>
        <div class="flex-none">
          <svg width="340" height="80" viewBox="0 0 129.5 31.708" xmlns="http://www.w3.org/2000/svg">
            <g fill="#fff"><text x="28.116" y="21.479" font-size="23.523" stroke-width=".98" transform="translate(0 -1.022)">
                    <tspan style="-inkscape-font-specification:'Jost Medium'" x="28.116" y="21.479" font-weight="500" font-family="Jost">
                        SPATULA</tspan>
                </text><text x="28.81" y="27.74" font-size="4.224" stroke-width=".176" transform="translate(0 -1.022)">
                    <tspan style="-inkscape-font-specification:'Jost Medium'" x="28.81" y="27.74" font-weight="500" font-family="Jost">
                        SPATULA Modul Sistem Antrian Online</tspan>
                </text>
                <path
                    d="M12.975 2.322c.461-.02.825.14 1.193.374.466.296.991.881 1.64 1.251.913.521 2.601-.198 3.465 1.087.504.749.528 1.336.566 1.917.04.625.15 1.201.791 2.048 1.062 1.404 1.283 2.338.736 3.31-.372.663-1.157 1.031-1.338 1.453-.387.893.04 1.567-.487 2.61a2.78 2.78 0 01-1.689 1.442c-.636.204-1.274-.092-1.784.123-.896.377-1.555 1.25-2.268 1.472a2.697 2.697 0 01-.823.126 2.697 2.697 0 01-.823-.126c-.713-.221-1.372-1.095-2.268-1.472-.51-.215-1.148.083-1.784-.123a2.78 2.78 0 01-1.69-1.442c-.529-1.043-.101-1.717-.486-2.61-.181-.422-.966-.79-1.338-1.453-.551-.972-.33-1.906.731-3.308.64-.846.751-1.423.792-2.048.038-.58.061-1.168.565-1.917.866-1.285 2.555-.566 3.465-1.087.65-.37 1.175-.955 1.64-1.25.366-.237.732-.398 1.194-.377zm0 5.522l.948 2.319 2.5.185-1.912 1.618.595 2.434-2.131-1.319-2.132 1.319.596-2.434-1.912-1.618 2.499-.185zm9.1 18.527l-2.457-.44-1.22 2.182c-.884 1.096-1.446-.706-1.692-1.333l-2.372-4.474c.547-.19 1.206-.736 1.882-1.35 1.351.027 2.61-.207 3.536-1.385l2.725 5.264.236.507c.187.657.089 1.09-.639 1.03zm-18.202 0l2.459-.44 1.219 2.182c.884 1.096 1.446-.706 1.693-1.333l2.372-4.474c-.547-.19-1.207-.736-1.883-1.35-1.35.027-2.61-.207-3.535-1.385L3.47 24.835l-.236.507c-.187.657-.09 1.09.638 1.03zm9.076-20.626a5.316 5.316 0 110 10.632 5.316 5.316 0 010-10.632z"
                    fill-rule="evenodd" clip-rule="evenodd" />
            </g>
          </svg>
        </div>
      </div>
      <hr class="mt-3 mx-24">
      <div class="text-2xl px-24 text-right text-white pt-2">
        <div class="mr-5">
          {{ date_time_locale }}
        </div>
      </div>
    </div>
    <main class="px-6 flex-grow mt-10">
      <div class="flex justify-center">
        <div class="overflow-x-auto mb-5 px-24">
            <div class="flex flex-row gap-x-8">
              <div class="flex-grow grid gap-4" 
                :class="{ 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4': [0,1].includes(type_view), 'grid-cols-1 md:grid-cols-2': [2,3].includes(type_view) }">
                <template v-for="item_show in show_data">
                  <div class=" shadow-xl drop-shadow-xl bg-glass bg-glass rounded-lg drop-shadow-md px-3 py-1 pb-2">
                      <div class="text-lg font-semibold text-white">Loket {{item_show['loket']}}</div>
                      <template v-if="item_show['active']">
                        <div class="text-8xl font-bold w-full text-center my-1 text-white">{{item_show['loket']}}{{item_show['active']['antrian']}}</div>
                      </template>
                      <template v-else>
                        <div class="text-8xl font-bold w-full text-center my-1 text-white">-</div>
                      </template>

                      <div class="w-full flex flex-col justify-center px-3 py-2">
                          <template v-if="item_show['active']">
                              <p class="w-full text-center text-lg text-stone-200">{{item_show['active']['konsumen_nama']}}</p>
                          </template>
                      </div>
                      <div class="bg-glass rounded-lg p-2">  
                        <div class="text-lg leading-tight text-justify pb-2 text-white">
                            <div>{{$gabung_list(item_show['layanan'])}}</div>
                        </div>
                          <hr class="border-white">
                          <p class="text-sm leading-tight text-justify my-1.5 mt-2 text-lg text-white">Daftar Antrian:</p>
                          <table class="w-full text-sm bg-white">
                              <thead>
                                  <tr class="bg-neutral-100 text-left font-bold text-md">
                                      <th class="px-1 py-2 text-center border border-1 border-slate-500 text-stone-700">No</th>
                                      <th class="px-1 py-2 border border-1 border-slate-500 text-stone-700">Konsumen</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <template v-if="[0,2].includes(type_view)">
                                    <template v-for="(item_antrian, index) in item_show['daftar']">
                                        <tr>
                                          <td class="px-1 py-2 border border-1 border-slate-500 text-stone-700 text-md text-center">{{item_show['loket']}}{{item_antrian['antrian']}}</td>
                                          <td class="px-1 py-2 border border-1 border-slate-500 text-stone-700 text-md">{{item_antrian['konsumen_nama']}}</td>
                                        </tr>
                                    </template>
                                  </template>
                                  <template v-if="[1,3].includes(type_view)">
                                    <template v-for="(item_antrian, index) in item_show['daftar']">
                                      <template v-if="index < 1">
                                        <tr>
                                          <td class="px-1 py-2 border border-1 border-slate-500 text-stone-700 text-md text-center">{{item_show['loket']}}{{item_antrian['antrian']}}</td>
                                          <td class="px-1 py-2 border border-1 border-slate-500 text-stone-700 text-md">{{item_antrian['konsumen_nama']}}</td>
                                        </tr>
                                      </template>
                                    </template>
                                  </template>
                                  
                              </tbody>
                          </table>
                      </div>
                  </div>
                </template>
              </div>
              <div class="flex justify-center" 
                :class="{ 'w-1/2': [2,3].includes(type_view) }">
                <YouTube 
                  v-show="['video_and_audio', 'video_and_no_audio'].includes(playlist_type)"
                  src="" 
                    @ready="onReady_youtube"
                    @stateChange ="onStateChange_youtube"
                    ref="youtube_video" />
              </div>
             
            </div>
            
        </div>
      </div>
     
      <audio ref="audio_sound" @ended='ended_audio' v-show="false"></audio>
    </main>
    <div v-if="footer_type == 'with_footer'" class="bg-white px-2 text-gray-800 font-medium text-md">
      <marquee class="text-md pt-1">
        <span v-html="konfigurasi['footer'][1]"></span>
      </marquee>
    </div>
  </div>
</template>
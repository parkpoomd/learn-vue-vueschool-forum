import Vue from 'vue'
import firebase from 'firebase/app'
import App from './App.vue'
import router from './router'
import store from '@/store'
import AppDate from '@/components/AppDate'

Vue.component('AppDate', AppDate)

Vue.config.productionTip = false

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAWSyxvPnLfQFsuXUN7Fp--KqAPzafFtCQ',
  authDomain: 'vue-school-forum-dad74.firebaseapp.com',
  projectId: 'vue-school-forum-dad74',
  storageBucket: 'vue-school-forum-dad74.appspot.com',
  messagingSenderId: '26554000990',
  appId: '1:26554000990:web:3de058bb3586672539f6cf',
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig)

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')

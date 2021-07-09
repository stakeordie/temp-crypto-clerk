import { createApp } from 'vue'
import App from './App.vue'

import api from './classes/api';

api.init().then(() => {
  createApp(App).mount('#app')
});



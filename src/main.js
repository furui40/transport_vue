import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import ElementPlus from 'element-plus';
// import Echarts from 'echarts'
import 'element-plus/dist/index.css';

const app = createApp(App);

app.use(store);
app.use(router);
app.use(ElementPlus);
// app.use(Echarts);

store.dispatch('user/initializeStore');

app.mount('#app');
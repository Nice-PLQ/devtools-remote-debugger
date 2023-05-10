import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import { ElTable, ElTableColumn, ElButton, ElSwitch,ElAlert } from 'element-plus';
import 'element-plus/dist/index.css'
import Index from './components/index.vue';
import Usage from './components/usage.vue';
import App from './App.vue';
import messages from './messages';

const routes = [{
  name: 'index',
  path: '/index',
  component: Index
},
{
  name: 'usage',
  path: '/usage',
  component: Usage
}, {
  path: '/:pathMatch(.*)*',
  component: Index
}];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const i18n = createI18n({
  locale: 'en',
  messages,
});

createApp(App)
  .use(router)
  .use(i18n)
  .use(ElTable)
  .use(ElTableColumn)
  .use(ElButton)
  .use(ElSwitch)
  .use(ElAlert)
  .mount('#app');

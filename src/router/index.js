import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';  // 导入 store

const Welcome = () => import('../views/Welcome.vue');
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Home = () => import('../views/Home.vue');
const AdminDataManagement = () => import('../views/AdminDataManagement.vue');
const BaseInformation = () => import('../views/search/BaseInformation.vue');
const HighSensorSearch = () => import('../views/search/HighSensorSearch.vue');
const DynamicWeighingSearch = () => import('../views/search/DynamicWeighingSearch.vue');
const WeatherSearch = () => import('../views/search/WeatherSearch.vue');
const ComprehensiveSearch = () => import('../views/search/ComprehensiveSearch.vue');
const UserDownloadManage = () => import('../views/download/UserDownloadManage.vue');
const HistoryApply = () => import('../views/download/HistoryApply.vue');
const NewApply = () => import('../views/download/NewApply.vue');
const AdminDownloadManage = () => import('../views/admin/AdminDownloadManage.vue');
const DataVisualize = () => import('../views/visualize/DataVisualize.vue');
const UserConfig = () => import('../views/config/UserConfig.vue');
const ModifyAvatar = () => import('../views/config/ModifyAvatar.vue');
const ModifyPassword = () => import('../views/config/ModifyPassword.vue');

const routes = [
  { path: '/', component: Welcome },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/home', component: Home, meta: { requiresAuth: true } }, // 需要登录
  { path: '/admin', component: AdminDataManagement, meta: { requiresAuth: true, requiresAdmin: true } }, // 需要管理员权限
  { path: '/search/baseinformation', component: BaseInformation, meta: { requiresAuth: true } }, // 需要登录
  { path: '/search/highsensor', component: HighSensorSearch, meta: { requiresAuth: true } }, // 需要登录
  { path: '/search/dynamicweighing', component: DynamicWeighingSearch, meta: { requiresAuth: true, requiresGuest: true } }, // 游客可用
  { path: '/search/weather', component: WeatherSearch, meta: { requiresAuth: true, requiresGuest: true } }, // 游客可用
  { path: '/search/comprehensive', component: ComprehensiveSearch, meta: { requiresAuth: true } }, // 需要登录
  { path: '/download/userdownloadmanage', component: UserDownloadManage, meta: { requiresAuth: true } }, // 需要登录
  { path: '/download/historyapply', component: HistoryApply, meta: { requiresAuth: true } }, // 需要登录
  { path: '/download/newapply', component: NewApply, meta: { requiresAuth: true } }, // 需要登录
  { path: '/admin/admindownloadmanage', component: AdminDownloadManage, meta: { requiresAuth: true, requiresAdmin: true } }, // 需要管理员权限
  { path: '/visualize/datavisualize', component: DataVisualize, meta: { requiresAuth: true } }, // 需要登录
  { path: '/userconfig', component: UserConfig, meta: { requiresAuth: true } }, // 需要登录
  { path: '/config/avatar', component: ModifyAvatar, meta: { requiresAuth: true } }, // 需要登录
  { path: '/config/password', component: ModifyPassword, meta: { requiresAuth: true } }, // 需要登录
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const isLoggedIn = store.getters['user/isLoggedIn'];
  const userRole = store.getters['user/userRole'];

  // 检查登录状态是否过期
  const isExpired = await store.dispatch('user/checkLoginTimeout');
  if (isExpired) {
    next('/login'); // 如果登录状态过期，跳转到登录页
    return;
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 如果需要登录但未登录，跳转到登录页
    next('/login');
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    // 如果需要管理员权限但用户不是管理员，跳转到首页
    next('/');
  } else if (to.meta.requiresGuest && userRole !== 'guest' && userRole !== 'normal' && userRole !== 'admin') {
    // 如果路由需要游客权限但用户不是游客、普通用户或管理员，跳转到首页
    next('/');
  } else {
    // 其他情况正常跳转
    next();
  }
});

export default router;
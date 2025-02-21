import { createRouter, createWebHistory } from 'vue-router';
import { useStore } from 'vuex';  // 导入 useStore（需要在 Vue 3 中使用）

// 使用懒加载，只有欢迎页不懒加载
const Welcome = () => import('../views/Welcome.vue');
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Home = () => import('../views/Home.vue');
const AdminDataManagement = () => import('../views/AdminDataManagement.vue');

const routes = [
  { path: '/', component: Welcome },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/home', component: Home },
  { path: '/admin', component: AdminDataManagement, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 使用 beforeEach 进行路由守卫
router.beforeEach((to, from, next) => {
  const store = useStore();  // 在这里使用 useStore 来访问 Vuex store
  const isAuthenticated = store.state.user.isLoggedIn;

  // 防止在 / 路由中产生无限重定向
  if (to.path === '/') {
    next(); // 首页访问不做重定向，正常渲染 Welcome 页面
  } else if (to.meta.requiresAdmin && store.state.user.role !== 'admin') {
    next('/'); // 如果需要管理员权限但是不是管理员，跳转到首页
  } else if (!isAuthenticated && to.path !== '/login' && to.path !== '/register') {
    next('/'); // 如果未登录且不是登录或注册页面，跳转到首页
  } else {
    next(); // 其他情况继续
  }
});

export default router;

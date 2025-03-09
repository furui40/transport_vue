<template>
  <el-container class="app-container">
    <!-- 上方导航栏 -->
    <el-header class="navbar-container">
      <TopNavbar />
    </el-header>

    <el-container class="main-container">
      <!-- 左侧菜单栏（仅在用户登录时显示） -->
      <el-aside v-if="isUserLoggedIn" width="200px" class="sidebar-container">
        <Sidebar />
      </el-aside>

      <!-- 主内容区域 -->
      <el-main :class="{'content-container-full': !isUserLoggedIn, 'content-container': isUserLoggedIn}">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import TopNavbar from './components/TopNavbar.vue';
import Sidebar from './components/Sidebar.vue';
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'App',
  components: {
    TopNavbar,
    Sidebar
  },
  setup() {
    const store = useStore();
    const isUserLoggedIn = computed(() => store.state.user.isLoggedIn);

    return {
      isUserLoggedIn
    };
  }
}
</script>

<style>
/* 全局样式重置 */
body, html {
  margin: 0;
  padding: 0;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 上方导航栏 */
.navbar-container {
  flex-shrink: 0; /* 防止上方导航栏压缩 */
  padding: 0 !important; 
  margin: 0 !important; 
}

.main-container {
  display: flex;
  flex: 1;
}

/* 左侧菜单栏 */
.sidebar-container {
  flex-shrink: 0; /* 防止左侧菜单栏压缩 */
  padding: 0 !important; 
  margin: 0 !important; 
}

/* 主内容区域（用户登录时） */
.content-container {
  flex: 1;
  padding: 0 !important; 
  margin: 0 !important; 
}

/* 主内容区域（用户未登录时，占据整个宽度） */
.content-container-full {
  flex: 1;
  padding: 0 !important; 
  margin: 0 !important; 
  width: 100%; 
}
</style>
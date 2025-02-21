<template>
  <el-container>
    <!-- 上方导航栏 -->
    <el-header class="navbar">
      <div class="logo">道路检测数据平台</div>
      <el-menu :default-active="activeMenu" mode="horizontal" class="menu">
        <!-- 登录/注册按钮，未登录时显示 -->
        <el-menu-item v-if="!isUserLoggedIn" index="/login">
          <router-link to="/login">登录/注册</router-link>
        </el-menu-item>
        
        <!-- 退出按钮，登录时显示 -->
        <el-menu-item v-if="isUserLoggedIn" index="logout" @click="logout">
          退出登录
        </el-menu-item>
      </el-menu>
    </el-header>

    <!-- 左侧菜单栏 -->
    <el-aside width="200px" class="left-menu" v-if="isUserLoggedIn">
      <el-menu :default-active="activeMenu" class="menu" mode="vertical">
        <!-- 主页 -->
        <el-menu-item index="/home">
          <router-link to="/home">主页</router-link>
        </el-menu-item>

        <!-- 管理员页面，只有管理员角色才显示 -->
        <el-menu-item v-if="isAdmin" index="/admin">
          <router-link to="/admin">管理员</router-link>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Navbar',
  computed: {
    isUserLoggedIn() {
      return this.$store.state.user.isLoggedIn;
    },
    isAdmin() {
      return this.$store.state.user.role === 'admin';
    },
    activeMenu() {
      return this.$route.path;
    }
  },
  methods: {
    logout() {
      // 清除用户信息
      this.$store.dispatch('user/logout');
      // 跳转到欢迎页
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
/* 设置导航栏的背景色和内边距 */
.navbar {
  background-color: #409eff; /* 蓝色背景 */
  padding: 0 20px;
  display: flex;
  justify-content: space-between; /* 左右分布，logo在左，菜单在右 */
  align-items: center;
}

/* 设置logo的样式，logo固定在左上角 */
.logo {
  font-size: 24px;
  color: #fff;
  font-weight: bold;
  padding: 10px;
}

/* 设置菜单样式 */
.menu {
  line-height: 60px;
  background-color: transparent; /* 去除菜单的背景 */
  display: flex;
  align-items: center;
}

/* 菜单项高亮效果 */
.menu .el-menu-item {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  padding: 0 20px;
}

/* 高亮菜单项 */
.menu .el-menu-item.is-active {
  background-color: #3384d7; /* 高亮时背景颜色 */
  color: #fff;
}

/* 鼠标悬浮效果 */
.menu .el-menu-item:hover {
  background-color: #3384d7;
  color: #fff;
}

/* 左侧菜单栏样式 */
.left-menu {
  background-color: #f4f4f4;
  padding: 20px;
}

/* 设置左侧菜单项 */
.left-menu .el-menu-item {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

/* 菜单项之间的间距 */
.menu .el-menu-item + .el-menu-item {
  margin-left: 15px;
}
</style>

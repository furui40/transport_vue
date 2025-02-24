<template>
  <el-aside width="200px" class="left-menu" v-if="isUserLoggedIn">
    <el-menu
      default-active="1"
      class="el-menu-vertical-demo"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      @open="handleOpen"
      @close="handleClose"
      mode="vertical"
    >
      <!-- 主页 -->
      <el-menu-item index="/home" @click="goToHome">
        <el-icon><location /></el-icon>
        <span>主页</span>
      </el-menu-item>

      <!-- 管理员页面，只有管理员角色才显示 -->
      <el-menu-item v-if="isAdmin" index="/admin">
        <el-icon><setting /></el-icon>
        <span>管理员</span>
      </el-menu-item>

      <!-- 其他自定义菜单项 -->
      <el-sub-menu index="1">
        <template #title>
          <el-icon><location /></el-icon>
          <span class="menu-item-text">查询功能</span>
        </template>
        <el-menu-item-group title="传感器基本信息">
          <el-menu-item index="1-1">传感器基本信息查询</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="数据库查询">
          <el-menu-item index="1-2" @click="goToHighSensorSearch">高频传感器数据查询</el-menu-item>
          <el-menu-item index="1-3">动态称重数据查询</el-menu-item>
        </el-menu-item-group>
        <el-sub-menu index="1-4">
          <template #title>其他数据查询</template>
          <el-menu-item index="1-4-1">气象数据查询</el-menu-item>
        </el-sub-menu>
      </el-sub-menu>

      <el-menu-item index="2">
        <el-icon><Menu /></el-icon>
        <span>数据分析</span>
      </el-menu-item>

      <el-menu-item index="3">
        <el-icon><Document /></el-icon>
        <span>下载管理</span>
      </el-menu-item>

      <el-menu-item index="4">
        <el-icon><setting /></el-icon>
        <span>用户设置</span>
      </el-menu-item>

    </el-menu>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Document, Menu, Location, Setting } from '@element-plus/icons-vue';

// 使用 Vuex 和 Router
const store = useStore();
const router = useRouter();

// 计算属性：是否登录
const isUserLoggedIn = computed(() => store.state.user.isLoggedIn);

// 计算属性：是否是管理员
const isAdmin = computed(() => store.state.user.role === 'admin');

// 跳转到主页
const goToHome = () => {
  router.push('/home'); // 跳转到主页
};

const goToHighSensorSearch = () => {
  router.push('/search/highsensor'); // 跳转到高频传感器数据查询
};

// 菜单展开事件
const handleOpen = (key, keyPath) => {
  console.log('Open: ', key, keyPath);
};

// 菜单关闭事件
const handleClose = (key, keyPath) => {
  console.log('Close: ', key, keyPath);
};
</script>

<style scoped>
.left-menu {
  background-color: #545c64;
  padding: 0;
  height: 100vh;
  border-right: 1px solid #ddd;
  position: sticky; /* 使导航栏在滚动时跟随 */
  top: 0; /* 固定在顶部 */
}

.el-menu-vertical-demo {
  margin: 0;
  border-right: none;
}

.el-menu-item {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.el-sub-menu .el-menu-item {
  color: #fff;
}

.el-menu-item-group__title {
  color: #fff;
}

.el-sub-menu__title {
  color: #fff;
}

.menu-item-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
</style>
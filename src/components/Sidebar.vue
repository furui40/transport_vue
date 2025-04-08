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
        <el-icon><House /></el-icon>
        <span>主页</span>
      </el-menu-item>

      <!-- 管理员页面，只有管理员角色才显示 -->
      <el-menu-item v-if="isAdmin" index="/admindownload" @click="goToAdminDownloadManage">
        <el-icon><Stamp /></el-icon>
        <span>用户下载审核</span>
      </el-menu-item>

      <el-menu-item v-if="isAdmin" index="/admindata" @click="goToAdminDataManage">
        <el-icon><Stamp /></el-icon>
        <span>数据库数据更新</span>
      </el-menu-item>

      <el-menu-item v-if="isAdmin" index="/adminhistory" @click="goToUploadHistory">
        <el-icon><List /></el-icon>
        <span>数据库更新记录</span>
      </el-menu-item>

      <el-menu-item v-if="!isGuest" index="/sensorinfo" @click="goToBaseInformation">
        <el-icon><location /></el-icon>
        <span>传感器基本信息</span>
      </el-menu-item>

      <!-- 查询功能 -->
      <el-sub-menu index="1">
        <template #title>
          <el-icon><Search /></el-icon>
          <span class="menu-item-text">数据查询</span>
        </template>
        <el-menu-item-group title="游客功能" v-if="isGuest">
          <el-menu-item index="1-2" @click="goToDynamicWeighingSearch">动态称重数据查询</el-menu-item>
          <el-menu-item index="1-3" @click="goToWeatherSearch">气象数据查询</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="数据查询" v-if="!isGuest">
          <el-menu-item index="1-4-1" @click="goToHighSensorSearch">高频传感器查询</el-menu-item>
          <el-menu-item index="1-4-2" @click="goToComprehensiveSearch">综合数据查询</el-menu-item>
        </el-menu-item-group>
      </el-sub-menu>

      <!-- 数据分析 -->
      <el-menu-item index="2" v-if="!isGuest" @click="goToDataVisualize">
        <el-icon><Menu /></el-icon>
        <span>数据可视化</span>
      </el-menu-item>

      <!-- 下载管理 -->
      <el-menu-item index="3" v-if="(!isGuest) && (!isAdmin)" @click="goToUserDownloadManage">
        <el-icon><Document /></el-icon>
        <span>下载管理</span>
      </el-menu-item>

      <!-- 用户设置 -->
      <el-menu-item index="4" v-if="!isGuest" @click="goToUserConfig">
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
import { Search,House,Document, Menu, Location, Setting,Stamp,List } from '@element-plus/icons-vue';

// 使用 Vuex 和 Router
const store = useStore();
const router = useRouter();

// 计算属性：是否登录
const isUserLoggedIn = computed(() => store.state.user.isLoggedIn);

// 计算属性：是否是管理员
const isAdmin = computed(() => store.state.user.role === 'admin');

// 计算属性：是否是游客
const isGuest = computed(() => store.state.user.role === 'guest');

// 跳转到主页
const goToHome = () => {
  router.push('/home'); // 跳转到主页
};


const goToBaseInformation = () => {
  router.push('/search/baseinformation'); // 跳转到高频传感器数据查询
};

const goToHighSensorSearch = () => {
  router.push('/search/highsensor'); // 跳转到高频传感器数据查询
};

const goToDynamicWeighingSearch = () => {
  router.push('/search/dynamicweighing'); // 跳转到动态称重数据查询
};

const goToWeatherSearch = () => {
  router.push('/search/weather'); // 跳转到气象数据查询
};

const goToComprehensiveSearch = () => {
  router.push('/search/comprehensive'); // 跳转到综合数据查询
};

const goToUserDownloadManage = () => {
  router.push('/download/userdownloadmanage'); // 跳转到用户下载管理查询
};

const goToAdminDownloadManage = () => {
  router.push('/admin/admindownloadmanage'); // 跳转到管理员下载管理
};

const goToAdminDataManage = () => {
  router.push('/admin/admindatamanage'); // 跳转到管理员数据库管理
};

const goToUploadHistory = () => {
  router.push('/admin/uploadhistory'); // 跳转到管理员上传历史记录
};

const goToDataVisualize = () => {
  router.push('/visualize'); // 跳转到用户下载管理查询
};

const goToUserConfig = () => {
  router.push('/userconfig'); // 跳转到用户设置
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
  height: 90vh;
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
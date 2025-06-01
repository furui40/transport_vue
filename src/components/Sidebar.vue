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
      <!-- 主页 - 所有用户可见 -->
      <el-menu-item index="/home" @click="goToHome">
        <el-icon><HomeFilled /></el-icon>
        <span class="menu-title">主页</span>
      </el-menu-item>

      <!-- 管理员专属菜单 -->
      <el-sub-menu v-if="isAdmin" index="admin">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span class="menu-title">管理员功能</span>
        </template>
        <el-menu-item index="/admindownload" @click="goToAdminDownloadManage">
          <el-icon><Document /></el-icon>
          <span>用户下载审核</span>
        </el-menu-item>
        <el-menu-item index="/admindata" @click="goToAdminDataManage">
          <el-icon><DataBoard /></el-icon>
          <span>数据库数据更新</span>
        </el-menu-item>
        <el-menu-item index="/adminhistory" @click="goToUploadHistory">
          <el-icon><Collection /></el-icon>
          <span>数据库更新记录</span>
        </el-menu-item>
        <el-menu-item index="/adminuploadfile" @click="goToUploadFile">
          <el-icon><Upload /></el-icon>
          <span>上传其他文件</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 普通用户功能 -->
      <template v-if="!isGuest">
        <!-- 传感器信息 -->
        <el-menu-item index="/sensorinfo" @click="goToBaseInformation">
          <el-icon><Cpu /></el-icon>
          <span class="menu-title">传感器信息</span>
        </el-menu-item>

        <!-- 数据查询 -->
        <el-sub-menu index="query">
          <template #title>
            <el-icon><Search /></el-icon>
            <span class="menu-title">数据查询</span>
          </template>
          <el-menu-item index="high-sensor" @click="goToHighSensorSearch">
            <el-icon><Odometer /></el-icon>
            <span>高频传感器查询</span>
          </el-menu-item>
          <el-menu-item index="comprehensive" @click="goToComprehensiveSearch">
            <el-icon><PieChart /></el-icon>
            <span>综合数据查询</span>
          </el-menu-item>
          <el-menu-item index="comprehensivepro" @click="goToComprehensiveSearchPro">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据查询与对比</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 数据下载 -->
        <el-sub-menu index="download">
          <template #title>
            <el-icon><Download /></el-icon>
            <span class="menu-title">数据下载</span>
          </template>
          <el-menu-item v-if="!isAdmin" index="user-download" @click="goToUserDownloadManage">
            <el-icon><DocumentChecked /></el-icon>
            <span>高频传感器下载管理</span>
          </el-menu-item>
          <el-menu-item index="multi-download" @click="goToMultiDataDownload">
            <el-icon><Folder /></el-icon>
            <span>传感器数据下载</span>
          </el-menu-item>
          <el-menu-item index="file-download" @click="goToFileDownload">
            <el-icon><Files /></el-icon>
            <span>其他下载</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 用户设置 -->
        <el-menu-item index="config" @click="goToUserConfig">
          <el-icon><User /></el-icon>
          <span class="menu-title">用户设置</span>
        </el-menu-item>
      </template>

      <!-- 游客功能 -->
      <template v-if="isGuest">
        <el-sub-menu index="guest-query">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span class="menu-title">数据查询</span>
          </template>
          <el-menu-item index="dynamic-weighing" @click="goToDynamicWeighingSearch">
            <el-icon><Odometer /></el-icon>
            <span>动态称重数据查询</span>
          </el-menu-item>
          <el-menu-item index="weather" @click="goToWeatherSearch">
            <el-icon><Sunny /></el-icon>
            <span>气象数据查询</span>
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import {
  HomeFilled,
  Setting,
  Document,
  DataBoard,
  Collection,
  Upload,
  Cpu,
  Search,
  Odometer,
  PieChart,
  DataAnalysis,
  Download,
  DocumentChecked,
  Folder,
  Files,
  User,
  Sunny
} from '@element-plus/icons-vue';

  // 使用 Vuex 和 Router
  const store = useStore();
  const router = useRouter();

  // 计算属性：是否登录
  const isUserLoggedIn = computed(() => store.state.user.isLoggedIn);

  // 计算属性：是否是管理员
  const isAdmin = computed(() => store.state.user.role === 'admin');

  // 计算属性：是否是游客
  const isGuest = computed(() => store.state.user.role === 'guest');

  // 跳转方法保持不变...
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

  const goToComprehensiveSearchPro = () => {
    router.push('/search/comprehensivepro'); // 跳转到综合数据查询对比
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
  
  const goToUploadFile = () => {
    router.push('/admin/adminuploadfile'); // 跳转到管理员上传文件
  };

  const goToUploadHistory = () => {
    router.push('/admin/uploadhistory'); // 跳转到管理员上传历史记录
  };

  const goToMultiDataDownload = () => {
    router.push('/download/multidownload'); // 跳转到多种数据下载
  };

  const goToFileDownload = () => {
    router.push('/download/filedownload'); // 跳转到其他数据表下载
  };

  const goToUserConfig = () => {
    router.push('/userconfig'); // 跳转到用户设置
  };

  // 菜单展开事件
  const handleOpen = (key, keyPath) => {
    // console.log('Open: ', key, keyPath);
  };

  // 菜单关闭事件
  const handleClose = (key, keyPath) => {
    // console.log('Close: ', key, keyPath);
  };
</script>

<style scoped>
.left-menu {
  background-color: #545c64;
  padding: 0;
  height: 90vh;
  border-right: 1px solid #ddd;
  position: sticky;
  top: 0;
}

.el-menu-vertical-demo {
  margin: 0;
  border-right: none;
}

.menu-title {
  font-size: 16px;
  font-weight: 600;
  margin-left: 8px;
}

.el-menu-item {
  font-size: 14px;
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

.el-menu-item.is-active {
  color: #ffd04b !important;
}

.el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
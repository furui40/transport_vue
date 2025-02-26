<template>
  <el-container class="download-management">
    <!-- 上半部分：功能按钮 -->
    <el-header class="button-container">
      <el-button type="primary" @click="currentView = 'HistoryApply'">历史申请</el-button>
      <el-button type="primary" @click="currentView = 'NewApply'">新增申请</el-button>
    </el-header>

    <!-- 下半部分：动态内容区域 -->
    <el-main>
      <HistoryApply v-if="currentView === 'HistoryApply'" />
      <NewApply v-if="currentView === 'NewApply'" />
    </el-main>
  </el-container>
</template>

<script>
import HistoryApply from './HistoryApply.vue';
import NewApply from './NewApply.vue';

export default {
  components: {
    HistoryApply,
    NewApply,
  },
  data() {
    return {
      currentView: 'HistoryApply', // 默认显示历史申请页面
    };
  },
};
</script>

<style scoped>
.download-management {
  height: 100vh; /* 使容器占满整个视口高度 */
  display: flex;
  flex-direction: column;
}

.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px; /* 按钮之间的间距 */
  background-color: #f5f5f5; /* 背景色 */
  padding: 20px;
  border-bottom: 1px solid #ddd; /* 底部边框 */
}

.el-main {
  padding: 20px;
  background-color: #fff; /* 内容区域背景色 */
}
</style>
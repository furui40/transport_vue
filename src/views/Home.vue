<template>
  <div class="home-container">
    <h1>主页</h1>
    <div v-if="role === 'guest'">
      <p>您的身份是游客，可试用动态称重数据查询和气象数据查询功能。</p>
    </div>
    <div v-else-if="role === 'normal'">
      <p>欢迎，{{ username }}！点击左侧导航栏进行数据查询、下载、分析吧！</p>
      <el-button type="warning" @click="becomeAdmin">获取管理员权限（测试用）</el-button>
    </div>
    <div v-else-if="role === 'admin'">
      <p>您的身份是管理员。</p>
      <el-button type="primary" @click="switchToNormalUser">切换为普通用户</el-button>
    </div>
    <p v-if="userId">您的用户ID是：{{ userId }}</p>
  </div>
</template>

<script>
import { useStore } from 'vuex';

export default {
  name: 'Home',
  setup() {
    const store = useStore();
    const username = store.state.user.userInfo;
    const userId = store.state.user.userId; // 获取 userId
    const role = store.state.user.role;

    // 点击按钮后更新用户角色为管理员
    const becomeAdmin = () => {
      store.dispatch('user/setRole', 'admin');
      alert('您已获得管理员权限（测试用）');
    };

    // 切换回普通用户
    const switchToNormalUser = () => {
      store.dispatch('user/setRole', 'normal');
      alert('您已切换为普通用户');
    };

    return { username, userId, role, becomeAdmin, switchToNormalUser };
  }
}
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 50px;
}

h1 {
  font-size: 2em;
  color: #409eff;
}

p {
  font-size: 1.2em;
  margin-top: 20px;
}

.el-button {
  margin-top: 20px;
}
</style>
<template>
  <div class="home-container">
    <h1>主页</h1>
    <div v-if="role === 'guest'">
      <p>您的身份是游客，可试用动态称重数据查询和气象数据查询功能。</p>
    </div>
    <div v-else-if="role === 'normal'">
      <p>欢迎，{{ username }}！点击左侧导航栏进行数据查询、下载、分析吧！</p>
    </div>
    <div v-else-if="role === 'admin'">
      <p>您的身份是管理员。</p>
    </div>
    <p v-if="userId">你的用户ID是：{{ userId }}</p>
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

    return { username, userId, role };
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
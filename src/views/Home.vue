<template>
  <div class="home-container">
    <h1>主页</h1>
    <p>欢迎，{{ username }}！你的用户ID是：{{ userId }}，你是{{ role }}。</p>
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

.el-button {
  margin-top: 20px;
}
</style>

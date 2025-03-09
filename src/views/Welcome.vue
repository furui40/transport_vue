<template>
  <div class="welcome-container">
    <h1>欢迎来到道路监测数据查询平台</h1>
    <p v-if="!isUserLoggedIn">请登录以访问更多功能。</p>

    <!-- 只有当用户未登录时显示按钮 -->
    <el-button v-if="!isUserLoggedIn" type="primary" @click="goToLogin">登录</el-button>
    <el-button v-if="!isUserLoggedIn" type="success" @click="goToLogin">注册</el-button>
    <el-button v-if="!isUserLoggedIn" type="info" @click="goToGuest">游客浏览</el-button>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Welcome',
  setup() {
    const router = useRouter();
    const store = useStore();

    // 计算属性，检查用户是否已登录
    const isUserLoggedIn = computed(() => store.state.user.isLoggedIn);

    const goToLogin = () => {
      router.push('/login'); // 跳转到登录页面
    };

    const goToGuest = () => {
      // 设置用户为游客
      store.dispatch('user/login', {
        username: '游客',
        userId: '0', // 游客没有用户 ID
        role: 'guest',
      });
      router.push('/home'); // 跳转到首页
    };

    return { isUserLoggedIn, goToLogin, goToGuest };
  }
}
</script>

<style scoped>
.welcome-container {
  text-align: center;
  margin: 0; 
  padding: 0; 
  background-image: url('@/assets/welcome-background.png');
  background-size: cover; 
  background-position: center; 
  height: 100vh; 
  color: white; 
}

h1 {
  font-size: 2.5em;
  color: #409eff;
  margin-top: 0px;
}

p {
  font-size: 1.2em;
  color: black;
  margin-top: 10px;
}

.el-button {
  margin-top: 20px;
  margin-right: 10px;
}
</style>
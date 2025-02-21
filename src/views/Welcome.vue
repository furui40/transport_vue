<template>
  <div class="welcome-container">
    <h1>欢迎来到道路检测数据查询平台</h1>
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

    const goToRegister = () => {
      router.push('/register'); // 跳转到注册页面
    };

    const goToGuest = () => {
      router.push('/register'); // 未来完善游客浏览功能后再调整
    };

    return { isUserLoggedIn, goToLogin, goToRegister, goToGuest };
  }
}
</script>

<style scoped>
.welcome-container {
  text-align: center;
  margin: 0; /* 去除默认 margin */
  padding: 0; /* 去除默认 padding */
  background-image: url('@/assets/welcome-background.png');
  background-size: cover; /* 保证背景覆盖整个容器 */
  background-position: center; /* 背景图片居中 */
  height: 100vh; /* 使背景图片充满整个屏幕 */
  color: white; /* 设置字体颜色为白色 */
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

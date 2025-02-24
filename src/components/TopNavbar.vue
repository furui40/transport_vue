<template>
  <div class="navbar">
    <!-- 点击 logo 跳转到欢迎页 -->
    <div class="logo" @click="goToWelcome">道路检测数据平台</div>

    <div class="right-container">
      <!-- 显示用户名（登录时显示） -->
      <span v-if="isUserLoggedIn" class="welcome-message">
        用户：{{ username }}，欢迎使用道路检测数据平台
      </span>

      <!-- 登录/注册按钮，未登录时显示 -->
      <el-button
        v-if="!isUserLoggedIn"
        type="primary"
        @click="goToLogin"
      >
        登录/注册
      </el-button>

      <!-- 退出按钮，登录时显示 -->
      <el-button
        v-if="isUserLoggedIn"
        type="danger"
        @click="logout"
      >
        退出登录
      </el-button>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'TopNavbar',
  setup() {
    const store = useStore();
    const router = useRouter();

    // 计算属性：是否登录
    const isUserLoggedIn = computed(() => store.state.user.isLoggedIn);

    // 计算属性：用户名
    const username = computed(() => store.state.user.userInfo);

    // 退出登录
    const logout = () => {
      store.dispatch('user/logout'); // 清除用户信息
      router.push('/'); // 跳转到欢迎页
      ElMessage.success('已退出登录');
    };

    // 跳转到登录页
    const goToLogin = () => {
      router.push('/login');
    };

    // 跳转到欢迎页
    const goToWelcome = () => {
      router.push('/');
    };

    return {
      isUserLoggedIn,
      username,
      logout,
      goToLogin,
      goToWelcome,
    };
  }
}
</script>

<style scoped>
.navbar {
  background-color: #409eff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  width: 100%; /* 确保占据整个页面宽度 */
  box-sizing: border-box; /* 防止 padding 影响宽度 */
}

.logo {
  font-size: 24px;
  color: #fff;
  font-weight: bold;
  cursor: pointer; /* 鼠标悬停时显示手型 */
}

.logo:hover {
  text-decoration: underline; /* 鼠标悬停时显示下划线 */
}

.right-container {
  display: flex;
  align-items: center;
  gap: 20px; /* 元素之间的间距 */
}

.welcome-message {
  font-size: 16px;
  color: #fff;
}

.el-button {
  margin-left: 10px; /* 按钮之间的间距 */
}
</style>
<template>
  <el-container style="height: 100vh; background-color: #f0f2f5;">
    <el-main>
      <div class="login-container">
        <el-card class="login-card">
          <h2 class="login-title">欢迎登录</h2>
          <el-form 
            :model="form" 
            ref="formRef" 
            label-width="auto" 
            class="login-form"
          >
            <!-- 用户名输入框 -->
            <el-form-item 
              label="用户名" 
              :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]"
            >
              <el-input 
                v-model="form.username" 
                placeholder="请输入用户名" 
                prefix-icon="el-icon-user"
              />
            </el-form-item>

            <!-- 密码输入框 -->
            <el-form-item 
              label="密码" 
              :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
            >
              <el-input 
                v-model="form.password" 
                placeholder="请输入密码"
                prefix-icon="el-icon-lock"
                :type="showPassword ? 'text' : 'password'"
                show-password
              />
            </el-form-item>

            <!-- 登录按钮 -->
            <el-form-item>
              <el-button 
                type="primary" 
                @click="login" 
                class="login-button"
              >
                登录
              </el-button>
            </el-form-item>

            <!-- 注册按钮 -->
            <el-form-item>
              <el-button 
                type="success" 
                @click="register" 
                class="register-button"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { ElMessage } from 'element-plus';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const store = useStore();
    const formRef = ref(null);
    const form = reactive({
      username: '',
      password: ''
    });
    const showPassword = ref(false);  // 控制密码是否显示

    // 登录方法
    const login = async () => {
      try {
        const response = await axios.post('http://localhost:8080/web/login', 
          `username=${form.username}&password=${form.password}`, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (response.data.code === 200) {
          const [userId, role] = response.data.data.split('::');
          const user = {
            username: form.username,
            userId,
            role
          };

          store.dispatch('user/login', user);
          router.push('/home');

          ElMessage.success('登录成功！');
        } else {
          ElMessage.error(`登录失败: ${response.data.message}`);
        }
      } catch (error) {
        ElMessage.error('登录过程中出现错误，请稍后再试。');
        console.error('Error during login: ', error);
      }
    };

    // 注册方法
    const register = async () => {
      try {
        const response = await axios.post('http://localhost:8080/web/register',
          `username=${form.username}&password=${form.password}`, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (response.data.code === 200) {
          ElMessage.success('注册成功！');
          console.log('Registration successful', response.data.message);
          
          // 清空表单数据
          resetForm();

          // 注册成功后跳转到登录页面（如果需要）
          router.push('/login');
        } else {
          ElMessage.error(`注册失败: ${response.data.message}`);
          console.error('Registration failed: ', response.data.message);
        }
      } catch (error) {
        ElMessage.error('注册过程中出现错误，请稍后再试。');
        console.error('Error during registration: ', error);
      }
    };

    // 重置表单方法
    const resetForm = () => {
      form.username = ''; // 清空用户名
      form.password = ''; // 清空密码
    };

    return { form, formRef, login, showPassword, register };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.login-card {
  width: 400px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.login-form {
  margin-top: 20px;
}

.login-form .el-input__inner {
  padding-left: 0; /* 确保输入内容从最左侧开始 */
}

.login-button,
.register-button {
  width: 100%;
  margin-bottom: 10px;
}

.login-button {
  background-color: #409eff;
  border-color: #409eff;
}

.register-button {
  background-color: #67c23a;
  border-color: #67c23a;
}
</style>
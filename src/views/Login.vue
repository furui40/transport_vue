<template>
  <el-container style="height: 100vh">
    <el-main>
      <el-form :model="form" ref="formRef" label-width="100px" class="login-form">
        <!-- 用户名输入框 -->
        <el-form-item 
          label="用户名" 
          :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]">
          <el-input v-model="form.username" />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item 
          label="密码" 
          :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]">
          <el-input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="form.password" 
          />
        </el-form-item>

        <!-- 显示密码、登录按钮和注册按钮放在同一行 -->
        <el-form-item>
          <el-row justify="space-between">
            <!-- 显示密码按钮 -->
            <el-col :span="8">
              <el-button type="primary" @click="togglePasswordVisibility" style="width: 100%;">
                {{ showPassword ? '隐藏密码' : '显示密码' }}
              </el-button>
            </el-col>

            <!-- 登录按钮 -->
            <el-col :span="8">
              <el-button type="primary" @click="login" style="width: 80%;margin-left: 15px;">
                登录
              </el-button>
            </el-col>

            <!-- 注册按钮 -->
            <el-col :span="8">
              <el-button type="primary" @click="register" style="width: 80%;margin-left: 15px;">
                注册
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { ElMessage } from 'element-plus'; // 导入 ElMessage

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

    // 切换密码显示/隐藏
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value;
    };

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
          const userId = response.data.data;
          const user = {
            username: form.username,
            userId: userId,
            role: 'normal'
          };

          store.dispatch('user/login', user);
          router.push('/home');
          ElMessage.success('登录成功！');
          console.log('Login successful', response.data.message);
        } else {
          ElMessage.error(`登录失败: ${response.data.message}`);
          console.error('Login failed: ', response.data.message);


        }
      } catch (error) {
        ElMessage.error(`登录失败: ${response.data.message}`);
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
          // 注册成功后自动登录或跳转至登录页面
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

    return { form, formRef, login, showPassword, togglePasswordVisibility, register };
  }
};
</script>

<style scoped>
.login-form {
  width: 400px;
  margin: 80px auto;
}
</style>
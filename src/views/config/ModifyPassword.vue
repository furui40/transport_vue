<template>
  <div class="modify-password">
    <h2>修改密码</h2>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <!-- 原密码 -->
      <el-form-item label="原密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入原密码"
          show-password
        />
      </el-form-item>

      <!-- 新密码 -->
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>

      <!-- 确认新密码 -->
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
        />
      </el-form-item>

      <!-- 提交按钮 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useStore } from 'vuex';

export default {
  name: 'ModifyPassword',
  setup() {
    const formRef = ref(null); // 表单引用
    const store = useStore(); // 获取 store
    const form = ref({
      oldPassword: '', // 原密码
      newPassword: '', // 新密码
      confirmPassword: '', // 确认新密码
    });

    // 表单验证规则
    const rules = {
      oldPassword: [
        { required: true, message: '请输入原密码', trigger: 'blur' },
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== form.value.newPassword) {
              callback(new Error('两次输入的密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur',
        },
      ],
    };

    // 提交表单
    const submitForm = () => {
      formRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const userId = store.state.user.userId; // 直接从 store 中获取 userId
            const response = await axios.post(
              `/api/web/modifypassword`,
              null,
              {
                params: {
                  useId: userId,
                  password: form.value.oldPassword,
                  newpassword: form.value.newPassword,
                },
              }
            );

            if (response.data.code === 200) {
              ElMessage.success('密码修改成功');
              resetForm(); // 重置表单
            } else {
              ElMessage.error(response.data.message);
            }
          } catch (error) {
            ElMessage.error('密码修改失败，请稍后重试');
            console.error('修改密码失败:', error);
          }
        } else {
          ElMessage.error('请检查表单输入');
        }
      });
    };

    // 重置表单
    const resetForm = () => {
      formRef.value.resetFields();
    };

    return {
      formRef,
      form,
      rules,
      submitForm,
      resetForm,
    };
  },
};
</script>

<style scoped>
.modify-password {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}
</style>
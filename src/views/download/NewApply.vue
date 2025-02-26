<template>
  <div class="download-apply">
    <!-- 申请表单 -->
    <el-form :model="applyForm" label-width="120px" class="form-container">
      <!-- 数据类型 -->
      <el-form-item label="数据类型">
        <el-select v-model="applyForm.dataType" placeholder="请选择数据类型">
          <el-option label="高频传感器数据" value="高频传感器数据" />
          <el-option label="动态称重数据" value="动态称重数据" />
          <el-option label="气象数据" value="气象数据" />
        </el-select>
      </el-form-item>

      <!-- 数据项名称 -->
      <el-form-item label="数据项名称">
        <el-input
          v-model="applyForm.fields"
          type="textarea"
          :rows="4"
          placeholder="请粘贴数据项名称"
        ></el-input>
      </el-form-item>

      <!-- 开始时间 -->
      <el-form-item label="开始时间">
        <el-date-picker
          v-model="applyForm.startTime"
          type="datetime"
          placeholder="选择开始时间"
          value-format="X"
        ></el-date-picker>
      </el-form-item>

      <!-- 结束时间 -->
      <el-form-item label="结束时间">
        <el-date-picker
          v-model="applyForm.stopTime"
          type="datetime"
          placeholder="选择结束时间"
          value-format="X"
        ></el-date-picker>
      </el-form-item>

      <!-- 用户邮箱 -->
      <el-form-item label="用户邮箱">
        <el-input v-model="applyForm.userEmail" placeholder="请输入邮箱"></el-input>
      </el-form-item>
    </el-form>

    <!-- 底部按钮 -->
    <div class="footer-buttons">
      <el-button type="primary" @click="submitApplyForm">提交申请</el-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      applyForm: {
        dataType: '', // 数据类型（动态选择）
        fields: '', // 数据项名称
        startTime: null, // 开始时间
        stopTime: null, // 结束时间
        userEmail: '', // 用户邮箱
      },
    };
  },
  methods: {
    // 提交申请表单
    async submitApplyForm() {
      // 校验表单数据
      if (!this.applyForm.dataType) {
        this.$message.warning('请选择数据类型');
        return;
      }
      if (!this.applyForm.fields) {
        this.$message.warning('请填写数据项名称');
        return;
      }
      if (!this.applyForm.startTime || !this.applyForm.stopTime) {
        this.$message.warning('请选择时间范围');
        return;
      }
      if (!this.applyForm.userEmail) {
        this.$message.warning('请填写用户邮箱');
        return;
      }

      // 获取用户 ID
      const userId = this.$store.state.user.userId;
      if (!userId) {
        this.$message.warning('用户未登录，请先登录');
        return;
      }

      // 构造请求参数
      const params = {
        dataType: this.applyForm.dataType,
        fields: this.applyForm.fields,
        startTime: this.applyForm.startTime,
        stopTime: this.applyForm.stopTime,
        userEmail: this.applyForm.userEmail,
        userId: userId,
      };

      // 发送请求
      try {
        const baseURL = 'http://localhost:8080';
        const response = await axios.post(`${baseURL}/download/newapply`, null, { params });

        if (response.data.code === 200) {
          this.$message.success('申请提交成功');
        } else {
          this.$message.error('申请提交失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('申请提交失败: ' + error.message);
      }
    },
  },
};
</script>

<style scoped>
.download-apply {
  padding: 20px;
}

.form-container {
  width: 70%;
  margin: 0 auto; /* 居中 */
}

.el-form-item {
  margin-bottom: 20px;
}

.el-textarea {
  font-family: monospace;
}

.footer-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
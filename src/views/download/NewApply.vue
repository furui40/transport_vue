<template>
  <div class="download-apply">
    <!-- 申请表单 -->
    <el-form 
      :model="applyForm" 
      :rules="formRules" 
      ref="applyFormRef"
      label-width="120px" 
      class="form-container"
    >
      <!-- 数据类型 -->
      <el-form-item label="数据类型" prop="dataType">
        <el-select v-model="applyForm.dataType" placeholder="请选择数据类型">
          <el-option label="高频传感器数据" value="高频传感器数据" />
          <el-option label="车辆经过时高频传感器数据" value="车辆经过时高频传感器数据" />
          <el-option label="车辆经过时所有传感器数据" value="车辆经过时所有传感器数据" />
        </el-select>
      </el-form-item>

      <!-- 数据项名称 -->
      <el-form-item label="数据项名称" prop="fields">
        <el-input
          v-model="applyForm.fields"
          type="textarea"
          :rows="4"
          placeholder="请粘贴数据项名称，多个用逗号或换行分隔"
        ></el-input>
      </el-form-item>

      <!-- 开始时间 -->
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="applyForm.startTime"
          type="datetime"
          placeholder="选择开始时间"
          value-format="X"
        ></el-date-picker>
      </el-form-item>

      <!-- 结束时间 -->
      <el-form-item label="结束时间" prop="stopTime">
        <el-date-picker
          v-model="applyForm.stopTime"
          type="datetime"
          placeholder="选择结束时间"
          value-format="X"
        ></el-date-picker>
      </el-form-item>

      <!-- 用户邮箱 -->
      <el-form-item label="用户邮箱" prop="userEmail">
        <el-input 
          v-model="applyForm.userEmail" 
          placeholder="请输入有效邮箱地址"
        ></el-input>
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
import { mapGetters } from 'vuex';

export default {
  data() {
    // 邮箱正则表达式
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    return {
      applyForm: {
        dataType: '',
        fields: '',
        startTime: null,
        stopTime: null,
        userEmail: '',
      },
      formRules: {
        dataType: [
          { required: true, message: '请选择数据类型', trigger: 'blur' }
        ],
        fields: [
          { required: true, message: '请填写数据项名称', trigger: 'blur' },
          { validator: this.validateFields, trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'blur' }
        ],
        stopTime: [
          { required: true, message: '请选择结束时间', trigger: 'blur' }
        ],
        userEmail: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { 
            pattern: emailRegex, 
            message: '请输入有效的邮箱地址', 
            trigger: ['blur', 'change'] 
          }
        ]
      }
    };
  },
  computed: {
    ...mapGetters('table', ['isValidChannel']),
  },
  methods: {
    // 验证数据项名称格式
    validateFields(rule, value, callback) {
      if (!value) {
        callback(new Error('请填写数据项名称'));
        return;
      }
      
      const fields = value.split(/[\n,]/).map(f => f.trim()).filter(f => f);
      
      if (fields.length === 0) {
        callback(new Error('请填写至少一个数据项名称'));
        return;
      }
      
      for (const field of fields) {
        if (!this.isValidChannel(field)) {
          callback(new Error(`无效的数据项名称: ${field}`));
          return;
        }
      }
      
      callback();
    },
    
    // 提交申请表单
    async submitApplyForm() {
      try {
        // 验证表单
        await this.$refs.applyFormRef.validate();
        
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
        const response = await axios.post(`/api/download/newapply`, null, { params });

        if (response.data.code === 200) {
          this.$message.success('申请提交成功');
          this.$refs.applyFormRef.resetFields(); // 重置表单
        } else {
          this.$message.error('申请提交失败: ' + response.data.message);
        }
      } catch (error) {
        if (error.name !== 'Error') { // 过滤掉验证错误
          this.$message.error('申请提交失败: ' + error.message);
        }
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
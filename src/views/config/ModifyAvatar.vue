<template>
  <div class="modify-avatar">
    <h2>修改头像</h2>
    <!-- 当前头像 -->
    <el-avatar :size="100" :src="avatarUrl" />

    <!-- 上传组件 -->
    <el-upload
      action="http://localhost:8080/avatar/upload"
      :show-file-list="false"
      :on-success="handleAvatarSuccess"
      :before-upload="beforeAvatarUpload"
      :data="{ userId: userId }"
    >
      <el-button type="primary">上传头像</el-button>
    </el-upload>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export default {
  name: 'ModifyAvatar',
  setup() {
    const store = useStore();

    // 计算属性：用户 ID
    const userId = computed(() => store.state.user.userId);

    // 头像 URL
    const avatarUrl = ref(''); // 初始化为空

    // 获取当前用户头像
    const fetchAvatar = async () => {
      try {
        const baseURL = 'http://localhost:8080';
        const response = await axios.get(`${baseURL}/avatar/getavatar?userId=${userId.value}`);
        if (response.data) {
          avatarUrl.value = response.data; // 设置头像 URL
          store.dispatch('user/updateAvatar', avatarUrl.value);
        }
      } catch (error) {
        console.error('获取头像失败:', error);
        avatarUrl.value = '/avatar/0.png'; // 如果失败，显示默认头像
      }
    };

    // 组件加载时获取头像
    onMounted(fetchAvatar);

    // 上传成功回调
    const handleAvatarSuccess = () => {
      ElMessage.success('头像上传成功');
      fetchAvatar(); // 重新获取头像以更新显示
    };

    // 上传前校验
    const beforeAvatarUpload = (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt100KB = file.size / 1024 <= 100; // 限制文件大小为 100KB
      if (!isImage) {
        ElMessage.error('只能上传图片文件');
      }
      if (!isLt100KB) {
        ElMessage.error('头像图片大小不能超过 100KB');
      }
      return isImage && isLt100KB;
    };

    return {
      userId,
      avatarUrl,
      handleAvatarSuccess,
      beforeAvatarUpload,
    };
  },
};
</script>

<style scoped>
.modify-avatar {
  text-align: center;
}

.el-avatar {
  margin-bottom: 20px;
}
</style>
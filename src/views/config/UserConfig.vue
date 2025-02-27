<template>
  <div class="user-config">
    <!-- 修改密码 -->
    <div class="left-panel">
      <ModifyPassword />
    </div>

    <!-- 修改头像 -->
    <div class="right-panel">
      <ModifyAvatar />
    </div>
  </div>
</template>

<script>
import ModifyPassword from './ModifyPassword.vue';
import ModifyAvatar from './ModifyAvatar.vue';

export default {
  name: 'UserConfig',
  components: {
    ModifyPassword,
    ModifyAvatar,
  },
};
</script>

<style scoped>
.user-config {
  display: flex;
  height: 100vh;
  padding: 20px;
}

.left-panel {
  flex: 1;
  padding-right: 10px;
}

.right-panel {
  flex: 2;
  padding-left: 10px;
}
</style>
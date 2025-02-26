<template>
  <div class="history-apply">
    <!-- 历史申请记录表格 -->
    <el-table :data="historyData" style="width: 100%" border>
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="getColumnLabel(column.prop)"
        :width="getColumnWidth(column.prop)"
      />
    </el-table>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex'; // 引入 mapGetters

export default {
  name: 'HistoryApply',
  data() {
    return {
      historyData: [], // 历史申请记录数据
      columns: [
        { prop: 'applyId' },
        { prop: 'dataType' },
        { prop: 'fields' },
        { prop: 'startTime' },
        { prop: 'stopTime' },
        { prop: 'status' },
        { prop: 'userEmail' },
        { prop: 'msg' },
      ],
    };
  },
  computed: {
    // 映射 Vuex 的 getters
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']),
  },
  created() {
    // 页面加载时自动触发搜索
    this.fetchHistoryData();
  },
  methods: {
    // 获取历史申请数据
    async fetchHistoryData() {
      try {
        const userId = this.$store.state.user.userId; // 获取当前用户 ID
        if (!userId) {
          this.$message.warning('用户未登录，请先登录');
          return;
        }

        // 调用后端接口
        const baseURL = 'http://localhost:8080';
        const response = await axios.post(`${baseURL}/download/searchapply`, null, {
          params: {
            method: '1', // 查询当前用户的历史申请
            userId: userId,
          },
        });

        if (response.data.code === 200) {
          // 处理查询结果
          this.historyData = response.data.data.map(item => ({
            applyId: item.applyId || 'N/A', // 确保字段名称一致
            dataType: item.dataType || 'N/A', // 确保字段名称一致
            fields: item.fields || 'N/A', // 确保字段名称一致
            startTime: item.startTime ? this.formatTimestamp(item.startTime) : 'N/A', // 处理空值
            stopTime: item.stopTime ? this.formatTimestamp(item.stopTime) : 'N/A', // 处理空值
            status: item.status || 'N/A', // 确保字段名称一致
            userEmail: item.userEmail || 'N/A', // 确保字段名称一致
            msg: item.msg || 'N/A', // 确保字段名称一致
          }));
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },

    // 将 Unix 时间戳转换为本地时间格式
    formatTimestamp(timestamp) {
      if (!timestamp) return 'N/A'; // 如果时间戳为空，返回默认值
      return new Date(parseInt(timestamp) * 1000).toLocaleString(); // 转换为本地时间
    },
  },
};
</script>

<style scoped>
.history-apply {
  margin-top: 0px;
  padding: 20px;
}

.el-table {
  margin-top: 0px;
}
</style>
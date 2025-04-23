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
      >
        <template #default="scope">
          <template v-if="shouldTruncate(column.prop) && scope.row[column.prop]">
            <div v-if="!scope.row[`${column.prop}Expanded`]">
              {{ truncateText(scope.row[column.prop]) }}
              <el-button
                v-if="scope.row[column.prop].length > 80"
                type="text"
                size="mini"
                @click="toggleExpand(scope.row, column.prop)"
              >
                展开
              </el-button>
            </div>
            <div v-else>
              {{ scope.row[column.prop] }}
              <el-button
                type="text"
                size="mini"
                @click="toggleExpand(scope.row, column.prop)"
              >
                收起
              </el-button>
            </div>
          </template>
          <template v-else>
            {{ scope.row[column.prop] || 'N/A' }}
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'HistoryApply',
  data() {
    return {
      historyData: [],
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
      // 需要截断显示的列
      truncateColumns: ['fields', 'msg', 'userEmail']
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']),
  },
  created() {
    this.fetchHistoryData();
  },
  methods: {
    // 判断是否需要截断显示
    shouldTruncate(prop) {
      return this.truncateColumns.includes(prop);
    },
    
    // 截断文本
    truncateText(text) {
      if (!text) return '';
      return text.length > 80 ? text.substring(0, 80) + '...' : text;
    },
    
    // 切换展开/收起状态
    toggleExpand(row, prop) {
      row[`${prop}Expanded`] = !row[`${prop}Expanded`];
    },

    async fetchHistoryData() {
      try {
        const userId = this.$store.state.user.userId;
        if (!userId) {
          this.$message.warning('用户未登录，请先登录');
          return;
        }

        const baseURL = 'http://localhost:8080';
        const response = await axios.post(`${baseURL}/download/searchapply`, null, {
          params: {
            method: '1',
            userId: userId,
          },
        });

        if (response.data.code === 200) {
          this.historyData = response.data.data.map(item => ({
            applyId: item.applyId || 'N/A',
            dataType: item.dataType || 'N/A',
            fields: item.fields || 'N/A',
            startTime: item.startTime ? this.formatTimestamp(item.startTime) : 'N/A',
            stopTime: item.stopTime ? this.formatTimestamp(item.stopTime) : 'N/A',
            status: item.status || 'N/A',
            userEmail: item.userEmail || 'N/A',
            msg: item.msg || 'N/A',
          }));
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },

    formatTimestamp(timestamp) {
      if (!timestamp) return 'N/A';
      return new Date(parseInt(timestamp) * 1000).toLocaleString();
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

/* 展开/收起按钮样式 */
.el-button--text {
  padding: 0 0 0 5px;
  vertical-align: baseline;
}
</style>
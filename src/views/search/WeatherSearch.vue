<template>
  <div class="weather-query">
    <!-- 加粗标题 -->
    <div class="title">
      <h2>气象数据查询</h2>
    </div>

    <!-- 时间选择和查询按钮 -->
    <div class="time-picker-container">
      <!-- 时间选择 -->
      <div class="time-picker">
        <el-date-picker
          v-model="startTime"
          type="datetime"
          placeholder="选择开始时间"
          value-format="X"
        />
        <el-date-picker
          v-model="stopTime"
          type="datetime"
          placeholder="选择结束时间"
          value-format="X"
        />
      </div>

      <!-- 查询按钮和下载按钮 -->
      <div class="button-group">
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button
          type="success"
          :disabled="!tableData.length"
          @click="handleDownload"
        >
          下载
        </el-button>
      </div>
    </div>

    <!-- 查询结果 -->
    <div class="query-result">
      <el-table
        :data="tableData"
        border
        style="width: 100%"
        height="500"
        v-if="tableData.length > 0"
      >
        <!-- 固定列：时间 -->
        <el-table-column
          prop="timestamp"
          label="时间"
          width="180"
          fixed
        />

        <!-- 动态列：其他数据 -->
        <el-table-column
          v-for="(value, key) in filteredColumns"
          :key="key"
          :prop="key"
          :label="getColumnLabel(key)"
          :min-width="getColumnWidth(key)"
        />
      </el-table>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import * as XLSX from 'xlsx'; 

export default {
  data() {
    return {
      startTime: null, // 开始时间
      stopTime: null, // 结束时间
      tableData: [], // 表格数据
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']), 
    // 过滤掉 timestamp 字段
    filteredColumns() {
      if (this.tableData.length === 0) return {};
      const firstRow = this.tableData[0];
      const excludedFields = ['timestamp']; // 排除时间字段
      return Object.keys(firstRow)
        .filter(key => !excludedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = firstRow[key];
          return obj;
        }, {});
    },
  },
  methods: {
    // 处理查询
    async handleQuery() {
      if (!this.startTime || !this.stopTime) {
        this.$message.warning('请选择时间范围');
        return;
      }
      if (this.stopTime - this.startTime > 21600) {
        this.$message.warning('游客模式只能查询六个小时，更长时间请登录后使用');
        return;
      }
      const userId = this.$store.state.user.userId;
      if (!userId) {
        this.$message.warning('用户未登录，请先登录');
        return;
      }
      try {
        const baseURL = 'http://localhost:8080';
        const response = await axios.post(`${baseURL}/search/weather`, null, {
          params: {
            startTime: this.startTime,
            stopTime: this.stopTime,
            userId,
          },
        });

        if (response.data.code === 200) {
          this.tableData = response.data.data.map(item => {
            return {
              timestamp: new Date(item.timestamp).toLocaleString(), // 格式化时间戳
              ...item, // 其他字段
            };
          });
          this.$message.success('查询成功');
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },

    // 处理下载
    handleDownload() {
      if (this.tableData.length === 0) {
        this.$message.warning('没有数据可下载');
        return;
      }

      // 将列名替换为中文
      const chineseData = this.tableData.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
          const chineseKey = this.getColumnLabel(key);
          newItem[chineseKey] = item[key];
        });
        return newItem;
      });

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(chineseData);
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '气象数据数据');

      // 导出 Excel 文件
      XLSX.writeFile(workbook, '气象数据.xlsx');
    },
  },
};
</script>


<style scoped>
.weather-query {
  padding: 20px;
  text-align: center; /* 整体居中 */
}

/* 标题样式 */
.title h2 {
  font-weight: bold; /* 加粗 */
  margin-bottom: 20px; /* 与下方内容保持间距 */
}

/* 时间选择和查询按钮容器 */
.time-picker-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  gap: 20px; /* 时间选择框和按钮之间的间距 */
  margin-bottom: 20px; /* 与表格保持间距 */
}

/* 时间选择框样式 */
.time-picker {
  display: flex;
  gap: 10px; /* 两个时间选择框之间的间距 */
}

/* 查询按钮样式 */
.query-button {
  margin-left: 20px; /* 与时间选择框保持间距 */
}

/* 查询结果表格样式 */
.query-result {
  width: 100%;
  overflow-x: auto; /* 横向滚动 */
}

.el-table {
  width: 100%;
}

.el-table-column {
  white-space: nowrap; /* 防止文字换行 */
}
</style>
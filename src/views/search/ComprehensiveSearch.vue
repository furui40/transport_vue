<template>
  <div class="comprehensive-query">
    <!-- 加粗标题 -->
    <div class="title">
      <h2>综合数据查询</h2>
    </div>

    <!-- 数据选择、时间选择和查询按钮 -->
    <div class="query-controls">
      <!-- 数据选择 -->
      <div class="data-select">
        <el-select v-model="selectedDataType" placeholder="请选择数据类型">
          <el-option label="动态称重数据" value="dynamicWeighing" />
          <el-option label="气象数据" value="weather" />
          <!-- 可以继续添加其他数据类型的选项 -->
        </el-select>
      </div>

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
      <!-- 动态称重数据表格 -->
      <el-table
        v-if="selectedDataType === 'dynamicWeighing' && tableData.length > 0"
        :data="paginatedData"
        border
        style="width: 100%"
        height="500"
      >
        <!-- 固定列：编号 -->
        <el-table-column prop="id" label="编号" width="100" fixed />
        <!-- 固定列：时间 -->
        <el-table-column prop="timestamp" label="时间" width="180" fixed />
        <!-- 动态列：其他数据 -->
        <el-table-column
          v-for="(value, key) in filteredColumns"
          :key="key"
          :prop="key"
          :label="getColumnLabel(key)"
          :min-width="getColumnWidth(key)"
        />
      </el-table>

      <!-- 气象数据表格 -->
      <el-table
        v-if="selectedDataType === 'weather' && tableData.length > 0"
        :data="paginatedData"
        border
        style="width: 100%"
        height="500"
      >
        <!-- 固定列：时间 -->
        <el-table-column prop="timestamp" label="时间" width="180" fixed />
        <!-- 动态列：其他数据 -->
        <el-table-column
          v-for="(value, key) in filteredColumns"
          :key="key"
          :prop="key"
          :label="getColumnLabel(key)"
          :min-width="getColumnWidth(key)"
        />
      </el-table>

      <!-- 分页组件 -->
      <el-pagination
        v-if="tableData.length > 0"
        class="pagination"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="tableData.length"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
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
      selectedDataType: 'dynamicWeighing', // 默认选择动态称重数据
      startTime: null, // 开始时间
      stopTime: null, // 结束时间
      tableData: [], // 表格数据
      currentPage: 1, // 当前页码
      pageSize: 20, // 每页显示的行数
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']), // 映射 Vuex 的 getters
    // 过滤掉不需要的字段
    filteredColumns() {
      if (this.tableData.length === 0) return {};
      const firstRow = this.tableData[0];
      const excludedFields =
        this.selectedDataType === 'dynamicWeighing'
          ? ['id', 'timestamp'] // 动态称重数据排除 id 和 timestamp
          : ['timestamp']; // 气象数据排除 timestamp
      return Object.keys(firstRow)
        .filter(key => !excludedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = firstRow[key];
          return obj;
        }, {});
    },
    // 分页后的数据
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.tableData.slice(start, end);
    },
  },
  methods: {
    // 处理查询
    async handleQuery() {
      if (!this.startTime || !this.stopTime) {
        this.$message.warning('请选择时间范围');
        return;
      }
      const userId = this.$store.state.user.userId; // 假设 userId 存储在 Vuex 中
      if (!userId) {
        this.$message.warning('用户未登录，请先登录');
        return;
      }
      try {
        const baseURL = 'http://localhost:8080';
        let apiEndpoint = '';
        if (this.selectedDataType === 'dynamicWeighing') {
          apiEndpoint = '/search/dynamicWeighing';
        } else if (this.selectedDataType === 'weather') {
          apiEndpoint = '/search/weather';
        }

        const response = await axios.post(`${baseURL}${apiEndpoint}`, null, {
          params: {
            startTime: this.startTime,
            stopTime: this.stopTime,
            userId,
          },
        });

        if (response.data.code === 200) {
          this.tableData = response.data.data.map(item => {
            const formattedItem = {
              timestamp: new Date(item.timestamp).toLocaleString(), // 格式化时间戳
              ...item, // 其他字段
            };
            if (this.selectedDataType === 'dynamicWeighing') {
              formattedItem.id = item.id; // 动态称重数据包含 id
            }
            return formattedItem;
          });
          this.currentPage = 1; // 查询成功后重置到第一页
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
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        this.selectedDataType === 'dynamicWeighing' ? '动态称重数据' : '气象数据'
      );

      // 导出 Excel 文件
      XLSX.writeFile(
        workbook,
        this.selectedDataType === 'dynamicWeighing'
          ? '动态称重数据.xlsx'
          : '气象数据.xlsx'
      );
    },

    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
    },
  },
};
</script>

<style scoped>
.comprehensive-query {
  padding: 20px;
  text-align: center; /* 整体居中 */
}

/* 标题样式 */
.title h2 {
  font-weight: bold; /* 加粗 */
  margin-bottom: 20px; /* 与下方内容保持间距 */
}

/* 查询控件容器 */
.query-controls {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  gap: 20px; /* 控件之间的间距 */
  margin-bottom: 20px; /* 与表格保持间距 */
}

/* 数据选择框样式 */
.data-select {
  min-width: 200px; /* 设置最小宽度 */
}

/* 时间选择框样式 */
.time-picker {
  display: flex;
  gap: 10px; /* 两个时间选择框之间的间距 */
}

/* 按钮组样式 */
.button-group {
  display: flex;
  gap: 10px; /* 查询按钮和下载按钮之间的间距 */
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

/* 分页组件样式 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center; /* 居中显示 */
}
</style>
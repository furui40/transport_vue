<template>
  <div class="comprehensive-search-and-visualize">
    <!-- 加粗标题 -->
    <div class="title">
      <h2>综合数据查询与可视化</h2>
    </div>

    <!-- 数据选择、时间选择和查询按钮 -->
    <div class="query-controls">
      <!-- 数据选择 -->
      <div class="data-select">
        <el-select v-model="selectedDataType" placeholder="请选择数据类型">
          <el-option label="动态称重数据" value="dynamicWeighing" />
          <el-option label="气象数据" value="weather" />
          <!-- 继续添加其他数据类型的选项 -->
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

    <!-- 查询结果与可视化 -->
    <div class="query-result-and-visualize">
      <!-- 左半部分：可视化 -->
      <div class="visualize-panel">
        <component :is="currentVisualizationComponent" :data="tableData" />
      </div>

      <!-- 右半部分：表格展示 -->
      <div class="table-panel">
        <el-table
          v-if="tableData.length > 0"
          :data="paginatedData"
          border
          style="width: 100%"
        >
          <!-- 固定列：编号 -->
          <el-table-column prop="id" label="编号" width="100" fixed v-if="selectedDataType === 'dynamicWeighing'" />
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import * as XLSX from 'xlsx';
import WeightVisualize from '../visualize/WeightVisualize.vue';
import DefaultVisualize from '../visualize/Default.vue';

export default {
  components: {
    WeightVisualize,
    DefaultVisualize,
  },
  data() {
    return {
      selectedDataType: 'dynamicWeighing', // 默认选择动态称重数据
      startTime: null, // 开始时间
      stopTime: null, // 结束时间
      tableData: [], // 表格数据
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页显示的行数
    };
  },
  watch: {
    selectedDataType() {
      // 清空表格数据
      this.tableData = [];
      // 重置分页
      this.currentPage = 1;
    },
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
    // 当前可视化组件
    currentVisualizationComponent() {
      if (this.selectedDataType === 'dynamicWeighing') {
        return 'WeightVisualize';
      }
      return 'DefaultVisualize';
    },
  },
  methods: {
    // 处理查询
    convertToLocalTime(utcTime) {
      const date = new Date(utcTime); 
      return date.toLocaleString(); // 返回本地时间字符串
    },
    async handleQuery() {
      if (!this.startTime || !this.stopTime) {
        this.$message.warning('请选择时间范围');
        return;
      }
      const userId = this.$store.state.user.userId; 
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
              ...item,
              timestamp: this.convertToLocalTime(item.timestamp), // 转换时间
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
.comprehensive-search-and-visualize {
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

/* 查询结果与可视化容器 */
.query-result-and-visualize {
  display: flex;
  gap: 20px;
}

/* 可视化面板 */
.visualize-panel {
  flex: 1;
}

/* 表格面板样式 */
.table-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px); /* 动态计算高度 */
  overflow-y: auto; /* 启用滚动条 */
}

/* 表格样式 */
.el-table {
  width: 100%;
  flex: 1; /* 表格占据剩余空间 */
}

/* 分页组件样式 */
.pagination {
  flex-shrink: 0; /* 防止分页组件被压缩 */
  margin-top: 10px;
  display: flex;
  justify-content: center;
}
</style>
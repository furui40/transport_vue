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
          <el-option label="沉降数据(mm)" value="subside" />
          <el-option label="孔隙水压力(Mpa)" value="waterPressure" />
          <el-option label="温湿度(℃,%RH)" value="humiture" />
        </el-select>
      </div>

      <!-- 测点选择按钮 -->
      <div class="point-select-button" 
           v-if="['subside', 'waterPressure', 'humiture'].includes(selectedDataType)">
        <el-button type="primary" @click="showPointDialog = true">选择测点</el-button>
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

    <!-- 测点选择弹窗 -->
    <el-dialog
      v-model="showPointDialog"
      title="选择测点"
      width="50%"
    >
      <!-- 测点表格 -->
      <el-table
        ref="pointTable"
        :data="currentPoints"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <!-- 多选框列 -->
        <el-table-column type="selection" width="55" />
        <!-- 测点ID列 -->
        <el-table-column prop="id" label="测点ID" />
      </el-table>

      <template #footer>
        <el-button @click="showPointDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePointConfirm">确认</el-button>
      </template>
    </el-dialog>

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
import WeatherVisualize from '../visualize/WeatherVisualize.vue';
import SubsideVisualize from '../visualize/SubsideVisualize.vue';
import DefaultVisualize from '../visualize/Default.vue';

export default {
  components: {
    WeightVisualize,
    WeatherVisualize,
    SubsideVisualize,
    DefaultVisualize,
  },
  data() {
    // 生成测点数据
    const generatePoints = (prefix, start, end) => 
      Array.from({ length: end - start + 1 }, (_, i) => ({
        id: `${prefix}-${String(start + i).padStart(2, '0')}`
      }));

    return {
      selectedDataType: 'dynamicWeighing',
      startTime: null,
      stopTime: null,
      tableData: [],
      currentPage: 1,
      pageSize: 12,
      selectedPoints: [],
      showPointDialog: false,
      
      // 测点数据
      subsidePoints: generatePoints('0034230033', 1, 15),
      waterPressurePoints: [
        ...generatePoints('0034230583', 1, 9),
        ...generatePoints('0034230610', 1, 20)
      ],
      humiturePoints: [
        ...generatePoints('0034230034', 1, 16),
        ...generatePoints('0034230583', 10, 18),
        ...generatePoints('0034230607', 1, 20)
      ]
    };
  },
  watch: {
    selectedDataType() {
      this.tableData = [];
      this.currentPage = 1;
      this.selectedPoints = [];
    },
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']),
    currentPoints() {
      switch (this.selectedDataType) {
        case 'subside': return this.subsidePoints;
        case 'waterPressure': return this.waterPressurePoints;
        case 'humiture': return this.humiturePoints;
        default: return [];
      }
    },
    filteredColumns() {
      if (this.tableData.length === 0) return {};
      const dynamicColumns = new Set();
      
      this.tableData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'timestamp') dynamicColumns.add(key);
        });
      });

      return Array.from(dynamicColumns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.tableData.slice(start, start + this.pageSize);
    },
    currentVisualizationComponent() {
      const visualComponents = {
        dynamicWeighing: 'WeightVisualize',
        weather: 'WeatherVisualize',
        subside: 'SubsideVisualize',
        waterPressure: 'SubsideVisualize',
        humiture: 'SubsideVisualize'
      };
      return visualComponents[this.selectedDataType] || 'DefaultVisualize';
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.selectedPoints = selection.map(point => point.id);
    },
    handlePointConfirm() {
      this.showPointDialog = false;
    },
    convertToLocalTime(utcTime) {
      return new Date(utcTime).toLocaleString();
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
        const endpoints = {
          dynamicWeighing: '/search/dynamicWeighing',
          weather: '/search/weather',
          subside: '/search/subside',
          waterPressure: '/search/waterPressure',
          humiture: '/search/humiture'
        };

        const params = {
          startTime: this.startTime,
          stopTime: this.stopTime,
          userId,
          ...(['subside', 'waterPressure', 'humiture'].includes(this.selectedDataType) && {
            fields: this.selectedPoints.join(',')
          })
        };

        const response = await axios.post(
          `http://localhost:8080${endpoints[this.selectedDataType]}`,
          null,
          { params }
        );

        if (response.data.code === 200) {
          this.tableData = response.data.data.map(item => {
            const formatted = {
              ...item,
              timestamp: this.convertToLocalTime(item.timestamp)
            };

            if (item.fieldValues) {
                Object.entries(item.fieldValues).forEach(([fieldKey, value]) => {
                  if (['subside', 'waterPressure'].includes(this.selectedDataType)) {
                    formatted[fieldKey] = value;
                  } else if (this.selectedDataType === 'humiture') {
                    const [baseId, fieldType] = fieldKey.split('_');
                    formatted[`${baseId}_${fieldType}`] = value;
                  }
                });

                delete item.fieldValues;
                delete formatted.fieldValues;
              }

            return Object.assign({}, item, formatted);
          }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          this.currentPage = 1;
          this.$message.success('查询成功');
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },
    handleDownload() {
      if (!this.tableData.length) {
        this.$message.warning('没有数据可下载');
        return;
      }

      const sheetNames = {
        dynamicWeighing: '动态称重数据',
        weather: '气象数据',
        subside: '沉降数据',
        waterPressure: '孔隙水压力数据',
        humiture: '温湿度数据'
      };

      const worksheet = XLSX.utils.json_to_sheet(
        this.tableData.map(item => {
          const translated = {};
          Object.keys(item).forEach(key => {
            translated[this.getColumnLabel(key)] = item[key];
          });
          return translated;
        })
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetNames[this.selectedDataType] || '数据'
      );

      XLSX.writeFile(
        workbook,
        `${sheetNames[this.selectedDataType] || '数据'}.xlsx`
      );
    },
    handlePageChange(page) {
      this.currentPage = page;
    }
  }
};
</script>

<style scoped>
.comprehensive-search-and-visualize {
  padding: 10px;
  text-align: center; /* 整体居中 */
}

/* 标题样式 */
.title h2 {
  font-weight: bold; 
  margin-top: 0px;
  margin-bottom: 10px; 
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

.point-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 三列 */
  gap: 10px; /* 间距 */
}

.point-item {
  display: flex;
  align-items: center;
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
  flex: 2;
}

/* 表格面板样式 */
.table-panel {
  flex: 3;
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
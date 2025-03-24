<template>
  <div class="subside-visualize">
    <div class="container">
      <!-- 左侧：按钮和图像区域 -->
      <div class="left-panel">
        <!-- 新增：按小时或数据点绘制折线图 -->
        <div class="line-chart-controls" v-if="data.length > 0">
          <el-select v-model="selectedColumn" placeholder="请选择列" @change="handleColumnChange">
            <el-option
              v-for="column in availableColumns"
              :key="column"
              :label="this.getColumnLabel(column)"
              :value="column"
            />
          </el-select>
          <el-button type="primary" @click="renderLineChartByDataPoints">按数据点绘制</el-button>
          <el-button type="success" @click="renderLineChartByHour">按小时绘制</el-button>
        </div>

        <!-- 列选择器和绘制按钮 -->
        <div class="column-selector" v-if="data.length > 0">
          <el-select v-model="selectedColumn" placeholder="请选择列" @change="handleColumnChange">
            <el-option
              v-for="column in availableColumns"
              :key="column"
              :label="this.getColumnLabel(column)"
              :value="column"
            />
          </el-select>
          <el-button type="primary" @click="renderColumnPieChart">饼状图</el-button>
          <el-button type="success" @click="renderColumnBarChart">柱状图</el-button>
          <el-button type="warning" @click="renderColumnLineChart">折线图</el-button>
          <span class="column-range">取值范围为 {{ columnStats.min }} - {{ columnStats.max }}</span>
        </div>

        <!-- 区间配置输入区域 -->
        <div class="range-config" v-if="selectedColumn && data.length > 0">
          <div v-for="(range, index) in customRanges" :key="index" class="range-input">
            <el-input v-model="range.min" placeholder="最小值" style="width: 100px;"></el-input>
            <span> - </span>
            <el-input v-model="range.max" placeholder="最大值" style="width: 100px;"></el-input>
            <el-button type="danger" @click="removeRange(index)" :disabled="customRanges.length === 1">
              删除
            </el-button>
          </div>
          <el-button type="primary" @click="addRange">添加区间</el-button>
        </div>

        <div class="chart-container">
          <div ref="chart" class="chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as echarts from 'echarts';
import {
  calculateColumnStats,
  renderColumnPieChart,
  renderColumnBarChart,
  renderColumnLineChart,
  renderLineChartByDataPoints,
  renderLineChartByHour,
} from '@/utils/visualizeutils';

export default {
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      chartInstance: null, // ECharts 实例
      currentChart: '', // 当前显示的图表类型
      selectedColumn: '', // 当前选择的列
      availableColumns: [], // 可选的列名
      customRanges: [{ min: null, max: null }], // 自定义区间
      columnStats: { min: null, max: null }, // 列的最小值和最大值
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnLabel']), // 从 Vuex 获取列名映射
  },
  watch: {
    data: {
      immediate: true,
      handler() {
        this.updateAvailableColumns();
      },
    },
  },
  mounted() {
    this.updateAvailableColumns();
  },
  methods: {
    // 更新可选的列名
    updateAvailableColumns() {
      if (this.data.length > 0) {
        const firstRow = this.data[0];
        this.availableColumns = Object.keys(firstRow)
          .filter(key => typeof firstRow[key] === 'number') // 只选择数值类型的列
          .sort((a, b) => {
            // 温湿度数据特殊排序（按测点分组）
            if (a.includes('_') && b.includes('_')) {
              const [aBase, aType] = a.split('_');
              const [bBase, bType] = b.split('_');
              return aBase.localeCompare(bBase) || aType.localeCompare(bType);
            }
            // 普通测点直接排序
            return a.localeCompare(b);
          });
      } else {
        this.availableColumns = [];
      }
    },

    // 处理列选择变化
    handleColumnChange() {
      this.currentChart = 'columnPieChart';
      this.customRanges = [{ min: null, max: null }]; // 重置区间配置
      this.columnStats = calculateColumnStats(this.data, this.selectedColumn); // 计算列的最小值和最大值
    },

    // 添加区间
    addRange() {
      this.customRanges.push({ min: null, max: null });
    },

    // 删除区间
    removeRange(index) {
      if (this.customRanges.length > 1) {
        this.customRanges.splice(index, 1);
      }
    },

    // 渲染自定义饼状图
    renderColumnPieChart() {
      try {
        renderColumnPieChart(this.$refs.chart, this.data, this.selectedColumn, this.customRanges, this.getColumnLabel);
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 渲染柱状图
    renderColumnBarChart() {
      try {
        renderColumnBarChart(this.$refs.chart, this.data, this.selectedColumn, this.customRanges, this.getColumnLabel);
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 渲染折线图
    renderColumnLineChart() {
      try {
        renderColumnLineChart(this.$refs.chart, this.data, this.selectedColumn, this.customRanges, this.getColumnLabel);
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 按数据点绘制折线图
    renderLineChartByDataPoints() {
      try {
        renderLineChartByDataPoints(this.$refs.chart, this.data, this.selectedColumn, this.getColumnLabel);
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 按小时绘制折线图
    renderLineChartByHour() {
      try {
        renderLineChartByHour(this.$refs.chart, this.data, this.selectedColumn, this.getColumnLabel);
      } catch (error) {
        this.$message.warning(error.message);
      }
    },
  },
};
</script>

<style scoped>
.subside-visualize {
  padding: 10px;
}

.container {
  display: flex;
  gap: 10px;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.line-chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0px;
}

.column-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.column-selector > * {
  flex: 1;
}

.column-selector > .el-select {
  flex: 2;
}

.column-selector > .el-button {
  flex: 1;
}

.column-selector > .column-range {
  flex: 2;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.range-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
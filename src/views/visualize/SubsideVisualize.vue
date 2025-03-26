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
          <span class="text">自定义图表</span>
          <el-button type="primary" @click="renderColumnPieChart">饼状图</el-button>
          <el-button type="success" @click="renderColumnBarChart">柱状图</el-button>
          <el-button type="warning" @click="renderColumnLineChart">折线图</el-button>
          <span class="text">取值范围为 {{ columnStats.min }} - {{ columnStats.max }}</span>
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
      chartInstance: null,
      currentChart: '',
      selectedColumn: '',
      availableColumns: [],
      customRanges: [{ min: null, max: null }],
      columnStats: { min: null, max: null },
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnLabel']),
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
    // 清理当前图表
    clearChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
      if (this.$refs.chart) {
        this.$refs.chart.innerHTML = '';
      }
    },

    // 准备图表容器
    prepareChartContainer() {
      this.clearChart();
      this.$refs.chart.innerHTML = '<div class="chart-content" style="width:100%;height:100%;"></div>';
      return this.$refs.chart.querySelector('.chart-content');
    },

    updateAvailableColumns() {
      if (this.data.length > 0) {
        const firstRow = this.data[0];
        this.availableColumns = Object.keys(firstRow)
          .filter(key => typeof firstRow[key] === 'number')
          .sort((a, b) => {
            if (a.includes('_') && b.includes('_')) {
              const [aBase, aType] = a.split('_');
              const [bBase, bType] = b.split('_');
              return aBase.localeCompare(bBase) || aType.localeCompare(bType);
            }
            return a.localeCompare(b);
          });
      } else {
        this.availableColumns = [];
      }
    },

    handleColumnChange() {
      this.currentChart = 'columnPieChart';
      this.customRanges = [{ min: null, max: null }];
      this.columnStats = calculateColumnStats(this.data, this.selectedColumn);
    },

    addRange() {
      this.customRanges.push({ min: null, max: null });
    },

    removeRange(index) {
      if (this.customRanges.length > 1) {
        this.customRanges.splice(index, 1);
      }
    },

    // 渲染自定义饼状图
    renderColumnPieChart() {
      try {
        const chartContainer = this.prepareChartContainer();
        renderColumnPieChart(
          chartContainer,
          this.data,
          this.selectedColumn,
          this.customRanges,
          this.getColumnLabel
        );
        this.currentChart = 'pieChart';
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 渲染柱状图
    renderColumnBarChart() {
      try {
        const chartContainer = this.prepareChartContainer();
        renderColumnBarChart(
          chartContainer,
          this.data,
          this.selectedColumn,
          this.customRanges,
          this.getColumnLabel
        );
        this.currentChart = 'barChart';
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 渲染折线图
    renderColumnLineChart() {
      try {
        const chartContainer = this.prepareChartContainer();
        renderColumnLineChart(
          chartContainer,
          this.data,
          this.selectedColumn,
          this.customRanges,
          this.getColumnLabel
        );
        this.currentChart = 'lineChart';
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 按数据点绘制折线图
    renderLineChartByDataPoints() {
      try {
        const chartContainer = this.prepareChartContainer();
        renderLineChartByDataPoints(
          chartContainer,
          this.data,
          this.selectedColumn,
          this.getColumnLabel
        );
        this.currentChart = 'lineChartByPoints';
      } catch (error) {
        this.$message.warning(error.message);
      }
    },

    // 按小时绘制折线图
    renderLineChartByHour() {
      try {
        const chartContainer = this.prepareChartContainer();
        renderLineChartByHour(
          chartContainer,
          this.data,
          this.selectedColumn,
          this.getColumnLabel
        );
        this.currentChart = 'lineChartByHour';
      } catch (error) {
        this.$message.warning(error.message);
      }
    },
  },
  beforeDestroy() {
    this.clearChart();
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

.column-selector > .el-button {
  flex: 1;
}

.column-selector > .text {
  flex: 2;
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
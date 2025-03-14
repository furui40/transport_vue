<template>
  <div class="weight-visualize">
    <div class="container">
      <!-- 左侧：按钮和图像区域 -->
      <div class="left-panel">
        <div class="button-group" v-if="data.length > 0">
          <el-button type="primary" @click="renderChart('trafficHour')">
            按小时车流量柱状图
          </el-button>
          <el-button type="success" @click="renderChart('weightDistribution')">
            车辆重量分布饼状图
          </el-button>
          <el-button type="warning" @click="renderChart('vehicleType')">
            车辆类型分布饼状图
          </el-button>
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
          <div v-if="currentChart === 'weightDistribution'" class="stats">
            <p>车辆总数: {{ stats.totalVehicles }}</p>
            <p>平均重量: {{ stats.averageWeight.toFixed(2) }} 吨</p>
            <p>总重量: {{ stats.totalWeight.toFixed(2) }} 吨</p>
            <p>最大重量: {{ stats.maxWeight.toFixed(2) }} 吨</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as echarts from 'echarts';
import { calculateColumnStats, renderColumnPieChart, renderColumnBarChart, renderColumnLineChart } from '@/utils/visualizeutils';

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
      stats: {
        totalVehicles: 0,
        averageWeight: 0,
        totalWeight: 0,
        maxWeight: 0,
      },
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnLabel']), // 从 Vuex 获取列名映射
  },
  watch: {
    data: {
      immediate: true,
      handler() {
        this.calculateStats();
        this.updateAvailableColumns();
      },
    },
  },
  mounted() {
    this.calculateStats();
    this.updateAvailableColumns();
  },
  methods: {
    // 更新可选的列名
    updateAvailableColumns() {
      if (this.data.length > 0) {
        const firstRow = this.data[0];
        this.availableColumns = Object.keys(firstRow).filter(
          (key) => typeof firstRow[key] === 'number' // 只选择数值类型的列
        );
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

    // 渲染列饼状图
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
    // 渲染图表
    renderChart(type) {
      this.currentChart = type;
      if (this.chartInstance) {
        this.chartInstance.dispose(); // 销毁之前的图表
      }
      const chartDom = this.$refs.chart;
      this.chartInstance = echarts.init(chartDom);

      let option;
      if (type === 'trafficHour') {
        const trafficHourData = this.calculateTrafficHourData();
        option = {
          tooltip: {
            trigger: 'item', 
            axisPointer: {
                type: 'shadow', 
            },
            formatter: (params) => {
                const data = params;
                return `车流量: ${data.value}`;
            },
          },
          xAxis: {
            type: 'category',
            data: trafficHourData.labels,
          },
          yAxis: {
            type: 'value',
          },
          series: [
            {
              name: '车流量',
              type: 'bar',
              data: trafficHourData.values,
              itemStyle: {
                color: '#5470C6',
              },
            },
          ],
        };
      } else if (type === 'weightDistribution') {
        const weightDistributionData = this.calculateWeightDistributionData();
        option = {
          tooltip: {
            trigger: 'item', // 触发类型为数据项
            formatter: (params) => {
                const { name, value, percent } = params;
                return `${name}: ${value} 辆 (${percent}%)`;
            },
          },
          legend: {
            orient: 'vertical',
            left: 'left',
          },
          series: [
            {
              name: '车辆重量分布',
              type: 'pie',
              radius: '50%',
              data: weightDistributionData.labels.map((label, index) => ({
                name: label,
                value: weightDistributionData.values[index],
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
              },
            },
          ],
        };
      } else if (type === 'vehicleType') {
        const vehicleTypeData = this.calculateVehicleTypeData();
        option = {
          tooltip: {
            trigger: 'item', // 触发类型为数据项
            formatter: (params) => {
                const { name, value, percent } = params;
                return `${name}: ${value} 辆 (${percent}%)`;
            },
          },
          legend: {
            orient: 'vertical',
            left: 'left',
          },
          series: [
            {
              name: '车辆类型分布',
              type: 'pie',
              radius: '50%',
              data: vehicleTypeData.labels.map((label, index) => ({
                name: label,
                value: vehicleTypeData.values[index],
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
              },
            },
          ],
        };
      }

      this.chartInstance.setOption(option);
    },
    // 计算按小时车流量数据
    calculateTrafficHourData() {
      const trafficCount = {};
      this.data.forEach((item) => {
          const hour = new Date(item.timestamp).getHours();
          if (!trafficCount[hour]) {
          trafficCount[hour] = 0;
          }
          trafficCount[hour]++;
      });

      return {
          labels: Object.keys(trafficCount).map((hour) => `${hour}:00-${hour}:59`), // X 轴标签
          values: Object.values(trafficCount), // Y 轴数值
      };
    },
    // 计算车辆重量分布数据
    calculateWeightDistributionData() {
      const weightRanges = [
        { min: 0, max: 2, label: '0-2 吨' },
        { min: 2, max: 5, label: '2-5 吨' },
        { min: 5, max: 10, label: '5-10 吨' },
        { min: 10, max: 20, label: '10-20 吨' },
        { min: 20, max: Infinity, label: '20 吨以上' },
      ];
      const weightCount = weightRanges.map(() => 0);

      this.data.forEach((item) => {
        const weight = item.weightKg / 1000; // 转换为吨
        weightRanges.forEach((range, index) => {
          if (weight >= range.min && weight < range.max) {
            weightCount[index]++;
          }
        });
      });

      return {
        labels: weightRanges.map((range) => range.label),
        values: weightCount,
      };
    },
    // 计算车辆类型分布数据
    calculateVehicleTypeData() {
      const vehicleTypeCount = {};
      this.data.forEach((item) => {
        const type = item.type;
        if (!vehicleTypeCount[type]) {
          vehicleTypeCount[type] = 0;
        }
        vehicleTypeCount[type]++;
      });

      return {
        labels: Object.keys(vehicleTypeCount),
        values: Object.values(vehicleTypeCount),
      };
    },
    // 计算统计数据
    calculateStats() {
      const data = this.data;
      const totalVehicles = data.length;
      const totalWeight = data.reduce((sum, item) => sum + item.weightKg, 0) / 1000;
      const averageWeight = totalWeight / totalVehicles;
      const maxWeight = Math.max(...data.map((item) => item.weightKg / 1000));

      this.stats = {
        totalVehicles,
        averageWeight,
        totalWeight,
        maxWeight,
      };
    },
  },
};
</script>

<style scoped>
.weight-visualize {
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

.button-group {
  display: flex;
  gap: 0px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}

.stats {
  margin-top: 20px;
  text-align: center;
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

.column-stats {
  margin-bottom: 10px;
}

.range-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
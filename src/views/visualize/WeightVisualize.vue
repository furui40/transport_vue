<template>
  <div class="weight-visualize">
    <div class="container">
      <!-- 左侧：按钮和图像区域 -->
      <div class="left-panel">
        <div class="button-group">
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

      <!-- 右侧：表格 -->
      <div class="right-panel">
        <el-table
          :data="paginatedData"
          border
          style="width: 100%"
          height="500"
          :flexible="true"
        >
          <!-- 固定“时间”列 -->
          <el-table-column prop="timestamp" label="时间" width="180" fixed />
          <!-- 动态列 -->
          <el-table-column
            v-for="(value, key) in filteredColumns"
            :key="key"
            :prop="key"
            :label="getColumnLabel(key)"
            :min-width="getColumnWidth(key)"
          />
        </el-table>
        <el-pagination
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
import * as echarts from 'echarts';
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      chartInstance: null, // ECharts 实例
      currentChart: '', // 当前显示的图表类型
      stats: {
        totalVehicles: 0,
        averageWeight: 0,
        totalWeight: 0,
        maxWeight: 0,
      },
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']), // 从 Vuex 获取列宽和列名
    tableData() {
      // 转换时间
      return this.$store.state.visualize.data.map((item) => {
        return {
          ...item,
        };
      });
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.tableData.slice(start, end);
    },
    filteredColumns() {
      if (this.tableData.length === 0) return {};
      const firstRow = this.tableData[0];
      return Object.keys(firstRow).reduce((obj, key) => {
        if (!['id', 'timestamp'].includes(key)) {
          obj[key] = firstRow[key];
        }
        return obj;
      }, {});
    },
  },
  mounted() {
    this.calculateStats();
  },
  methods: {
    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
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
        console.log(trafficHourData);
        option = {
          tooltip: {
            trigger: 'item', 
            axisPointer: {
                type: 'shadow', 
            },
            formatter: (params) => {
                console.log(params);
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
    this.tableData.forEach((item) => {
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

      this.tableData.forEach((item) => {
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
      this.tableData.forEach((item) => {
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
      const data = this.tableData;
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
  padding: 20px;
}

.container {
  display: flex;
  gap: 20px;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  flex: 2;
  overflow-x: auto; /* 启用横向滚动 */
}

.button-group {
  display: flex;
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

.stats {
  margin-top: 20px;
  text-align: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
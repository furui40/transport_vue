<template>
  <div class="visualization-container">
    <div class="chart-controls">
      <el-button type="warning" @click="toggleChartMode">
        {{ isSmooth ? '折线图' : '平滑曲线' }}
      </el-button>
      <el-button type="success" :disabled="!queryResult" @click="handleDownload">
        下载
      </el-button>
    </div>
    <div class="query-result">
      <div ref="chartContainer"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      queryId: null,
      queryResult: null,
      isSmooth: false,
      chartData: {}
    };
  },
  created() {
    this.queryId = this.$route.query.queryId;
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const response = await axios.get(`/query/results/${this.queryId}`);
        if (response.data.code === 200) {
          this.queryResult = response.data.data;
          this.prepareChartData();
          this.$nextTick(() => this.renderCharts());
        }
      } catch (error) {
        this.$message.error('数据加载失败');
      }
    },
    // 保留原数据准备和图表渲染方法...
    prepareChartData() {
      const chartData = {};

      // 遍历查询结果，按 field 类型分类
      this.queryResult.forEach((item, index) => {
          const time = new Date(item.time).getTime(); // 将时间转换为时间戳
          Object.entries(item.fieldValues).forEach(([field, value]) => {
              if (!chartData[field]) {
                  chartData[field] = [];
              }
                  chartData[field].push([time, value]); // 存储时间和值
          });
      });

      this.chartData = chartData; // 存储分类后的数据
      this.renderCharts(); // 渲染图表
    },
    renderCharts() {
      const chartContainer = this.$refs.chartContainer;
      chartContainer.innerHTML = ''; // 清空容器

      Object.entries(this.chartData).forEach(([field, data]) => {
        const chartDiv = document.createElement('div');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '400px';
        chartContainer.appendChild(chartDiv);

        const chart = echarts.init(chartDiv);

        // 计算数据的最大值和最小值
        const values = data.map(item => item[1]);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // 计算时间范围
        const startTime = data[0][0]; // 数据起始时间
        const endTime = data[data.length - 1][0]; // 数据结束时间
        const totalTimeRange = endTime - startTime; // 总时间范围
        const initialTimeRange = 5000; // 初始显示5秒

        // 设置图表的初始显示范围为前5秒
        const initialEndTime = startTime + initialTimeRange;

        const option = {
          title: {
            text: this.getColumnLabel(field), // 图表标题为 field 名称
            left: 'center',
          },
          tooltip: {
            trigger: 'axis',
          },
          xAxis: {
            type: 'time',
            min: startTime, // 最小时间为数据起始时间
            max: endTime, // 最大时间为数据结束时间
          },
          yAxis: {
            type: 'value',
            min: minValue - (maxValue - minValue) * 0.1, // 动态设置 Y 轴最小值
            max: maxValue + (maxValue - minValue) * 0.1, // 动态设置 Y 轴最大值
          },
          dataZoom: [
            {
              type: 'inside', // 内部缩放
              start: 0,
              end: (initialTimeRange / totalTimeRange) * 100, // 初始显示5秒
            },
            {
              type: 'slider', // 滑动条
              start: 0,
              end: 100, // 滚动条覆盖所有数据
            },
          ],
          series: [
            {
              data: data,
              type: 'line',
              smooth: this.isSmooth, // 根据 isSmooth 状态设置是否平滑
            },
          ],
        };
        chart.setOption(option);
      });
    },
    toggleChartMode() {
      this.isSmooth = !this.isSmooth; // 切换状态
      this.renderCharts(); // 重新渲染图表
    },
    handleDownload() {
      if (!this.queryResult) {
        this.$message.warning('没有可下载的数据');
        return;
      }

      // 将数据转换为Excel格式
      const data = this.queryResult.map(item => {
        const date = new Date(item.time);
        // 格式化时间戳，包含毫秒
        const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
        
        const row = { 时间戳: timestamp };
        Object.entries(item.fieldValues).forEach(([field, value]) => {
          row[this.getColumnLabel(field)] = value;  // 修改这里
        });
        return row;
      });

      // 使用xlsx库生成Excel文件
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, '查询结果.xlsx');
    },
  }
}
</script>

<style scoped>
.visualization-container {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
}

.chart-controls {
  margin-bottom: 20px;
  text-align: right;
}

.query-result {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}
</style>
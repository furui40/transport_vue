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
import axios from 'axios';
import * as echarts from "echarts";
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      queryId: null,
      fieldsOrder: [], 
      userId: null,
      queryResult: null,
      isSmooth: false,
      chartData: {},
      loadingInstance: null
    };
  },
  created() {
    this.queryId = this.$route.query.queryId;
    this.fieldsOrder = this.$route.query.fields?.split(',') || [];
    this.userId = this.$store.state.user.userId;
    if (!this.userId) {
      this.$message.error('用户未登录，请先登录');
      return;
    }
    this.loadData();
  },
  methods: {
    async loadData() {
      this.showLoading();
      try {
        console.log('正在加载数据，queryId:', this.queryId, 'userId:', this.userId);
        
        const baseURL = 'http://localhost:8080';
        const response = await axios.get(`${baseURL}/search/query_result/${this.queryId}`, {
          params: {
            userId: this.userId
          }
        });

        if (response.data.code === 200) {
          console.log('数据加载成功', response.data.data);
          this.queryResult = response.data.data;
          this.prepareChartData();
          this.$nextTick(() => this.renderCharts());
        } else {
          this.$message.error(response.data.message || '数据加载失败');
        }
      } catch (error) {
        console.error('数据加载错误:', error);
        let errorMsg = '数据加载失败';
        if (error.response) {
          errorMsg += `: ${error.response.data.message || error.response.statusText}`;
        } else {
          errorMsg += `: ${error.message}`;
        }
        this.$message.error(errorMsg);
      } finally {
        this.hideLoading();
      }
    },

    showLoading() {
      this.loadingInstance = this.$loading({
        lock: true,
        text: '数据加载中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
    },

    hideLoading() {
      if (this.loadingInstance) {
        this.loadingInstance.close();
      }
    },

    prepareChartData() {
      const chartData = {};
      
      // 按照fieldsOrder的顺序处理数据
      this.fieldsOrder.forEach(field => {
        chartData[field] = [];
      });

      this.queryResult.forEach((item) => {
        const time = new Date(item.time).getTime();
        // 按照fieldsOrder的顺序填充数据
        this.fieldsOrder.forEach(field => {
          if (item.fieldValues[field] !== undefined) {
            if (!chartData[field]) {
              chartData[field] = [];
            }
            chartData[field].push([time, item.fieldValues[field]]);
          }
        });
      });

      this.chartData = chartData;
    },

    renderCharts() {
      const chartContainer = this.$refs.chartContainer;
      chartContainer.innerHTML = ''; // 清空容器

      Object.entries(this.chartData).forEach(([field, data]) => {
        if (!data || data.length === 0) return;

        const chartDiv = document.createElement('div');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '400px';
        chartDiv.style.marginBottom = '20px';
        chartContainer.appendChild(chartDiv);

        const chart = echarts.init(chartDiv);
        
        // 计算数据的最大值和最小值
        const values = data.map(d => d[1]);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const rangePadding = (maxValue - minValue) * 0.1;

        // 计算数据时间范围（毫秒）
        const startTime = data[0][0];
        const endTime = data[data.length - 1][0];
        const totalDuration = endTime - startTime;
        
        // 动态计算初始显示范围
        let initialZoomStart = 0;
        let initialZoomEnd = 20; // 默认显示20%
        
        // 如果20%的时间小于5秒，则按20%显示；否则最多显示5秒数据
        if (totalDuration * 0.2 > 5000) { // 5000毫秒=5秒
          const fiveSecondsRatio = 5000 / totalDuration * 100;
          initialZoomEnd = Math.min(20, fiveSecondsRatio); // 取20%和5秒比例中的较小值
        }

        const option = {
          title: {
            text: this.getColumnLabel(field),
            left: 'center',
            textStyle: {
              fontSize: 14
            }
          },
          tooltip: {
            trigger: 'axis',
            formatter: (params) => {
              const date = new Date(params[0].value[0]);
              // 格式化时间到毫秒
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:` +
                            `${date.getMinutes().toString().padStart(2, '0')}:` +
                            `${date.getSeconds().toString().padStart(2, '0')}.` +
                            `${date.getMilliseconds().toString().padStart(3, '0')}`;
              return `${this.getColumnLabel(field)}<br/>${timeStr}: ${params[0].value[1]}`;
            }
          },
          xAxis: {
            type: 'time',
            axisLabel: {
              formatter: (value) => {
                const date = new Date(value);
                // 横轴标签显示到毫秒
                return `${date.getHours().toString().padStart(2, '0')}:` +
                      `${date.getMinutes().toString().padStart(2, '0')}:` +
                      `${date.getSeconds().toString().padStart(2, '0')}.` +
                      `${date.getMilliseconds().toString().padStart(3, '0')}`;
              }
            }
          },
          yAxis: {
            type: 'value',
            min: minValue - rangePadding,
            max: maxValue + rangePadding
          },
          dataZoom: [
            {
              type: 'inside',
              start: initialZoomStart,
              end: initialZoomEnd
            },
            {
              type: 'slider',
              start: initialZoomStart,
              end: 100,
              handleSize: 8,
              handleStyle: {
                color: '#fff',
                borderColor: '#409EFF',
                borderWidth: 2
              }
            }
          ],
          series: [{
            data: data,
            type: 'line',
            smooth: this.isSmooth,
            symbol: 'none',
            lineStyle: {
              width: 1.5,
              color: '#409EFF'
            },
            emphasis: {
              lineStyle: {
                width: 2
              }
            }
          }]
        };

        chart.setOption(option);
        
        // 窗口大小变化时重新调整图表大小
        window.addEventListener('resize', () => chart.resize());
      });
    },

    toggleChartMode() {
      this.isSmooth = !this.isSmooth;
      this.renderCharts();
    },

    handleDownload() {
      if (!this.queryResult) {
        this.$message.warning('没有可下载的数据');
        return;
      }

      const exportStart = Date.now();
      
      // 准备表头 - 按照fieldsOrder的顺序
      const headers = ['时间戳'];
      this.fieldsOrder.forEach(field => {
        headers.push(this.getColumnLabel(field));
      });

      // 准备数据 - 按照fieldsOrder的顺序
      const data = this.queryResult.map(item => {
        const row = {
          '时间戳': new Date(item.time).toISOString()
        };
        
        // 按照fieldsOrder的顺序添加数据
        this.fieldsOrder.forEach(field => {
          if (item.fieldValues[field] !== undefined) {
            const header = this.getColumnLabel(field);
            row[header] = item.fieldValues[field];
          }
        });
        
        return row;
      });

      // 创建工作表，确保列顺序正确
      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: headers
      });
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '传感器数据');
      
      // 生成文件名包含时间戳
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      XLSX.writeFile(workbook, `传感器数据_${timestamp}.xlsx`);
      
      console.log(`数据导出耗时: ${Date.now() - exportStart}ms`);
    },

    getColumnLabel(field) {
      // 使用正则表达式解析字段格式：解调器_Ch信道_类型 (如 "1_Ch1_ori")
      const match = field.match(/^(\d+)_Ch(\d+)_(ori|act|rev\d+)$/);
      if (!match) return field; // 如果不是标准格式，直接返回原字段
      
      const [_, decoder, channel, type] = match;
      
      // 从 Vuex store 获取传感器名称
      const sensorName = this.$store.getters['table/getChannelName'](decoder, channel);
      
      // 类型映射
      const typeMap = {
        ori: '原始值',
        act: '实际值',
        rev1: '修正值1',
        rev2: '修正值2',
        rev3: '修正值3',
        rev4: '修正值4',
        rev5: '修正值5',
        rev6: '修正值6'
      };
      
      // 获取类型后缀，如"原始值"、"修正值1"等
      const typeSuffix = typeMap[type] || (type.startsWith('rev') ? `修正值${type.slice(3)}` : '');
      
      // 组合最终名称：传感器名 + 类型后缀
      return typeSuffix ? `${sensorName} (${typeSuffix})` : sensorName;
    },
  }
}
</script>

<style scoped>
.visualization-container {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
  max-width: 1800px;
  margin: 0 auto;
}

.chart-controls {
  margin-bottom: 20px;
  text-align: right;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.query-result {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background: #fff;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .visualization-container {
    padding: 10px;
  }
  
  .chart-controls {
    text-align: center;
  }
}
</style>
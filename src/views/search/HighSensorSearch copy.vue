<template>
  <div class="monitor-query">
    <!-- 解调器切换 -->
    <div class="decoder-selector">
      <span class="label">解调器：</span>
      <el-select
        v-model="currentDecoder"
        placeholder="请选择"
        style="width: 120px"
        @change="handleDecoderChange"
      >
        <el-option
          v-for="decoder in decoders"
          :key="decoder"
          :label="`解调器 ${decoder}`"
          :value="decoder"
        />
      </el-select>
    </div>

    <!-- 信道选择表格 -->
    <div class="channel-table">
      <table>
        <tr v-for="row in 4" :key="row">
          <td v-for="col in 8" :key="col">
            <div class="channel-cell">
              <span class="channel-name">{{ getChannelName(currentDecoder, (row - 1) * 8 + col) }}</span>
              <div class="checkbox-group">
                <el-checkbox v-model="selectedFields[currentDecoder][(row - 1) * 8 + col - 1].ori">原始值</el-checkbox>
                <el-checkbox v-model="selectedFields[currentDecoder][(row - 1) * 8 + col - 1].act">实际值</el-checkbox>
                <template v-for="i in getRevisionCount(currentDecoder, (row - 1) * 8 + col)" :key="i">
                  <el-checkbox v-model="selectedFields[currentDecoder][(row - 1) * 8 + col - 1].rev[i - 1]">修正值{{ i }}</el-checkbox>
                </template>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 时间选择 -->
    <div class="time-picker-container">
      <div class="time-picker">
        <el-date-picker
          v-model="startTime"
          type="datetime"
          placeholder="选择开始时间"
          value-format="X"
          style="width: 180px"
        />
        <el-date-picker
          v-model="stopTime"
          type="datetime"
          placeholder="选择结束时间"
          value-format="X"
          style="width: 180px"
        />
      </div>
    </div>

    <!-- 采样间隔设置 -->
    <div class="action-container">
      <div class="action-group">
        <div class="sampling-control">
          <span class="label">采样频率：</span>
          <el-input-number
            v-model="samplingInterval"
            :min="1"
            :max="100"
            controls-position="right"
          />
        </div>
        <div class="button-group">
          <el-button type="primary"  @click="handleQuery">查询</el-button>
          <el-button type="success"  :disabled="!queryResult" @click="handleDownload">下载</el-button>
          <el-button type="warning"  :disabled="!queryResult" @click="toggleChartMode">
            {{ isSmooth ? '折线图' : '平滑曲线' }}
          </el-button>
          <el-button type="info"  @click="handleExportFieldNames">导出数据项名</el-button>
        </div>
      </div>
    </div>
    <!-- 查询结果 -->
    <div class="query-result">
      <div ref="chartContainer"></div> <!-- 图表容器 -->
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import * as echarts from "echarts";
import * as XLSX from 'xlsx'; 

export default {
  data() {
    return {
      decoders: [1, 2, 3, 4], // 解调器列表
      currentDecoder: 1, // 当前选择的解调器
      selectedFields: {
      1: Array.from({ length: 32 }, () => ({ ori: false, act: false, rev: [] })), // 解调器1的信道选择状态
      2: Array.from({ length: 32 }, () => ({ ori: false, act: false, rev: [] })), // 解调器2的信道选择状态
      3: Array.from({ length: 32 }, () => ({ ori: false, act: false, rev: [] })), // 解调器3的信道选择状态
      4: Array.from({ length: 32 }, () => ({ ori: false, act: false, rev: [] })), // 解调器4的信道选择状态
    },
      startTime: null, // 开始时间
      stopTime: null, // 结束时间
      queryResult: null, // 查询结果
      samplingInterval: 10, // 采样间隔，默认每 10 个数据点选择一个
      isSmooth: false, // 是否显示平滑曲线
      chartData: {}, // 图表数据
    };
  },
  computed: {
        ...mapGetters('table', ['getColumnLabel', 'getChannelName']),
    },
  methods: {
    toggleChartMode() {
      this.isSmooth = !this.isSmooth; // 切换状态
      this.renderCharts(); // 重新渲染图表
    },
    // 切换解调器
    handleDecoderChange(decoder) {
      this.currentDecoder = decoder;
    },
    getRevisionCount(decoder, channel) {
    // 根据解调器和信道编号返回修正值数量
        if ((decoder === 1 && (channel === 27 || channel === 28 || channel === 29)) || (decoder === 3 && (channel === 27 || channel === 28 || channel === 29))) return 1;
        if ((decoder === 1 && channel === 25) || (decoder === 3 && channel === 25) || (decoder === 4 && channel === 24)) return 2;
        if ((decoder === 1 && channel === 26) || (decoder === 3 && channel === 26) || (decoder === 4 && channel === 25)) return 4;
        if ((decoder === 1 && channel === 23) || (decoder === 2 && (channel === 22 || channel === 24)) || (decoder === 3 && channel === 23) || (decoder === 4 && channel === 22)) return 6;
        return 0;
    },
    async handleQuery() {
    // 计算时间间隔
      const timeDiff = this.stopTime - this.startTime;
      if (timeDiff > 60) {
        this.$confirm('当前查询间隔超过60秒，继续查询可能导致查询时间过长和图像渲染卡顿，是否继续查询？', '警告', {
          confirmButtonText: '继续查询',
          cancelButtonText: '取消查询',
          type: 'warning'
        }).then(() => {
          this.executeQuery();
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消查询'
          });
        });
      } else {
        this.executeQuery();
      }
    },
    async executeQuery() {
      // 生成查询字段
      const fields = [];
      for (const decoder of this.decoders) {
        this.selectedFields[decoder].forEach((field, index) => {
          const channel = index + 1;
          if (field.ori) {
            fields.push(`${decoder}_Ch${channel}_ori`);
          }
          if (field.act) {
            fields.push(`${decoder}_Ch${channel}_act`);
          }
          field.rev.forEach((rev, i) => {
            if (rev) {
              fields.push(`${decoder}_Ch${channel}_rev${i + 1}`);
            }
          });
        });
      }

      // 检查参数
      if (fields.length === 0) {
        this.$message.warning('请至少选择一个字段');
        return;
      }
      if (!this.startTime || !this.stopTime) {
        this.$message.warning('请选择时间范围');
        return;
      }
      const period = this.stopTime-this.startTime;
      if (period < 0) {
        this.$message.warning('时间范围选择错误');
        return;
      }
      if (fields.length * period / this.samplingInterval > 800) {
        this.$message.warning('查询数据量过多，请减少查询内容或增大采样频率');
        return;
      }
      const userId = this.$store.state.user.userId;
        if (!userId) {
          this.$message.warning('用户未登录，请先登录');
          return;
        }
      // 发送请求
      try {
        const baseURL = 'http://localhost:8080';
        const response = await axios.post(`${baseURL}/search/high_sensor`, null, {
          params: {
            fields: fields.join(','),
            startTime: this.startTime,
            stopTime: this.stopTime,
            userId,
            samplingInterval: this.samplingInterval,
          },
        });

        if (response.data.code === 200) {
          this.queryResult = response.data.data;
          this.$message.success('查询成功');
          this.prepareChartData(); // 处理查询结果，准备图表数据
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.queryResult = null;
        this.$message.error('查询失败: ' + error.message);
      }
    },

    handleExportFieldNames() {
      // 获取用户选择的 field
      const selectedFields = this.getSelectedFields();

      if (selectedFields.length === 0) {
        this.$message.warning('请至少选择一个数据项');
        return;
      }

      // 拼接 field 为字符串
      const fieldNamesString = selectedFields.join(',');

      // 将拼接后的字符串显示在页面中
      this.$alert(`<pre>${fieldNamesString}</pre>`, '导出的数据项名', {
        dangerouslyUseHTMLString: true, // 允许使用 HTML
        showConfirmButton: true,
        confirmButtonText: '复制',
        callback: () => {
          // 点击“复制”按钮后，将内容复制到剪贴板
          this.copyToClipboard(fieldNamesString);
        },
      });
    },

    // 获取用户选择的 field
    getSelectedFields() {
      const fields = [];
      for (const decoder of this.decoders) {
          this.selectedFields[decoder].forEach((field, index) => {
              const channel = index + 1;
              if (field.ori) {
                  fields.push(`${decoder}_Ch${channel}_ori`);
              }
              if (field.act) {
                  fields.push(`${decoder}_Ch${channel}_act`);
              }
              field.rev.forEach((rev, i) => {
                  if (rev) {
                      fields.push(`${decoder}_Ch${channel}_rev${i + 1}`);
                  }
              });
          });
      }
      return fields;
    },

    // 复制内容到剪贴板
    copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.$message.success('已复制到剪贴板');
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
  },
};
</script>

<style scoped>
.monitor-query {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.decoder-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.decoder-selector .label {
  font-size: 14px;
  white-space: nowrap;
}

/* 信道表格优化 */
.channel-table {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.channel-table table {
  width: 100%;
  border-collapse: collapse;
}

.channel-table td {
  border: 1px solid #ebeef5;
  padding: 8px;
  text-align: center;
  width: 12.5%;
}

.channel-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.channel-name {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

/* 时间选择器优化 */
.time-picker-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.time-picker {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 图表容器优化 */
.query-result {
  margin-top: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
}

.action-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sampling-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sampling-control .label {
  white-space: nowrap;
  font-size: 14px;
  color: #606266;
}

.button-group {
  display: flex;
  gap: 10px;
}
</style>

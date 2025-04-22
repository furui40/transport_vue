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

      <!-- 全局快捷选择按钮 -->
      <div class="quick-select-buttons">
        <el-button size="small" type="primary" @click="toggleAllChannels">所有信道</el-button>
        <el-button size="small" type="primary" @click="toggleAllOriginal">所有原始值</el-button>
        <el-button size="small" type="primary" @click="toggleAllActual">所有实际值</el-button>
        <el-button size="small" type="warning" @click="showQueryInstructions">查询说明</el-button>
      </div>
    </div>

    <!-- 查询说明弹窗 -->
    <el-dialog
      v-model="showInstructionsDialog"
      title="查询说明"
      width="600px"
      :before-close="handleClose"
    >
      <div class="instructions-content">
        <h3>查询方法说明：</h3>
        <ol>
          <li>首先选择要查询的解调器</li>
          <li>在表格中选择要查询的信道和值类型（原始值/实际值/修正值）</li>
          <li>设置查询的时间范围</li>
          <li>设置采样频率（1-100之间的整数）</li>
          <li>点击"查询"按钮获取数据</li>
        </ol>
        <p>提示：您可以使用表格右侧的行级快捷按钮或上方的全局快捷按钮快速选择多个信道。</p>
        
        <h3>示例查询：</h3>
        <p>点击下方按钮将自动设置一个示例查询条件：</p>
        <ul>
          <li>选择第一行信道（4-6号）的实际值</li>
          <li>设置时间范围为2024-07-12 12:33:11到2024-07-12 12:33:14</li>
          <li>设置采样频率为10</li>
          <li>自动触发查询</li>
        </ul>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showInstructionsDialog = false">取消</el-button>
          <el-button type="primary" @click="loadExampleQuery">
            加载示例查询
          </el-button>
        </div>
      </template>
    </el-dialog>

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
          <!-- 行级快捷选择 -->
          <td class="row-actions">
            <el-button-group>
              <el-button size="small" @click="toggleRowOriginal(row)">行原始值</el-button>
              <el-button size="small" @click="toggleRowActual(row)">行实际值</el-button>
            </el-button-group>
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
          :disabled="useSimpleTime"
        />
        <el-date-picker
          v-model="stopTime"
          type="datetime"
          placeholder="选择结束时间"
          value-format="X"
          style="width: 180px"
          :disabled="useSimpleTime"
        />
        
        <!-- 简易时间选择 -->
        <div class="simple-time-picker">
          <el-checkbox v-model="useSimpleTime">使用简易时间</el-checkbox>
          <el-date-picker
            v-model="simpleTime"
            type="datetime"
            placeholder="选择中心时间"
            value-format="X"
            style="width: 180px"
            :disabled="!useSimpleTime"
            @change="updateSimpleTimeRange"
          />
        </div>
      </div>
    </div>

        <!-- 自定义fields选择 -->
    <div class="custom-fields-container">
      <el-checkbox v-model="useCustomFields">使用自定义fields</el-checkbox>
      <el-input
        v-model="customFields"
        placeholder="请输入自定义fields，格式如:1_Ch1_ori,1_Ch2_act"
        @blur="validateCustomFields"
        :disabled="!useCustomFields"
      />
      <span v-if="fieldError" class="error-message">{{ fieldError }}</span>
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
import { ElMessageBox } from 'element-plus';

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
      showInstructionsDialog: false, // 是否显示查询说明弹窗
      useCustomFields: false, // 是否使用自定义fields
      customFields: '', // 自定义fields
      useSimpleTime: false, // 是否使用简易时间选择
      simpleTime: null, // 简易时间选择的值
      fieldError: '', // 自定义fields验证错误信息
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnLabel', 'getChannelName', 'isValidChannel']),
  },
  methods: {
    handleClose(done) {
      ElMessageBox.confirm('确定要关闭查询说明吗？')
        .then(() => {
          done();
        })
        .catch(() => {
          // 取消关闭
        });
    },

    showQueryInstructions() {
      this.showInstructionsDialog = true;
      console.log('showInstructionsDialog:', this.showInstructionsDialog);
    },
    
    loadExampleQuery() {
      // 关闭弹窗
      this.showInstructionsDialog = false;
      
      // 选择第一行(4-6号信道)的实际值
      for (let i = 3; i < 6; i++) {
        this.selectedFields[this.currentDecoder][i].act = true;
      }
      
      // 设置时间范围
      this.startTime = Math.floor(new Date('2024-07-12 12:33:11').getTime() / 1000);
      this.stopTime = Math.floor(new Date('2024-07-12 12:33:14').getTime() / 1000);
      
      // 设置采样频率
      this.samplingInterval = 10;
      
      // 自动触发查询
      this.$nextTick(() => {
        this.handleQuery();
      });
    },

    // 切换解调器
    handleDecoderChange(decoder) {
      this.currentDecoder = decorder;
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
    
    // 验证自定义fields
    validateCustomFields() {
      if (!this.useCustomFields) {
        this.fieldError = '';
        return true;
      }

      const fields = this.customFields.split(/[\n,]/).map(f => f.trim()).filter(f => f);
      
      if (fields.length === 0) {
        this.fieldError = '请填写至少一个数据项名称';
        return false;
      }
      
      for (const field of fields) {
        if (!this.isValidChannel(field)) {
          this.fieldError = `无效的数据项名称: ${field}`;
          return false;
        }
      }
      
      this.fieldError = '';
      return true;
    },

    async executeQuery() {
      // 验证fields
      if (this.useCustomFields && !this.validateCustomFields()) {
        this.$message.warning(this.fieldError || '请检查自定义fields格式');
        return;
      }

      // 生成查询字段
      let fields = [];
      
      if (this.useCustomFields) {
        // 使用自定义fields
        fields = this.customFields.split(',').map(f => f.trim()).filter(f => f);
      } else {
        // 使用表格选择的fields
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
          // 获取服务器生成的唯一查询ID
          const queryId = response.data.data;
          // 打开新标签页并传递查询ID
          const routeData = this.$router.resolve({
            path: '/visualize/highsensor',
            query: { 
            queryId,
            fields: fields.join(',') // 添加fields参数
          }
          });
          window.open(routeData.href, '_blank');
        }
      } catch (error) {
        this.queryResult = null;
        this.$message.error('查询失败: ' + error.message);
      }
    },

    // 更新简易时间选择的范围
    updateSimpleTimeRange() {
      if (this.simpleTime) {
        this.startTime = parseInt(this.simpleTime) - 6;
        this.stopTime = parseInt(this.simpleTime) + 6;
      }
    },

    handleExportFieldNames() {
      // 获取用户选择的 field
      const selectedFields = this.useCustomFields 
        ? this.customFields.split(',').map(f => f.trim()).filter(f => f)
        : this.getSelectedFields();

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
          // 点击"复制"按钮后，将内容复制到剪贴板
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

    toggleAllChannels() {
      const currentFields = this.selectedFields[this.currentDecoder];
      const allSelected = currentFields.every(field => field.ori && field.act);
      
      currentFields.forEach(field => {
        field.ori = !allSelected;
        field.act = !allSelected;
        field.rev = field.rev.map(() => !allSelected);
      });
    },
    
    // 切换当前解调器所有原始值
    toggleAllOriginal() {
      const currentFields = this.selectedFields[this.currentDecoder];
      const allSelected = currentFields.every(field => field.ori);
      
      currentFields.forEach(field => {
        field.ori = !allSelected;
      });
    },
    
    // 切换当前解调器所有实际值
    toggleAllActual() {
      const currentFields = this.selectedFields[this.currentDecoder];
      const allSelected = currentFields.every(field => field.act);
      
      currentFields.forEach(field => {
        field.act = !allSelected;
      });
    },
    
    // 切换行内所有原始值
    toggleRowOriginal(row) {
      const startIdx = (row - 1) * 8;
      const endIdx = startIdx + 8;
      const currentFields = this.selectedFields[this.currentDecoder].slice(startIdx, endIdx);
      const allSelected = currentFields.every(field => field.ori);
      
      for (let i = startIdx; i < endIdx; i++) {
        this.selectedFields[this.currentDecoder][i].ori = !allSelected;
      }
    },
    
    // 切换行内所有实际值
    toggleRowActual(row) {
      const startIdx = (row - 1) * 8;
      const endIdx = startIdx + 8;
      const currentFields = this.selectedFields[this.currentDecoder].slice(startIdx, endIdx);
      const allSelected = currentFields.every(field => field.act);
      
      for (let i = startIdx; i < endIdx; i++) {
        this.selectedFields[this.currentDecoder][i].act = !allSelected;
      }
    },
  },
  watch: {
    useSimpleTime(newVal) {
      if (newVal && this.simpleTime) {
        this.updateSimpleTimeRange();
      }
    }
  }
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

/* 自定义fields选择 */
.custom-fields-container {
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-fields-container .el-input {
  flex: 1;
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
  align-items: center;
}

/* 简易时间选择 */
.simple-time-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 20px;
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

.decoder-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.quick-select-buttons {
  margin-left: 16px;
  display: flex;
  gap: 8px;
}

.channel-table table {
  width: 100%;
  border-collapse: collapse;
  position: relative;
}

.instructions-content {
  line-height: 1.6;
}

.instructions-content h3 {
  margin-top: 15px;
  margin-bottom: 10px;
  color: #409EFF;
}

.instructions-content ol, .instructions-content ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

.dialog-footer {
  text-align: right;
}
</style>
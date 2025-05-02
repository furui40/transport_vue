<template> 
  <div class="simple-high-sensor">
    <!-- 参数选择区域 -->
    <div class="param-selectors">
      <el-select v-model="selectedDecoder" placeholder="解调器" class="custom-select">
        <el-option v-for="d in 4" :key="d" :label="`解调器 ${d}`" :value="d" />
      </el-select>

      <el-select v-model="selectedChannel" placeholder="信道" class="custom-select">
        <el-option 
          v-for="c in channelOptions" 
          :key="c.value" 
          :label="c.label" 
          :value="c.value" 
        />
      </el-select>

      <el-select v-model="valueType" placeholder="值类型" class="custom-select">
        <el-option label="原始值" value="ori" />
        <el-option label="实际值" value="act" />
        <el-option 
          v-for="i in 6" 
          v-if="showRevisionOptions"
          :key="i" 
          :label="`修正值${i}`" 
          :value="`rev${i}`" 
        />
      </el-select>
    </div>

    <!-- 时间选择 -->
    <div class="time-picker">
      <el-date-picker
        v-model="centerTime"
        type="datetime"
        placeholder="选择中心时间"
        value-format="X"
        class="custom-date-picker"
        @change="handleTimeChange"
      />
      <span class="time-range">
        {{ formattedStartTime }} - {{ formattedEndTime }}
      </span>
    </div>

    <!-- 采样间隔和查询按钮 -->
    <div class="sampling-query-container">
      <div class="sampling-selector">
        <span class="label">采样间隔：</span>
        <el-input-number
          v-model="samplingInterval"
          :min="1"
          :max="100"
          class="custom-input-number"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" class="custom-button" @click="handleQuery">查询</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import table from '@/store/modules/table'

export default {
  data() {
    return {
      selectedDecoder: 1,
      selectedChannel: 1,
      valueType: 'ori',
      centerTime: null,
      samplingInterval: 10,
      channelNames: table.state.channelNames // 从table.js导入channelNames
    }
  },
  computed: {
    formattedStartTime() {
      return this.centerTime ? this.formatTime(Number(this.centerTime) - 6) : ''
    },
    formattedEndTime() {
      return this.centerTime ? this.formatTime(Number(this.centerTime) + 6) : ''
    },
    channelOptions() {
      const decoder = this.selectedDecoder
      if (!this.channelNames[decoder]) return []
      
      return Object.entries(this.channelNames[decoder]).map(([value, label]) => ({
        value: Number(value),
        label
      }))
    },
    showRevisionOptions() {
      const decoder = this.selectedDecoder
      const channel = this.selectedChannel
      const channelName = this.channelNames[decoder]?.[channel] || ''
      return channelName.includes('ZYB')
    }
  },
  watch: {
    selectedDecoder() {
      // 当解调器变化时，重置选中的信道为第一个可用信道
      const decoder = this.selectedDecoder
      if (this.channelNames[decoder]) {
        const firstChannel = Object.keys(this.channelNames[decoder])[0]
        this.selectedChannel = Number(firstChannel)
      }
    },
    selectedChannel() {
      // 当信道变化时，如果新信道不包含ZYB，则重置值类型为ori
      if (!this.showRevisionOptions && this.valueType.startsWith('rev')) {
        this.valueType = 'ori'
      }
    }
  },
  methods: {
    handleTimeChange(val) {
      this.centerTime = val ? Number(val) : null
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp * 1000)
      if (isNaN(date.getTime())) return ''
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    },
    async handleQuery() {
      try {
        const userId = this.$store.state.user.userId
        if (!userId) {
          this.$message.warning('用户未登录，请先登录')
          return
        }
        const centerTime = this.centerTime ? Number(this.centerTime) : Math.floor(Date.now() / 1000)
        const startTime = centerTime - 6
        const stopTime = centerTime + 6
        const fieldStr = `${this.selectedDecoder}_Ch${this.selectedChannel}_${this.valueType}`

        const queryRes = await axios.post('/api/search/high_sensor', null, {
          params: {
            fields: fieldStr,
            startTime,
            stopTime,
            userId,
            samplingInterval: this.samplingInterval
          }
        })

        if (queryRes.data.code === 200) {
            const queryId = queryRes.data.data;
            const routeData = this.$router.resolve({
            path: '/visualize/highsensor',
            query: { 
            queryId,
            fields: [fieldStr]
            }
            });
            window.open(routeData.href, '_blank');
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.simple-high-sensor {
  padding: 15px;
}

.param-selectors,
.time-picker,
.sampling-query-container {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.sampling-query-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sampling-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-select {
  width: 180px;
}

.custom-select :deep(.el-input__inner) {
  height: 36px;
  line-height: 36px;
  font-size: 14px;
}

.custom-select :deep(.el-input__icon) {
  line-height: 36px;
}

.custom-date-picker {
  width: 220px;
}

.custom-date-picker :deep(.el-input__inner) {
  height: 36px;
  line-height: 36px;
  font-size: 14px;
}

.custom-input-number {
  width: 120px;
}

.custom-input-number :deep(.el-input__inner) {
  height: 36px;
  line-height: 36px;
  font-size: 14px;
}

.custom-button {
  padding: 10px 20px;
  font-size: 14px;
}

.time-range {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
}

.label {
  font-size: 14px;
  color: #606266;
}
</style>
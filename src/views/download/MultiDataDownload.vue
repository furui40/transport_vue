<template>
  <div class="multi-data-download">
    <h2>数据表下载(如需高频传感器数据下载，请前往下载管理页面申请)</h2>

    <!-- 数据表选择区域 -->
    <div class="data-type-selection">
      <div v-for="dataType in dataTypes" :key="dataType.value" class="data-type-item">
        <el-checkbox 
          v-model="selectedDataTypes" 
          :label="dataType.value"
          @change="handleDataTypeChange(dataType.value)"
        >
          {{ dataType.label }}
        </el-checkbox>
        
        <el-button
          v-if="dataType.requiresPoints"
          size="small"
          @click="openPointDialog(dataType.value)"
        >
          选择测点
        </el-button>
        
        <span v-if="selectedPoints[dataType.value]?.length" class="selected-points">
          (已选{{ selectedPoints[dataType.value].length }}个测点)
        </span>
      </div>
    </div>

    <!-- 时间选择 -->
    <div class="time-range">
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

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="handleQuery">开始查询</el-button>
    </div>

    <!-- 测点选择对话框 -->
    <el-dialog v-model="showPointDialog" :title="`选择测点 - ${currentDataTypeLabel}`">
      <el-table
        :data="currentPoints"
        height="400"
        @selection-change="handlePointSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="测点ID" />
      </el-table>
      <template #footer>
        <el-button @click="showPointDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSelectedPoints">确认</el-button>
      </template>
    </el-dialog>

    <!-- 下载区域 -->
    <div v-if="queryResults" class="download-section">
      <div class="download-list">
        <div v-for="(data, dataType) in queryResults" :key="dataType" class="download-item">
          <span class="data-type-label">{{ getDataTypeLabel(dataType) }}</span>
          <span class="data-count">共 {{ data.length }} 条</span>
          <el-button 
            type="success" 
            size="small"
            @click="downloadSingle(dataType)"
          >
            下载
          </el-button>
        </div>
      </div>
      
      <el-button 
        type="primary" 
        class="download-all"
        @click="downloadAll"
      >
        全部下载 (ZIP压缩包)
      </el-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { mapGetters } from 'vuex';

export default {
  data() {
    // 测点数据生成函数
    const generatePoints = (prefix, start, end) => 
      Array.from({ length: end - start + 1 }, (_, i) => ({
        id: `${prefix}-${String(start + i).padStart(2, '0')}`
      }))

    return {
      dataTypes: [
        { label: '动态称重数据', value: 'dynamicWeighing', requiresPoints: false },
        { label: '气象数据', value: 'weather', requiresPoints: false },
        { label: '沉降数据(mm)', value: 'subside', requiresPoints: true },
        { label: '孔隙水压力(Mpa)', value: 'waterPressure', requiresPoints: true },
        { label: '温湿度(℃,%RH)', value: 'humiture', requiresPoints: true },
      ],
      selectedDataTypes: [],
      selectedPoints: {
        subside: [],
        waterPressure: [],
        humiture: [],
      },
      tempSelectedPoints: [],
      startTime: null,
      stopTime: null,
      showPointDialog: false,
      currentDataTypeForPoints: '',
      queryResults: null,
      
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
    }
  },

  computed: {
    ...mapGetters('table', ['getColumnLabel']),
    currentPoints() {
      switch (this.currentDataTypeForPoints) {
        case 'subside': return this.subsidePoints
        case 'waterPressure': return this.waterPressurePoints
        case 'humiture': return this.humiturePoints
        default: return []
      }
    },

    currentDataTypeLabel() {
      return this.dataTypes.find(t => t.value === this.currentDataTypeForPoints)?.label || ''
    }
  },

  methods: {
    // 数据类型选择变化处理
    handleDataTypeChange(dataType) {
      if (!this.selectedDataTypes.includes(dataType)) {
        this.selectedPoints[dataType] = []
      }
    },

    // 打开测点选择对话框
    openPointDialog(dataType) {
      this.currentDataTypeForPoints = dataType
      this.tempSelectedPoints = [...this.selectedPoints[dataType]]
      this.showPointDialog = true
    },

    // 测点选择变化处理
    handlePointSelectionChange(selection) {
      this.tempSelectedPoints = selection.map(item => item.id)
    },

    // 保存选择的测点
    saveSelectedPoints() {
    this.selectedPoints[this.currentDataTypeForPoints] = this.tempSelectedPoints
    this.showPointDialog = false
    },

    // 获取API端点
    getEndpoint(dataType) {
      const endpoints = {
        dynamicWeighing: '/search/dynamicWeighing',
        weather: '/search/weather',
        subside: '/search/subside',
        waterPressure: '/search/waterPressure',
        humiture: '/search/humiture'
      }
      return `/api${endpoints[dataType]}`
    },

    processData(data, dataType) {
    return data.map(item => {
        const processedItem = {
        timestamp: this.convertToLocalTime(item.timestamp)
        }
        
        // 处理动态称重和气象数据（没有fieldValues）
        if (['dynamicWeighing', 'weather'].includes(dataType)) {
        Object.keys(item).forEach(key => {
            if (key !== 'timestamp' && key !== 'fieldValues') {
            processedItem[key] = item[key]
            }
        })
        } 
        // 处理有fieldValues的数据类型
        else if (item.fieldValues) {
        Object.entries(item.fieldValues).forEach(([key, value]) => {
            if (dataType === 'humiture') {
            // 温湿度数据特殊处理，拆分成两列
            const [baseId, fieldType] = key.split('_')
            processedItem[`${baseId}_${fieldType}`] = value
            } else {
            // 沉降和孔隙水压力直接使用测点ID作为列名
            processedItem[key] = value
            }
        })
        }
        
        return processedItem
    })
    },

// 处理动态称重数据列顺序
  sortDynamicWeighingColumns(data) {
    if (!data.length) return data
    
    // 定义动态称重数据的列顺序
    const dynamicWeighingColumnOrder = [
      'timestamp',
      'weightKg',
      'vehicleLength',
      'lane',
      'axleCount',
      'speed',
      'temperature',
      'direction',
      'crossLane',
      'type',
      'axleWeight1',
      'axleWeight2',
      'axleWeight3',
      'axleWeight4',
      'axleWeight5',
      'axleWeight6',
      'wheelbase1',
      'wheelbase2',
      'wheelbase3',
      'wheelbase4',
      'wheelbase5',
      'vehicleTypeCode',
      'vehicleType',
      'axle1Kn',
      'axle2Kn',
      'axle3Kn',
      'offset'
    ]
    
    return data.map(item => {
      const sortedItem = {}
      
      // 按照定义的顺序添加列，只包含实际存在的列
      dynamicWeighingColumnOrder.forEach(key => {
        if (item.hasOwnProperty(key)) {
          sortedItem[key] = item[key]
        }
      })
      
      return sortedItem
    })
  },

  // 处理气象数据列顺序
  sortWeatherColumns(data) {
    if (!data.length) return data
    
    // 定义气象数据的列顺序
    const weatherColumnOrder = [
      'timestamp',
      'ambientTemperature',
      'temperature1',
      'dewPointTemperature',
      'ambientHumidity',
      'airPressure',
      'totalRadiation1Instant',
      'uvradiationInstant',
      'windDirection',
      'instantWindSpeed',
      'windSpeed2Min',
      'windSpeed10Min',
      'rainfallIntervalAccumulated',
      'rainfallDailyAccumulated',
      'totalRadiation1DailyAccumulated',
      'uvradiationDailyAccumulated',
      'illuminance',
      'voltage'
    ]
    
    return data.map(item => {
      const sortedItem = {}
      
      // 按照定义的顺序添加列，只包含实际存在的列
      weatherColumnOrder.forEach(key => {
        if (item.hasOwnProperty(key)) {
          sortedItem[key] = item[key]
        }
      })
      
      return sortedItem
    })
  },

    sortColumns(data) {
        if (!data.length) return data
        
        return data.map(item => {
            const sortedItem = { timestamp: item.timestamp }
            
            // 获取除timestamp外的所有列名并排序
            const otherKeys = Object.keys(item)
            .filter(key => key !== 'timestamp')
            .sort()
            
            // 按排序后的顺序添加列
            otherKeys.forEach(key => {
            sortedItem[key] = item[key]
            })
            
            return sortedItem
        })
    },

    // 执行查询
    async handleQuery() {
      if (!this.startTime || !this.stopTime) {
        this.$message.warning('请选择完整的时间范围')
        return
      }

      if (this.startTime >= this.stopTime) {
        this.$message.warning('结束时间必须晚于开始时间')
        return
      }

      if (this.selectedDataTypes.length === 0) {
        this.$message.warning('请至少选择一个数据类型')
        return
      }

      if (this.stopTime - this.startTime > 30 * 24 * 60 * 60) {
        this.$message.warning('查询时间范围不能超过30天')
        return
      }

      const userId = this.$store.state.user.userId
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }

      const results = {}
      const requests = []

      for (const dataType of this.selectedDataTypes) {
        // 验证需要测点的类型是否选择了测点
        if (this.dataTypes.find(t => t.value === dataType).requiresPoints && 
           this.selectedPoints[dataType].length === 0) {
          this.$message.warning(`请为${this.getDataTypeLabel(dataType)}选择测点`)
          return
        }

        // 构建请求参数
        const params = {
          startTime: this.startTime,
          stopTime: this.stopTime,
          userId
        }

        if (this.selectedPoints[dataType]?.length > 0) {
          params.fields = this.selectedPoints[dataType].join(',')
        }

        // 创建请求
        requests.push(
            axios.post(this.getEndpoint(dataType), null, { params })
                .then(response => {
                if (response.data.code === 200) {
                    const processedData = response.data.data.map(item => ({
                    ...item,
                    timestamp: this.convertToLocalTime(item.timestamp),
                    ...(item.fieldValues && this.processFieldValues(item.fieldValues, dataType))
                    }))
                    results[dataType] = processedData
                }
                })
                .catch(error => {
                console.error(`${dataType}查询失败:`, error)
                this.$message.error(`${this.getDataTypeLabel(dataType)}查询失败`)
                })
            )
      }

        try {
          await Promise.all(requests)
          
          console.log('查询结果:', results)

          Object.keys(results).forEach(dataType => {
            results[dataType] = this.processData(results[dataType], dataType)
            
            // 根据数据类型应用不同的列排序逻辑
            if (dataType === 'dynamicWeighing') {
              results[dataType] = this.sortDynamicWeighingColumns(results[dataType])
            } else if (dataType === 'weather') {
              results[dataType] = this.sortWeatherColumns(results[dataType])
            } else {
              // 其他数据类型保持原来的排序逻辑
              results[dataType] = this.sortColumns(results[dataType])
            }
          })
          
          this.queryResults = results
          this.$message.success('查询完成')
        } catch {
          this.$message.error('部分数据查询失败，请检查控制台')
        }
    },

    // 处理字段值展开
    processFieldValues(fieldValues, dataType) {
      const processed = {}
      Object.entries(fieldValues).forEach(([key, value]) => {
        if (dataType === 'humiture') {
          const [baseId, type] = key.split('_')
          processed[`${baseId}_${type}`] = value
        } else {
          processed[key] = value
        }
      })
      return processed
    },

    // 时间戳转换
    convertToLocalTime(utcTime) {
      const date = new Date(utcTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 获取数据类型标签
    getDataTypeLabel(dataType) {
      return this.dataTypes.find(t => t.value === dataType)?.label || dataType
    },

    // 单个下载
    downloadSingle(dataType) {
      const data = this.queryResults[dataType]
      if (!data || data.length === 0) return

      // 准备要导出的数据
      const exportData = data.map(item => {
        const exportItem = {}
        Object.keys(item).forEach(key => {
          // 转换列名为中文
          exportItem[this.getColumnLabel(key)] = item[key]
        })
        return exportItem
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '数据')
      XLSX.writeFile(workbook, `${this.getDataTypeLabel(dataType)}.xlsx`)
    },

    // 全部下载
    async downloadAll() {
      if (!this.queryResults) return

      const zip = new JSZip()
      const promises = []

      Object.entries(this.queryResults).forEach(([dataType, data]) => {
        if (data.length === 0) return

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, '数据')
        const excelData = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
        zip.file(`${this.getDataTypeLabel(dataType)}.xlsx`, excelData, { binary: true })
      })

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, '综合数据下载包.zip')
    }
  }
}
</script>

<style scoped>
.multi-data-download {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.data-type-selection {
  margin: 20px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.data-type-item {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.data-type-item > * {
  margin-right: 15px;
}

.selected-points {
  color: #909399;
  font-size: 0.9em;
}

.time-range {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  justify-content: center;
}

.action-buttons {
  text-align: center;
  margin: 20px 0;
}

.download-section {
  margin-top: 30px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.download-list {
  margin-bottom: 20px;
}

.download-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin: 8px 0;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.data-type-label {
  font-weight: 500;
}

.data-count {
  color: #909399;
  margin: 0 15px;
}

.download-all {
  width: 100%;
  margin-top: 20px;
}
</style>
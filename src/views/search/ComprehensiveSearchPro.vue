<template>
  <div class="comprehensive-search-and-visualize">
    <!-- 加粗标题 -->
    <div class="title">
      <h2>综合数据查询与可视化</h2>
    </div>

    <!-- 数据选择、时间选择和查询按钮 -->
    <div class="query-controls">
      <!-- 数据选择 -->
      <div class="data-select">
        <el-select v-model="selectedDataType" placeholder="请选择数据类型">
          <el-option label="动态称重数据" value="dynamicWeighing" />
          <el-option label="气象数据" value="weather" />
          <el-option label="沉降数据(mm)" value="subside" />
          <el-option label="孔隙水压力(Mpa)" value="waterPressure" />
          <el-option label="温湿度(℃,%RH)" value="humiture" />
        </el-select>
      </div>

      <!-- 测点选择按钮 -->
      <div class="point-select-button" 
           v-if="['subside', 'waterPressure', 'humiture'].includes(selectedDataType)">
        <el-button type="primary" @click="showPointDialog = true">选择测点</el-button>
      </div>

      <!-- 时间选择 -->
      <div class="time-picker">
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

      <!-- 查询按钮和下载按钮 -->
      <div class="button-group">
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button
          type="success"
          :disabled="!tableData.length"
          @click="handleDownload"
        >
          下载
        </el-button>
      </div>
    </div>

    <!-- 测点选择弹窗 -->
    <el-dialog
      v-model="showPointDialog"
      title="选择测点"
      width="50%"
    >
      <!-- 测点表格 -->
      <el-table
        ref="pointTable"
        :data="currentPoints"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <!-- 多选框列 -->
        <el-table-column type="selection" width="55" />
        <!-- 测点ID列 -->
        <el-table-column prop="id" label="测点ID" />
      </el-table>

      <template #footer>
        <el-button @click="showPointDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePointConfirm">确认</el-button>
      </template>
    </el-dialog>

  <!-- 可视化卡片区域 -->
  <div class="visualization-cards">
    <!-- 卡片1 -->
    <div class="visualization-card">
      <div class="card-header">
        <el-select v-model="card1Type" placeholder="选择数据类型" @change="updateCard(1)">
          <el-option label="动态称重数据" value="dynamicWeighing" />
          <el-option label="气象数据" value="weather" />
          <el-option label="沉降数据(mm)" value="subside" />
          <el-option label="孔隙水压力(Mpa)" value="waterPressure" />
          <el-option label="温湿度(℃,%RH)" value="humiture" />
        </el-select>
        <div class="card-actions">
          <el-button 
            v-if="card1Type === 'dynamicWeighing'"
            type="success"
            @click="card1ShowTable = !card1ShowTable"
          >
            {{ card1ShowTable ? '显示图表' : '显示表格' }}
          </el-button>
        </div>
      </div>
      <div class="card-content">
        <component 
          v-if="!card1ShowTable || card1Type !== 'dynamicWeighing'"
          :is="getVisualizationComponent(card1Type)" 
          :data="getCardData(1)"
          :key="'card1-' + card1Type + card1Key"
        />
        <template v-if="card1ShowTable && card1Type === 'dynamicWeighing'">
          <div class="table-container">
            <el-table
              :data="getPaginatedData(1)"
              border
              style="width: 100%"
            >
              <el-table-column prop="timestamp" label="时间" width="180" fixed />
              <el-table-column
                v-for="(value, key) in getDynamicColumns(getCardData(1))"
                :key="key"
                :prop="key"
                :label="getColumnLabel(key)"
                :min-width="getColumnWidth(key)"
              />
            </el-table>
          </div>
          <el-pagination
            small
            layout="total, prev, pager, next, jumper"
            :total="getCardData(1).length"
            :page-size="pageSize"
            :current-page="card1Page"
            @current-change="(val) => card1Page = val"
          />
        </template>
      </div>
    </div>

    <!-- 卡片2 -->
    <div class="visualization-card">
      <div class="card-header">
        <el-select v-model="card2Type" placeholder="选择数据类型" @change="updateCard(2)">
          <el-option label="高频传感器数据" value="highSensor" />
          <el-option label="动态称重数据" value="dynamicWeighing" />
          <el-option label="气象数据" value="weather" />
          <el-option label="沉降数据(mm)" value="subside" />
          <el-option label="孔隙水压力(Mpa)" value="waterPressure" />
          <el-option label="温湿度(℃,%RH)" value="humiture" />
        </el-select>
        <div class="card-actions">
          <el-button 
            v-if="card2Type === 'dynamicWeighing'"
            type="success"
            @click="card2ShowTable = !card2ShowTable"
          >
            {{ card2ShowTable ? '显示图表' : '显示表格' }}
          </el-button>
        </div>
      </div>
      <div class="card-content">
        <!-- 高频传感器数据特殊处理 -->
        <template v-if="card2Type === 'highSensor'">
          <SimpleHighSensor :user-id="userId" />
        </template>
        
        <!-- 其他数据类型处理 -->
        <template v-else>
          <!-- 图表展示 -->
          <component 
            v-if="!card2ShowTable || card2Type !== 'dynamicWeighing'"
            :is="getVisualizationComponent(card2Type)" 
            :data="getCardData(2)"
            :key="'card2-' + card2Type + card2Key"
          />
          
          <!-- 动态称重数据表格展示 -->
          <template v-if="card2ShowTable && card2Type === 'dynamicWeighing'">
            <div class="table-container">
              <el-table
                :data="getPaginatedData(2)"
                border
                style="width: 100%"
                height="100%"
              >
                <el-table-column prop="timestamp" label="时间" width="180" fixed />
                <el-table-column
                  v-for="(value, key) in getDynamicColumns(getCardData(2))"
                  :key="key"
                  :prop="key"
                  :label="getColumnLabel(key)"
                  :min-width="getColumnWidth(key)"
                />
              </el-table>
            </div>
            <el-pagination
              small
              layout="total, prev, pager, next, jumper"
              :total="getCardData(2).length"
              :page-size="pageSize"
              :current-page="card2Page"
              @current-change="(val) => card2Page = val"
            />
          </template>
        </template>
      </div>
    </div>

  </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import * as XLSX from 'xlsx';
import WeightVisualize from '../visualize/WeightVisualize.vue';
import WeatherVisualize from '../visualize/WeatherVisualize.vue';
import SubsideVisualize from '../visualize/SubsideVisualize.vue';
import DefaultVisualize from '../visualize/Default.vue';
import SimpleHighSensor from './SimpleHighSensor.vue';

export default {
  components: {
    WeightVisualize,
    WeatherVisualize,
    SubsideVisualize,
    DefaultVisualize,
    SimpleHighSensor,
  },
  data() {
    // 生成测点数据
    const generatePoints = (prefix, start, end) => 
      Array.from({ length: end - start + 1 }, (_, i) => ({
        id: `${prefix}-${String(start + i).padStart(2, '0')}`
      }));

    return {
      selectedDataType: 'dynamicWeighing',
      startTime: null,
      stopTime: null,
      tableData: [],
      selectedPoints: [],
      showPointDialog: false,
      
      // 卡片配置
      card1Type: 'dynamicWeighing',
      card2Type: 'highSensor',
      card1Key: 0,
      card2Key: 0,
      card1ShowTable: true,
      card2ShowTable: false,
      card1Page: 1,
      card2Page: 1,
      pageSize: 10,
      cardData: {
        dynamicWeighing: [],
        weather: [],
        subside: [],
        waterPressure: [],
        humiture: []
      },
      
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
    };
  },
  watch: {
    selectedDataType() {
      this.tableData = [];
      this.selectedPoints = [];
    },
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']),
    currentPoints() {
      switch (this.selectedDataType) {
        case 'subside': return this.subsidePoints;
        case 'waterPressure': return this.waterPressurePoints;
        case 'humiture': return this.humiturePoints;
        default: return [];
      }
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.selectedPoints = selection.map(point => point.id);
    },
    handlePointConfirm() {
      this.showPointDialog = false;
    },
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
    getVisualizationComponent(type) {
      const visualComponents = {
        dynamicWeighing: 'WeightVisualize',
        weather: 'WeatherVisualize',
        subside: 'SubsideVisualize',
        waterPressure: 'SubsideVisualize',
        humiture: 'SubsideVisualize'
      };
      return visualComponents[type] || 'DefaultVisualize';
    },
    getCardData(cardNumber) {
      const type = cardNumber === 1 ? this.card1Type : this.card2Type;
      return this.cardData[type] || [];
    },
    updateCard(cardNumber) {
      if (cardNumber === 1) {
        this.card1Key += 1;
      } else {
        this.card2Key += 1;
      }
    },
    refreshCard(cardNumber) {
      if (cardNumber === 1) {
        this.card1Key += 1;
      } else {
        this.card2Key += 1;
      }
    },
    getDynamicColumns(data) {
      if (!data || data.length === 0) return {};
      const dynamicColumns = new Set();
      data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'timestamp') dynamicColumns.add(key);
        });
      });
      return Array.from(dynamicColumns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
    },
    getPaginatedData(cardNumber) {
      const data = cardNumber === 1 ? this.getCardData(1) : this.getCardData(2);
      const page = cardNumber === 1 ? this.card1Page : this.card2Page;
      const start = (page - 1) * this.pageSize;
      return data.slice(start, start + this.pageSize);
    },
    async handleQuery() {
      if (!this.startTime || !this.stopTime) {
        this.$message.warning('请选择时间范围');
        return;
      }
      if (['subside', 'waterPressure', 'humiture'].includes(this.selectedDataType)) {
        if (this.selectedPoints.length === 0) {
          this.$message.warning('请至少选择一个测点');
          return;
        }
        if(this.stopTime-this.startTime <= 0){
          this.$message.warning('结束时间需大于开始时间');
          return;
        }
      }

      const userId = this.$store.state.user.userId;
      if (!userId) {
        this.$message.warning('用户未登录，请先登录');
        return;
      }

      try {
        const endpoints = {
          dynamicWeighing: '/search/dynamicWeighing',
          weather: '/search/weather',
          subside: '/search/subside',
          waterPressure: '/search/waterPressure',
          humiture: '/search/humiture'
        };

        const params = {
          startTime: this.startTime,
          stopTime: this.stopTime,
          userId,
          ...(['subside', 'waterPressure', 'humiture'].includes(this.selectedDataType) && {
            fields: this.selectedPoints.join(',')
          })
        };

        const response = await axios.post(
          `/api${endpoints[this.selectedDataType]}`,
          null,
          { params }
        );

        if (response.data.code === 200) {
          const formattedData = response.data.data.map(item => {
            const formatted = {
              ...item,
              timestamp: this.convertToLocalTime(item.timestamp)
            };

            if (item.fieldValues) {
                Object.entries(item.fieldValues).forEach(([fieldKey, value]) => {
                  if (['subside', 'waterPressure'].includes(this.selectedDataType)) {
                    formatted[fieldKey] = value;
                  } else if (this.selectedDataType === 'humiture') {
                    const [baseId, fieldType] = fieldKey.split('_');
                    formatted[`${baseId}_${fieldType}`] = value;
                  }
                });

                delete item.fieldValues;
                delete formatted.fieldValues;
              }

            return Object.assign({}, item, formatted);
          }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          // 更新对应类型的数据
          this.cardData[this.selectedDataType] = formattedData;
          this.tableData = formattedData;
          
          this.$message.success('查询成功');
          
          // 如果当前卡片类型与查询类型一致，刷新该卡片
          if (this.card1Type === this.selectedDataType) {
            this.card1Key += 1;
          }
          if (this.card2Type === this.selectedDataType) {
            this.card2Key += 1;
          }
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },
    handleDownload() {
      if (!this.tableData.length) {
        this.$message.warning('没有数据可下载');
        return;
      }

      const sheetNames = {
        dynamicWeighing: '动态称重数据',
        weather: '气象数据',
        subside: '沉降数据',
        waterPressure: '孔隙水压力数据',
        humiture: '温湿度数据'
      };

      const worksheet = XLSX.utils.json_to_sheet(
        this.tableData.map(item => {
          const translated = {};
          Object.keys(item).forEach(key => {
            translated[this.getColumnLabel(key)] = item[key];
          });
          return translated;
        })
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetNames[this.selectedDataType] || '数据'
      );

      XLSX.writeFile(
        workbook,
        `${sheetNames[this.selectedDataType] || '数据'}.xlsx`
      );
    }
  }
};
</script>

<style scoped>
.comprehensive-search-and-visualize {
  padding: 20px;
  text-align: center;
}

/* 标题样式 */
.title h2 {
  font-weight: bold; 
  margin-top: 0;
  margin-bottom: 20px; 
}

/* 查询控件容器 */
.query-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/* 数据选择框样式 */
.data-select {
  min-width: 200px;
}

/* 时间选择框样式 */
.time-picker {
  display: flex;
  gap: 10px;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  gap: 10px;
}

.visualization-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  height: 100%;
  max-width: 600px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header .el-select {
  flex-grow: 1;
  margin-right: 10px;
}

.card-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.card-actions {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.card-actions .el-button {
  margin-left: 0;
  padding: 7px 15px;
}

.table-container {
  flex: 1;
  overflow: hidden;
}

.el-table {
  width: 100%;
}

.el-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.visualization-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  margin-top: 5px;
  min-height: 400px;
}

/* 响应式设计 - 在小屏幕上单列显示 */
@media (max-width: 992px) {
  .visualization-cards {
    grid-template-columns: 1fr;
  }
}
</style>
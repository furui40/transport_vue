<template>
  <div class="upload-history">
    <div class="header">
      <el-select v-model="currentDataType" placeholder="选择数据类型" style="width: 200px" @change="handleDataTypeChange">
        <el-option
          v-for="type in dataTypes"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>
      
      <el-button type="primary" @click="loadHistory">查询历史</el-button>
    </div>

    <el-table 
      :data="paginatedHistory" 
      style="width: 100%"
      @sort-change="sortChange"
    >
      <el-table-column 
        prop="filePath" 
        label="文件路径" 
        sortable 
        :sort-orders="['ascending', 'descending']"
      />
      <el-table-column prop="status" label="写入状态" width="120" sortable :sort-orders="['ascending', 'descending']">
        <template #default="{row}">
          <el-tag :type="getStatusTagType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="timestamp" label="上传时间" width="180" sortable :sort-orders="['ascending', 'descending']">
        <template #default="{row}">
          {{ formatTimestamp(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{row}">
          <el-button 
            type="text" 
            size="small"
            @click="deleteHistory(row)"
            :disabled="row.status === 'processing'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[15, 30, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredHistory.length"
      />
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      dataTypes: [
        { value: 'dynamicWeighing', label: '动态称重数据' },
        { value: 'weather', label: '气象数据' },
        { value: 'subside', label: '沉降数据' },
        { value: 'waterPressure', label: '孔隙水压力数据' },
        { value: 'humiture', label: '温湿度数据' },
      ],
      currentDataType: 'dynamicWeighing',
      currentPage: 1,
      pageSize: 15,
      sortProp: 'timestamp',
      sortOrder: 'descending',
      historyData: []
    };
  },
  computed: {
    filteredHistory() {
      // 直接从本地数据排序
      return [...this.historyData].sort((a, b) => {
        const aVal = a[this.sortProp];
        const bVal = b[this.sortProp];
        return this.sortOrder === 'ascending' ? aVal - bVal : bVal - aVal;
      });
    },
    paginatedHistory() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredHistory.slice(start, start + this.pageSize);
    }
  },
  methods: {
    // 状态显示相关方法保持精简
    getStatusTagType(status) {
      const types = { processed: 'success', processing: 'warning', failed: 'danger' };
      return types[status] || 'info';
    },
    getStatusText(status) {
      const texts = { processed: '已写入', processing: '处理中', failed: '失败' };
      return texts[status] || '未写入';
    },
    formatTimestamp(timestamp) {
      return timestamp ? new Date(timestamp).toLocaleString() : '';
    },

    // 分页和排序处理
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    sortChange({ prop, order }) {
      this.sortProp = prop;
      this.sortOrder = order;
      this.currentPage = 1;
    },

    // 数据获取方法
    async loadHistory() {
      try {
        const baseURL = 'http://localhost:8080';
        const { data } = await axios.get(`${baseURL}/upload/get_history`, {
          params: { dataType: this.currentDataType }
        });
        if (data.code === 200) {
          this.historyData = data.data;
          this.currentPage = 1;
        }
      } catch (error) {
        this.$message.error('获取历史失败: ' + error.message);
      }
    },

    // 删除操作
    async deleteHistory(item) {
      try {
        await this.$confirm('确定要删除这条记录吗?', '提示');
        const baseURL = 'http://localhost:8080';
        const { data } = await axios.post(`${baseURL}/upload/delete_history`, null,{
          params: {
            dataType: this.currentDataType,
            filePath: item.filePath
          }
        });
        if (data.code === 200) {
          await this.loadHistory();  // 刷新数据
          this.$message.success('删除成功');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败: ' + (error.response?.data?.message || error.message));
        }
      }
    }
  },
  mounted() {
    this.loadHistory();
  }
};
</script>

<style scoped>
.upload-history {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
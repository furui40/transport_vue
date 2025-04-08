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
import { mapGetters, mapActions } from 'vuex';

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
      sortOrder: 'descending'
    };
  },
  computed: {
    ...mapGetters('upload', ['getUploadHistory']),
    
    filteredHistory() {
      let history = this.getUploadHistory(this.currentDataType) || [];
      
      // 排序处理
      if (this.sortProp) {
        history.sort((a, b) => {
          const aValue = a[this.sortProp];
          const bValue = b[this.sortProp];
          
          if (aValue === bValue) return 0;
          
          if (this.sortOrder === 'ascending') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }
      
      return history;
    },
    
    paginatedHistory() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredHistory.slice(start, end);
    }
  },
  methods: {
    ...mapActions('upload', ['fetchUploadHistory', 'deleteHistoryItem']),
    
    getStatusTagType(status) {
      switch (status) {
        case 'processed': return 'success';
        case 'processing': return 'warning';
        case 'failed': return 'danger';
        default: return 'info';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'processed': return '已写入';
        case 'processing': return '处理中';
        case 'failed': return '失败';
        default: return '未写入';
      }
    },
    
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    
    handleDataTypeChange() {
      this.loadHistory();
    },
    
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
    
    async loadHistory() {
      try {
        await this.fetchUploadHistory(this.currentDataType);
        this.currentPage = 1;
      } catch (error) {
        this.$message.error('获取上传历史失败: ' + error.message);
      }
    },
    
    async deleteHistory(item) {
      try {
        await this.$confirm('确定要删除这条记录吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await this.deleteHistoryItem({
          dataType: this.currentDataType,
          filePath: item.filePath
        });
        
        this.$message.success('删除成功');
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败: ' + error.message);
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
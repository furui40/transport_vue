<template>
  <div class="data-management">
    <div class="header">
      <el-select v-model="currentDataType" placeholder="选择数据类型" style="width: 200px" @change="handleDataTypeChange">
        <el-option
          v-for="type in dataTypes"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>
      
      <el-select 
        v-model="statusFilter" 
        placeholder="状态筛选" 
        style="width: 120px; margin-left: 10px"
        @change="handleFilterChange"
      >
        <el-option label="全部" value="all" />
        <el-option label="未写入" value="unprocessed" />
        <el-option label="已写入" value="processed" />
        <el-option label="处理中" value="processing" />
        <el-option label="失败" value="failed" />
      </el-select>
      
      <el-button type="primary" @click="loadStatus">查询状态</el-button>
      <el-button 
        type="primary" 
        plain 
        @click="selectAllUnprocessed"
        :disabled="unprocessedFilesCount === 0"
      >
        全选未写入({{ unprocessedFilesCount }})
      </el-button>
    </div>

    <!-- 处理进度面板 -->
    <el-card v-if="processingStatus.visible" class="processing-panel">
      <div slot="header" class="clearfix">
        <span>文件处理进度</span>
        <el-button 
          style="float: right; padding: 3px 0" 
          type="text"
          @click="processingStatus.visible = false"
        >
          隐藏
        </el-button>
      </div>
      <div>
        <el-progress 
          :percentage="processingStatus.percentage" 
          :status="processingStatus.status"
        />
        <div class="progress-details">
          <p>已处理: {{ processingStatus.processed }}/{{ processingStatus.total }}</p>
          <p>当前文件: {{ processingStatus.currentFile || '无' }}</p>
          <p>状态: {{ processingStatus.message }}</p>
        </div>
        <el-button 
          type="danger" 
          size="small" 
          @click="cancelProcessing"
          :disabled="!processingStatus.isProcessing"
        >
          取消处理
        </el-button>
      </div>
    </el-card>

    <el-table 
      :data="paginatedFiles" 
      style="width: 100%"
      @sort-change="sortChange"
    >
      <el-table-column label="选择" width="80">
        <template #default="{row}">
          <el-checkbox 
            v-model="row.selected"
            :disabled="row.processed || row.status === 'processing'"
            @change="handleSelectionChange(row)"
          />
        </template>
      </el-table-column>
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
      <el-table-column label="操作" width="120">
        <template #default="{row}">
          <el-button 
            v-if="row.status === 'failed'"
            type="text" 
            size="small"
            @click="retrySingleFile(row)"
          >
            重试
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
        :total="filteredFiles.length"
      />
      <div>
        <el-button 
          type="text"
          @click="showProcessingPanel"
          v-if="processingStatus.total > 0 && !processingStatus.visible"
        >
          查看处理进度({{ processingStatus.processed }}/{{ processingStatus.total }})
        </el-button>
        <el-button 
          type="primary" 
          :disabled="selectedFiles.length === 0 || processingStatus.isProcessing"
          @click="processFiles"
          style="margin-left: 20px"
        >
          写入选中文件（{{ selectedFiles.length }}个）
        </el-button>
      </div>
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
      fileStatus: [],
      selectedFiles: [],
      statusFilter: 'unprocessed',
      currentPage: 1,
      pageSize: 10,
      sortProp: 'filePath',
      sortOrder: 'ascending',
      processingStatus: {
        visible: false,
        isProcessing: false,
        processed: 0,
        total: 0,
        percentage: 0,
        currentFile: '',
        message: '等待开始',
        status: '',
        cancelToken: null
      }
    };
  },
  computed: {
    filteredFiles() {
      let files = [...this.fileStatus];
      
      if (this.currentDataType === 'weather') {
        files = files.filter(file => !file.filePath.toLowerCase().endsWith('.xls'));
      }
      
      // 根据状态筛选
      if (this.statusFilter === 'processed') {
        files = files.filter(f => f.status === 'processed');
      } else if (this.statusFilter === 'unprocessed') {
        files = files.filter(f => !f.status || f.status === 'unprocessed');
      } else if (this.statusFilter === 'processing') {
        files = files.filter(f => f.status === 'processing');
      } else if (this.statusFilter === 'failed') {
        files = files.filter(f => f.status === 'failed');
      }
      
      // 添加选中状态
      files = files.map(file => ({
        ...file,
        selected: this.selectedFiles.includes(file.filePath)
      }));
      
      // 排序处理
      if (this.sortProp) {
        files.sort((a, b) => {
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
      
      return files;
    },
    
    paginatedFiles() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredFiles.slice(start, end);
    },
    
    unprocessedFilesCount() {
      return this.filteredFiles.filter(f => !f.status || f.status === 'unprocessed').length;
    }
  },
  methods: {
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
    
    handleDataTypeChange() {
      this.statusFilter = 'unprocessed';
      this.selectedFiles = [];
      this.loadStatus();
    },
    
    handleSelectionChange(row) {
      if (row.selected && !this.selectedFiles.includes(row.filePath)) {
        this.selectedFiles.push(row.filePath);
      } else if (!row.selected) {
        this.selectedFiles = this.selectedFiles.filter(f => f !== row.filePath);
      }
    },
    
    selectAllUnprocessed() {
      const unprocessedFiles = this.filteredFiles.filter(f => !f.status || f.status === 'unprocessed');
      this.selectedFiles = unprocessedFiles.map(f => f.filePath);
      
      this.fileStatus = this.fileStatus.map(file => ({
        ...file,
        selected: (!file.status || file.status === 'unprocessed') && 
                 this.selectedFiles.includes(file.filePath)
      }));
    },
    
    handleFilterChange() {
      this.currentPage = 1;
      this.selectedFiles = [];
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
    
    showProcessingPanel() {
      this.processingStatus.visible = true;
    },
    
    async loadStatus() {
      try {
        const baseURL = 'http://localhost:8080';
        const res = await axios.get(`${baseURL}/upload/status`, {
          params: { dataType: this.currentDataType }
        });
        
        if (res.data.code === 200) {
          this.fileStatus = res.data.data.map(file => ({
            ...file,
            status: file.processed ? 'processed' : 'unprocessed'
          })).sort((a, b) => {
            if (a.filePath > b.filePath) return 1;
            if (a.filePath < b.filePath) return -1;
            return 0;
          });
          
          this.selectedFiles = [];
          this.currentPage = 1;
          this.sortProp = 'filePath';
          this.sortOrder = 'ascending';
        }
      } catch (error) {
        this.$message.error('获取状态失败: ' + error.message);
      }
    },
    
    async processFiles() {
      if (this.processingStatus.isProcessing) {
        this.$message.warning('已有文件正在处理中');
        return;
      }
      
      // 初始化处理状态
      this.processingStatus = {
        visible: true,
        isProcessing: true,
        processed: 0,
        total: this.selectedFiles.length,
        percentage: 0,
        currentFile: '',
        message: '开始处理...',
        status: '',
        cancelToken: axios.CancelToken.source()
      };
      
      // 根据数据类型设置批处理大小
      const batchSize = this.currentDataType === 'dynamicWeighing' ? 10 : 1;
      const totalBatches = Math.ceil(this.selectedFiles.length / batchSize);
      
      try {
        for (let i = 0; i < totalBatches; i++) {
          if (!this.processingStatus.isProcessing) break; // 检查是否取消
          
          const start = i * batchSize;
          const end = start + batchSize;
          const batchFiles = this.selectedFiles.slice(start, end);
          
          // 更新文件状态为处理中
          this.updateFileStatus(batchFiles, 'processing');
          
          // 更新处理状态
          this.processingStatus.currentFile = batchFiles.join(', ');
          this.processingStatus.message = `正在处理批次 ${i + 1}/${totalBatches}`;
          
          try {
            const baseURL = 'http://localhost:8080';
            const res = await axios.post(`${baseURL}/upload/process`, null, {
              params: {
                dataType: this.currentDataType,
                filePaths: batchFiles.join(','),
              },
              cancelToken: this.processingStatus.cancelToken.token
            });
            
            if (res.data.code === 200) {
              // 更新文件状态为已处理
              this.updateFileStatus(batchFiles, 'processed');
              this.processingStatus.processed += batchFiles.length;
              this.processingStatus.percentage = Math.round(
                (this.processingStatus.processed / this.processingStatus.total) * 100
              );
              this.processingStatus.status = 'success';
              this.processingStatus.message = `批次 ${i + 1}/${totalBatches} 处理成功`;
              
            } else {
              // 更新文件状态为失败
              this.updateFileStatus(batchFiles, 'failed');
              this.processingStatus.status = 'exception';
              this.processingStatus.message = `批次 ${i + 1}/${totalBatches} 处理失败: ${res.data.message}`;
            
            }
          } catch (error) {
            if (axios.isCancel(error)) {
              this.processingStatus.message = '处理已被取消';
              break;
            }
            
            // 更新文件状态为失败
            this.updateFileStatus(batchFiles, 'failed');
            this.processingStatus.status = 'exception';
            this.processingStatus.message = `批次 ${i + 1}/${totalBatches} 处理失败: ${error.message}`;
          
          }
          
          // 短暂延迟，避免服务器压力过大
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (this.processingStatus.isProcessing) {
          this.processingStatus.isProcessing = false;
          this.processingStatus.message = '所有文件处理完成';
          this.processingStatus.status = 'success';
          this.$message.success('文件处理完成');
        }
      } finally {
        this.processingStatus.isProcessing = false;
        // 刷新状态
        await this.loadStatus();
      }
    },
    
    updateFileStatus(filePaths, status) {
      this.fileStatus = this.fileStatus.map(file => {
        if (filePaths.includes(file.filePath)) {
          return { ...file, status };
        }
        return file;
      });
    },
    
    cancelProcessing() {
      if (this.processingStatus.cancelToken) {
        this.processingStatus.cancelToken.cancel('用户取消处理');
      }
      this.processingStatus.isProcessing = false;
      this.processingStatus.message = '处理已取消';
      this.processingStatus.status = '';
      this.$message.warning('文件处理已取消');
    },
    
    async retrySingleFile(file) {
      this.selectedFiles = [file.filePath];
      await this.processFiles();
      
    }
  },
  mounted() {
    this.loadStatus();
  }
};
</script>

<style scoped>
.data-management {
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
  justify-content: space-between;
  align-items: center;
}

.processing-panel {
  margin-bottom: 20px;
}

.progress-details {
  margin: 10px 0;
  color: #666;
  font-size: 14px;
}

.progress-details p {
  margin: 5px 0;
}
</style>
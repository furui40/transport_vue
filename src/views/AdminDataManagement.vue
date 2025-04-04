<template>
  <div class="data-management">
    <div class="header">
      <el-select v-model="currentDataType" placeholder="选择数据类型" style="width: 200px">
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

    <el-table 
      :data="paginatedFiles" 
      style="width: 100%"
    >
      <el-table-column label="选择" width="80">
        <template #default="{row}">
          <el-checkbox 
            v-model="row.selected"
            :disabled="row.processed"
            @change="handleSelectionChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="filePath" label="文件路径" sortable :sort-orders="['ascending', 'descending']"/>
      <el-table-column prop="processed" label="写入状态" width="120" sortable :sort-orders="['ascending', 'descending']">
        <template #default="{row}">
          <el-tag :type="row.processed ? 'success' : 'danger'">
            {{ row.processed ? '已写入' : '未写入' }}
          </el-tag>
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
      <el-button 
        type="primary" 
        :disabled="selectedFiles.length === 0"
        @click="processFiles"
        style="margin-left: 20px"
      >
        写入选中文件（{{ selectedFiles.length }}个）
      </el-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      dataTypes: [
        { value: 'dynamic_weighing', label: '动态称重数据' },
        // 添加其他数据类型
      ],
      currentDataType: 'dynamic_weighing',
      fileStatus: [],
      selectedFiles: [],
      statusFilter: 'unprocessed',
      currentPage: 1,
      pageSize: 10,
      sortProp: 'filePath',
      sortOrder: 'ascending'
    };
  },
  computed: {
    filteredFiles() {
      // 根据筛选条件过滤文件
      let files = [...this.fileStatus]; // 创建副本避免修改原数组
      
      // 根据状态筛选
      if (this.statusFilter === 'processed') {
        files = files.filter(f => f.processed);
      } else if (this.statusFilter === 'unprocessed') {
        files = files.filter(f => !f.processed);
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
      // 分页处理
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredFiles.slice(start, end);
    },
    
    unprocessedFilesCount() {
      return this.fileStatus.filter(f => !f.processed).length;
    }
  },
  methods: {
    handleSelectionChange(row) {
      if (row.selected && !this.selectedFiles.includes(row.filePath)) {
        this.selectedFiles.push(row.filePath);
      } else if (!row.selected) {
        this.selectedFiles = this.selectedFiles.filter(f => f !== row.filePath);
      }
    },
    
    selectAllUnprocessed() {
      const unprocessedFiles = this.fileStatus.filter(f => !f.processed);
      this.selectedFiles = unprocessedFiles.map(f => f.filePath);
      
      // 更新表格中的选中状态
      this.fileStatus = this.fileStatus.map(file => ({
        ...file,
        selected: !file.processed && this.selectedFiles.includes(file.filePath)
      }));
    },
    
    handleFilterChange() {
      this.currentPage = 1; // 筛选条件改变时重置到第一页
    },
    
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1; // 每页条数改变时重置到第一页
    },
    
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    
    sortChange({ prop, order }) {
      this.sortProp = prop;
      this.sortOrder = order;
      this.currentPage = 1; // 排序改变时重置到第一页
    },
    
    async loadStatus() {
      try {
        const baseURL = 'http://localhost:8080';
        const res = await axios.get(`${baseURL}/update/status`, {
          params: { dataType: this.currentDataType }
        });
        
        if (res.data.code === 200) {
          // 获取数据后立即按文件路径升序排序
          this.fileStatus = res.data.data.sort((a, b) => {
            if (a.filePath > b.filePath) return 1;
            if (a.filePath < b.filePath) return -1;
            return 0;
          });
          
          this.selectedFiles = []; // 清空已选项
          this.currentPage = 1; // 重置到第一页
          this.sortProp = 'filePath';
          this.sortOrder = 'ascending';
        }
      } catch (error) {
        this.$message.error('获取状态失败: ' + error.message);
      }
    },
    
    async processFiles() {
      try {
        const baseURL = 'http://localhost:8080';
        const res = await axios.post(`${baseURL}/update/process`, null, {
          params: {
            dataType: this.currentDataType,
            filePaths: this.selectedFiles.join(','),
          },
        });
        
        if (res.data.code === 200) {
          this.$message.success(res.data.data);
          await this.loadStatus();
        }
      } catch (error) {
        this.$message.error('文件处理失败: ' + error.message);
      }
    }
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
</style>
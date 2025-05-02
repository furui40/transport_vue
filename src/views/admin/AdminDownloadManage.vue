<template>
  <div class="admin-download-manage">
    <!-- 搜索区域 -->
    <el-row :gutter="10" class="search-row" type="flex" align="middle">
      <el-col :span="5">
        <el-input 
          v-model="userId" 
          placeholder="用户ID" 
          clearable
          class="compact-input"
        ></el-input>
      </el-col>
      <el-col :span="3">
        <el-button 
          type="success" 
          @click="searchByUserId"
          class="compact-btn"
        >用户ID查询</el-button>
      </el-col>
      <el-col :span="3">
        <el-button 
          type="primary" 
          @click="searchAll"
          class="compact-btn"
        >全部数据</el-button>
      </el-col>
      <el-col :span="6">
        <el-select 
          v-model="selectedDataType" 
          placeholder="筛选：数据类型" 
          clearable
          class="compact-select"
        >
          <el-option label="全部" value="" />
          <el-option label="高频传感器" value="高频传感器数据" />
          <el-option label="经过-高频传感器" value="车辆经过时高频传感器数据" />
          <el-option label="经过-所有传感器" value="车辆经过时所有传感器数据" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select 
          v-model="selectedStatus" 
          placeholder="筛选：状态" 
          clearable
          class="compact-select"
        >
          <el-option label="全部" value="" />
          <el-option label="已申请" value="已申请" />
          <el-option label="审核通过" value="审核通过" />
          <el-option label="审核不通过" value="审核不通过" />
          <el-option label="下载中" value="下载中" />
          <el-option label="下载完成" value="下载完成" />
          <el-option label="已完成" value="已完成" />
        </el-select>
      </el-col>
    </el-row>

    <!-- 历史申请记录表格 -->
    <el-table
      :data="paginatedData"
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <!-- 选择框列 -->
      <el-table-column type="selection" width="55" />

      <!-- 操作列（移动到复选框右侧） -->
      <el-table-column label="操作" width="100" fixed>
        <template #default="scope">
          <el-button
            v-if="scope.row.status === '审核通过'"
            size="small"
            type="primary"
            :disabled="scope.row.downloading"
            @click="startDownload(scope.row)"
          >
            {{ scope.row.downloading ? '下载中...' : '开始下载' }}  <!-- 动态显示按钮文字 -->
          </el-button>
          <el-button
            v-if="scope.row.status === '下载完成'"
            size="small"
            type="success"
            @click="showSendDialog(scope.row)"
          >
            发送链接
          </el-button>
        </template>
      </el-table-column>

      <!-- 动态列 -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="getColumnLabel(column.prop)"
        :width="getColumnWidth(column.prop)"
      >
        <template #default="scope">
          <template v-if="shouldTruncate(column.prop) && scope.row[column.prop]">
            <div v-if="!scope.row[`${column.prop}Expanded`]">
              {{ truncateText(scope.row[column.prop]) }}
              <el-button
                v-if="scope.row[column.prop].length > 80"
                type="text"
                @click="toggleExpand(scope.row, column.prop)"
              >
                展开
              </el-button>
            </div>
            <div v-else>
              {{ scope.row[column.prop] }}
              <el-button
                type="text"
                @click="toggleExpand(scope.row, column.prop)"
              >
                收起
              </el-button>
            </div>
          </template>
          <template v-else>
            {{ scope.row[column.prop] || 'N/A' }}
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      class="pagination"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="filteredData.length"
      @current-change="handlePageChange"
      layout="prev, pager, next"
    />

    <!-- 审核通过和审核不通过按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="approveSelected">审核通过</el-button>
      <el-button type="danger" @click="rejectSelected">审核不通过</el-button>
    </div>

    <!-- 审核不通过理由文本框 -->
    <div class="reject-reason">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="请输入审核不通过的理由"
      ></el-input>
    </div>

    <!-- 发送链接对话框 -->
    <el-dialog v-model="sendDialogVisible" title="发送下载链接" width="500px">
      <el-input v-model="downloadLink" placeholder="请输入下载链接"></el-input>
      <template #footer>
        <el-button @click="sendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendDownloadLink">确认发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'AdminDownloadManage',
  data() {
    return {
      userId: '',
      selectedDataType: '',
      selectedStatus: '', 
      historyData: [],
      filteredData: [],
      paginatedData: [],
      selectedRows: [],
      columns: [
        { prop: 'applyId' },
        { prop: 'userId' },
        { prop: 'dataType' },
        { prop: 'status' },
        { prop: 'fields' },
        { prop: 'startTime' },
        { prop: 'stopTime' },
        { prop: 'userEmail' },
        { prop: 'msg' },
      ],
      currentPage: 1,
      pageSize: 8,
      rejectReason: '',
      sendDialogVisible: false,
      downloadLink: '',
      currentApplyId: null,
      // 需要截断显示的列
      truncateColumns: ['fields', 'msg']
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']),
  },
  watch: {
    selectedStatus() {
      this.filterData();
    },
    selectedDataType() {
      this.filterData();
    }
  },

  methods: {
    // 判断是否需要截断显示
    shouldTruncate(prop) {
      return this.truncateColumns.includes(prop);
    },
    
    // 截断文本
    truncateText(text) {
      if (!text) return '';
      return text.length > 80 ? text.substring(0, 80) + '...' : text;
    },
    
    // 切换展开/收起状态
    toggleExpand(row, prop) {
      row[`${prop}Expanded`] = !row[`${prop}Expanded`];
    },

    // 查询所有数据
    async searchAll() {
      try {
        const response = await axios.post('/api/download/searchapply', null, {
          params: { method: '0', userId: this.userId },
        });

        if (response.data.code === 200) {
          this.historyData = response.data.data
            .map(item => ({
              applyId: item.applyId || 'N/A',
              userId: item.userId || 'N/A',
              dataType: item.dataType || 'N/A',
              fields: item.fields || 'N/A',
              startTime: item.startTime ? this.formatTimestamp(item.startTime) : 'N/A',
              stopTime: item.stopTime ? this.formatTimestamp(item.stopTime) : 'N/A',
              status: item.status || 'N/A',
              userEmail: item.userEmail || 'N/A',
              msg: item.msg || 'N/A',
            }))
            .sort((a, b) => b.applyId - a.applyId);
          this.filterData();
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },

    // 根据用户ID查询数据
    async searchByUserId() {
      if (!this.userId) {
        this.$message.warning('请输入用户ID');
        return;
      }

      try {
        const response = await axios.post('/api/download/searchapply', null, {
          params: { method: '1', userId: this.userId },
        });

        if (response.data.code === 200) {
          this.historyData = response.data.data
            .map(item => ({
              applyId: item.applyId || 'N/A',
              userId: item.userId || 'N/A',
              dataType: item.dataType || 'N/A',
              fields: item.fields || 'N/A',
              startTime: item.startTime ? this.formatTimestamp(item.startTime) : 'N/A',
              stopTime: item.stopTime ? this.formatTimestamp(item.stopTime) : 'N/A',
              status: item.status || 'N/A',
              userEmail: item.userEmail || 'N/A',
              msg: item.msg || 'N/A',
            }))
            .sort((a, b) => b.applyId - a.applyId);
          this.filterData();
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
      if (!timestamp) return 'N/A';
      return new Date(parseInt(timestamp) * 1000).toLocaleString();
    },

    // 处理选中行数据
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },

    // 审核通过选中的申请
    async approveSelected() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择至少一条申请记录');
        return;
      }

      try {
        const applyIds = this.selectedRows.map(row => row.applyId);

        const response = await axios.post('/api/download/passapply', null, {
          params: { applyIds: applyIds.join(',') },
        });

        if (response.data.code === 200) {
          this.$message.success('审核通过成功');
          this.selectedRows.forEach(row => {
            row.status = '审核通过';
            row.msg = '审核通过';
          });
          this.selectedRows = [];
        } else {
          this.$message.error('审核通过失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('审核通过失败: ' + error.message);
      }
    },

    // 审核不通过选中的申请
    async rejectSelected() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择至少一条申请记录');
        return;
      }
      if (!this.rejectReason) {
        this.$message.warning('请输入审核不通过的理由');
        return;
      }

      try {
        const applyIds = this.selectedRows.map(row => row.applyId);

        const response = await axios.post('/api/download/rejectapply', null, {
          params: {
            applyIds: applyIds.join(','),
            reason: this.rejectReason,
          },
        });

        if (response.data.code === 200) {
          this.$message.success('审核不通过成功');
          this.selectedRows.forEach(row => {
            row.status = '审核不通过';
            row.msg = this.rejectReason;
          });
          this.selectedRows = [];
          this.rejectReason = '';
        } else {
          this.$message.error('审核不通过失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('审核不通过失败: ' + error.message);
      }
    },

    getDownloadEndpoint(dataType) {
      switch(dataType) {
        case '高频传感器数据':
          return '/download/startdownload';
        case '车辆经过时高频传感器数据':
          return '/download/startdownload2';
        case '车辆经过时所有传感器数据':
          return '/download/startdownload3';
        default:
          return '/download/startdownload';
      }
    },

    // 开始下载
    async startDownload(row) {
      if (row.downloading) return;
      
      row.downloading = true;
      row.status = '下载中';
      row.msg = '正在下载';
      
      try {
        // 修改端点选择逻辑
        const endpoint = this.getDownloadEndpoint(row.dataType);
        
        const response = await axios.post(`/api${endpoint}`, null, {
          params: {
            fields: row.fields,
            startTimeStr: row.startTime,
            stopTimeStr: row.stopTime,
            userId: row.userId,
            samplingInterval: 10,
            applyId: row.applyId
          },
        });

        if (response.data.code === 200) {
          this.$message.success('下载完成');
        } else {
          this.$message.error('开始下载失败: ' + response.data.message);
          row.status = '审核通过';
          row.msg = '下载失败: ' + response.data.message;
        }
      } catch (error) {
        this.$message.error('开始下载失败: ' + error.message);
        row.status = '审核通过';
        row.msg = '下载失败: ' + error.message;
      } finally {
        row.downloading = false;
      }
    },

    // 显示发送链接对话框
    showSendDialog(row) {
      this.currentApplyId = row.applyId;
      this.downloadLink = '';
      this.sendDialogVisible = true;
    },

    // 发送下载链接
    async sendDownloadLink() {
      if (!this.downloadLink) {
        this.$message.warning('请输入下载链接');
        return;
      }

      try {
        const response = await axios.post(`/api/download/send`, null, {
          params: {
            applyId: this.currentApplyId,
            downloadLink: this.downloadLink
          },
        });

        if (response.data.code === 200) {
          this.$message.success('链接发送成功');
          this.sendDialogVisible = false;
          
          // 更新表格中该行的状态
          const row = this.historyData.find(item => item.applyId === this.currentApplyId);
          if (row) {
            row.status = '已完成';
            row.msg = '下载链接已发送';
          }
        } else {
          this.$message.error('链接发送失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('链接发送失败: ' + error.message);
      }
    },

    // 根据状态筛选数据
    filterData() {
      this.filteredData = this.historyData.filter(item => {
        // 数据类型筛选
        const dataTypeMatch = !this.selectedDataType || 
                             item.dataType === this.selectedDataType;
        // 状态筛选
        const statusMatch = !this.selectedStatus || 
                           item.status === this.selectedStatus;
        return dataTypeMatch && statusMatch;
      });
      this.currentPage = 1;
      this.updatePaginatedData();
    },

    // 更新分页数据
    updatePaginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.paginatedData = this.filteredData.slice(start, end);
    },

    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
      this.updatePaginatedData();
    },
  },
};
</script>

<style scoped>
.admin-download-manage {
  padding: 20px;
}

.search-row {
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: 20px;
  align-items: center;
}

.compact-input  {
  padding: 0 10px;
  height: 32px;
  line-height: 32px;
}

.compact-btn {
  padding: 8px 10px;
  height: 32px;
}

.compact-select  {
  padding: 0 10px;
  height: 32px;
  line-height: 32px;
}

.el-col {
  display: flex;
  align-items: center;
}

.el-table {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.action-buttons {
  margin-top: 20px;
  text-align: right;
}

.reject-reason {
  margin-top: 20px;
}
</style>
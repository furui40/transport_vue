<template>
  <div class="admin-download-manage">
    <!-- 搜索区域 -->
    <el-row :gutter="20" class="search-row">
      <el-col :span="6">
        <el-input v-model="userId" placeholder="请输入用户ID" clearable></el-input>
      </el-col>
      <el-col :span="6">
        <el-select v-model="selectedStatus" placeholder="请选择状态" clearable>
          <el-option label="已申请" value="已申请" />
          <el-option label="审核通过" value="审核通过" />
          <el-option label="审核不通过" value="审核不通过" />
          <el-option label="已完成" value="已完成" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-button type="primary" @click="searchAll">查询所有数据</el-button>
      </el-col>
      <el-col :span="6">
        <el-button type="success" @click="searchByUserId">根据用户ID查询</el-button>
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

      <!-- 动态列 -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="getColumnLabel(column.prop)"
        :width="getColumnWidth(column.prop)"
      />
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
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'AdminDownloadManage',
  data() {
    return {
      userId: '', // 管理员输入的用户ID
      selectedStatus: '', // 选择的状态
      historyData: [], // 所有历史申请记录数据
      filteredData: [], // 筛选后的数据
      paginatedData: [], // 分页后的数据
      selectedRows: [], // 选中的行数据
      columns: [
        { prop: 'applyId' },
        { prop: 'userId' },
        { prop: 'dataType' },
        { prop: 'fields' },
        { prop: 'startTime' },
        { prop: 'stopTime' },
        { prop: 'status' },
        { prop: 'userEmail' },
        { prop: 'msg' },
      ],
      currentPage: 1, // 当前页码
      pageSize: 8, // 每页显示条数
      rejectReason: '', // 审核不通过的理由
    };
  },
  computed: {
    ...mapGetters('table', ['getColumnWidth', 'getColumnLabel']),
  },
  watch: {
    // 监听 selectedStatus 变化，重新筛选数据
    selectedStatus() {
      this.filterData();
    },
  },
  methods: {
    // 查询所有数据
    async searchAll() {
      try {
        const response = await axios.post('http://localhost:8080/download/searchapply', null, {
          params: { method: '0', userId: this.userId }, // 查询所有数据
        });

        if (response.data.code === 200) {
          // 按 applyId 从大到小排序
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
            .sort((a, b) => b.applyId - a.applyId); // 按 applyId 从大到小排序
          this.filterData(); // 查询完成后筛选数据
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
        const response = await axios.post('http://localhost:8080/download/searchapply', null, {
          params: { method: '1', userId: this.userId },
        });

        if (response.data.code === 200) {
          // 按 applyId 从大到小排序
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
            .sort((a, b) => b.applyId - a.applyId); // 按 applyId 从大到小排序
          this.filterData(); // 查询完成后筛选数据
        } else {
          this.$message.error('查询失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('查询失败: ' + error.message);
      }
    },

    // 将 Unix 时间戳转换为本地时间格式
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
        // 获取选中的申请ID列表
        const applyIds = this.selectedRows.map(row => row.applyId);

        // 调用后端接口
        const response = await axios.post('http://localhost:8080/download/passapply', null, {
          params: { applyIds: applyIds.join(',') }, // 将数组转换为逗号分隔的字符串
        });

        if (response.data.code === 200) {
          this.$message.success('审核通过成功');
          this.searchAll(); // 刷新数据
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
        // 获取选中的申请ID列表
        const applyIds = this.selectedRows.map(row => row.applyId);

        // 调用后端接口
        const response = await axios.post('http://localhost:8080/download/rejectapply', null, {
          params: {
            applyIds: applyIds.join(','), // 将数组转换为逗号分隔的字符串
            reason: this.rejectReason, // 审核不通过的理由
          },
        });

        if (response.data.code === 200) {
          this.$message.success('审核不通过成功');
          this.searchAll(); // 刷新数据
          this.rejectReason = ''; // 清空理由文本框
        } else {
          this.$message.error('审核不通过失败: ' + response.data.message);
        }
      } catch (error) {
        this.$message.error('审核不通过失败: ' + error.message);
      }
    },

    // 根据状态筛选数据
    filterData() {
      if (this.selectedStatus) {
        this.filteredData = this.historyData.filter(
          item => item.status === this.selectedStatus
        );
      } else {
        this.filteredData = this.historyData; // 如果没有选择状态，显示全部数据
      }
      this.currentPage = 1; // 重置到第一页
      this.updatePaginatedData(); // 更新分页数据
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
  margin-bottom: 20px;
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
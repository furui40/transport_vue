<template>
  <div class="user-download">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>文件下载中心</span>
        </div>
      </template>

      <!-- 文件搜索区域 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="请输入文件名搜索"
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
          style="width: 300px"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
      </div>

      <!-- 文件列表 -->
      <el-table 
        :data="paginatedFiles" 
        style="width: 100%; margin-top: 20px" 
        border
        v-loading="loading"
        empty-text="暂无文件"
      >
        <el-table-column prop="name" label="文件名" width="300" />
        <el-table-column prop="size" label="文件大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button link type="primary" @click="downloadFile(scope.row.name)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <el-pagination
        style="margin-top: 20px"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredFiles.length"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

const store = useStore()
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const fileList = ref([])

// 获取当前用户ID
const getUserId = () => {
  return store.state.user.userId || 'anonymous'
}

// 获取文件列表
const fetchFileList = async () => {
  loading.value = true
  try {
    const response = await axios.get(`/api/file/list`, {
      headers: {
        'userId': getUserId()
      }
    })
    
    // 解析文件元数据
    fileList.value = response.data.data.map(item => {
      const parts = item.split('|')
      return {
        name: parts[0],
        size: parts.length > 1 ? parseInt(parts[1]) : 0,
        uploadTime: parts.length > 2 ? parts[2] : '未知时间'
      }
    })
  } catch (error) {
    ElMessage.error('获取文件列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 搜索文件
const filteredFiles = computed(() => {
  if (!searchQuery.value) return fileList.value
  return fileList.value.filter(file => 
    file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 分页数据
const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFiles.value.slice(start, end)
})

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 清除搜索
const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 下载文件
const downloadFile = async (filename) => {
  try {
    const response = await axios.get(`/api/file/download`, {
      params: { filename },
      responseType: 'blob',
      headers: {
        'userId': getUserId()
      }
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    ElMessage.error('下载失败: ' + error.message)
  }
}

// 初始化时获取文件列表
onMounted(() => {
  fetchFileList()
})
</script>

<style scoped>
.user-download {
  padding: 20px;
}
.card-header {
    display: flex;
  font-size: 18px;
  font-weight: bold;
}
.search-bar {
  margin-bottom: 20px;
}
</style>
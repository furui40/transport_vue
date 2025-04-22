<template>
  <div class="admin-upload">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>文件上传管理</span>
        </div>
      </template>

      <!-- 文件上传区域 -->
      <el-upload
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        :before-upload="beforeUpload"
        multiple
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击选择文件</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传 xlsx/docx/pdf 文件，单文件不超过30MB
          </div>
        </template>
      </el-upload>

      

      <!-- 搜索框 -->
      <div class="search-bar">
        <el-button 
        type="primary" 
        @click="submitUpload"
        :disabled="!fileList.length"
        style="margin-right: 50px"
      >
        开始上传
      </el-button>
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
        style="width: 100%; margin-top: 30px" 
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="文件名" width="300" />
        <el-table-column prop="size" label="文件大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button link type="primary" @click="downloadFile(scope.row.name)">
              下载
            </el-button>
            <el-button link type="danger" @click="confirmDelete(scope.row.name)">
              删除
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
import { UploadFilled, Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStore } from 'vuex'

const store = useStore()
const baseURL = 'http://localhost:8080'
const fileList = ref([])
const existingFiles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')

// 获取当前用户ID
const getUserId = () => {
  return store.state.user.userId || 'anonymous'
}

// 获取已有文件列表
const fetchFileList = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${baseURL}/file/list`, {
      headers: {
        'userId': getUserId()
      }
    })
    
    // 解析文件元数据
    existingFiles.value = response.data.data.map(item => {
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
  if (!searchQuery.value) return existingFiles.value
  return existingFiles.value.filter(file => 
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

// 文件选择变化
const handleFileChange = (file, files) => {
  fileList.value = files
}

// 上传前校验
const beforeUpload = (file) => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ]
  const isTypeValid = validTypes.includes(file.type)
  const isSizeValid = file.size / 1024 / 1024 <= 30 // 30MB

  if (!isTypeValid) {
    ElMessage.error('只能上传 xlsx/docx/pdf 文件!')
    return false
  }
  if (!isSizeValid) {
    ElMessage.error('文件大小不能超过 30MB!')
    return false
  }
  return true
}

// 提交上传
const submitUpload = async () => {
  const formData = new FormData()
  fileList.value.forEach(file => {
    formData.append('files', file.raw)
  })

  try {
    const res = await axios.post(`${baseURL}/file/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'userId': getUserId()
      }
    })
    ElMessage.success('上传成功')
    fileList.value = []
    fetchFileList()
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  }
}

// 下载文件
const downloadFile = async (filename) => {
  try {
    const response = await axios.get(`${baseURL}/file/download`, {
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

// 确认删除文件
const confirmDelete = (filename) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${filename}" 吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteFile(filename)
  }).catch(() => {
    // 取消操作
  })
}

// 删除文件
const deleteFile = async (filename) => {
  try {
    await axios.delete(`${baseURL}/file/delete`, {
      params: { filename },
      headers: {
        'userId': getUserId()
      }
    })
    ElMessage.success('文件删除成功')
    fetchFileList() // 刷新文件列表
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  }
}

// 初始化时获取文件列表
onMounted(() => {
  fetchFileList()
})
</script>

<style scoped>
.admin-upload {
  padding: 20px;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh; 
}

.box-card {
  width: 100%; 
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.upload-demo {
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
}
</style>

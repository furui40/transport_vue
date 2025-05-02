<template>
  <div class="sensor-page">
    <!-- 左侧：断面图和传感器 -->
    <div class="left-panel">
      <!-- 断面切换下拉菜单 -->
      <el-select v-model="currentSectionIndex" @change="switchSection" placeholder="选择断面">
        <el-option
          v-for="(section, index) in sections"
          :key="index"
          :label="section.name"
          :value="index"
        ></el-option>
      </el-select>

      <div class="image-container" @click="handleImageClick">
        <img :src="currentImage" alt="断面图" class="section-image" />
        <!-- 传感器可点击区域 -->
        <div 
          v-for="(sensor, index) in sensorData" 
          :key="index" 
          class="sensor-area" 
          :style="{ left: `${sensor.x}px`, top: `${sensor.y}px` }"
          @mouseenter="hoverSensor(sensor)"
          @mouseleave="hoverSensor(null)"
          @click="selectSensor(sensor)"
        ></div>
      </div>
      <!-- 编辑模式按钮 -->
      <div v-if="isAdmin" class="edit-mode">
        <el-button type="primary" @click="toggleEditMode">
          {{ isEditMode ? '退出编辑模式' : '进入编辑模式' }}
        </el-button>
        <el-button v-if="isEditMode" type="success" @click="saveData">保存</el-button>
      </div>
    </div>

    <!-- 右侧：传感器信息和编辑功能 -->
    <div class="right-panel">
      <h2>传感器信息</h2>
      <div v-if="selectedSensor" class="sensor-info">
        <p><strong>传感器编号：</strong>{{ selectedSensor.id }}</p>
        <p><strong>传感器型号：</strong>{{ selectedSensor.type }}</p>
        <p><strong>采集内容：</strong>{{ selectedSensor.content }}</p>
        <p><strong>计算公式：</strong>{{ selectedSensor.formula }}</p>
        <p><strong>计量单位：</strong>{{ selectedSensor.unit }}</p>
        <p><strong>采集频率：</strong>{{ selectedSensor.frequency }}</p>
        <p><strong>埋藏深度：</strong>{{ selectedSensor.depth }}</p>
        <p><strong>制造厂商：</strong>{{ selectedSensor.manufacturer }}</p>
        <p><strong>其他：</strong>{{ selectedSensor.other }}</p>
        <div v-if="selectedSensor.image" class="sensor-image">
          <img :src="getSensorImageUrl(selectedSensor.image)" alt="传感器实物图" class="sensor-photo" />
        </div>
        <el-button 
          v-if="isEditMode" 
          type="danger" 
          @click="removeSensor(selectedSensor)"
        >
          删除传感器
        </el-button>
        <el-button 
          v-if="isEditMode" 
          type="primary" 
          @click="openEditDialog(selectedSensor)"
        >
          修改传感器
        </el-button>
      </div>
      <div v-else class="no-sensor-selected">
        <p>请点击左侧断面图上的传感器以查看详细信息。</p>
      </div>

      <!-- 添加传感器表单 -->
      <div v-if="isEditMode" class="add-sensor-form">
        <h3>添加传感器</h3>
        <el-form :model="newSensor" label-width="120px">
          <el-form-item label="传感器编号">
            <el-input v-model="newSensor.id" />
          </el-form-item>
          <el-form-item label="传感器型号">
            <el-input v-model="newSensor.type" />
          </el-form-item>
          <el-form-item label="采集内容">
            <el-input v-model="newSensor.content" />
          </el-form-item>
          <el-form-item label="计算公式">
            <el-input v-model="newSensor.formula" />
          </el-form-item>
          <el-form-item label="计量单位">
            <el-input v-model="newSensor.unit" />
          </el-form-item>
          <el-form-item label="采集频率">
            <el-input v-model="newSensor.frequency" />
          </el-form-item>
          <el-form-item label="埋藏深度">
            <el-input v-model="newSensor.depth" />
          </el-form-item>
          <el-form-item label="制造厂商">
            <el-input v-model="newSensor.manufacturer" />
          </el-form-item>
          <el-form-item label="其他">
            <el-input v-model="newSensor.other" />
          </el-form-item>
          <el-form-item label="图像">
            <el-input v-model="newSensor.image" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addSensor">添加传感器</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 修改传感器对话框 -->
      <el-dialog v-model="editDialogVisible" title="修改传感器信息">
        <el-form :model="editSensor">
          <el-form-item label="传感器编号">
            <el-input v-model="editSensor.id" />
          </el-form-item>
          <el-form-item label="传感器型号">
            <el-input v-model="editSensor.type" />
          </el-form-item>
          <el-form-item label="采集内容">
            <el-input v-model="editSensor.content" />
          </el-form-item>
          <el-form-item label="计算公式">
            <el-input v-model="editSensor.formula" />
          </el-form-item>
          <el-form-item label="计量单位">
            <el-input v-model="editSensor.unit" />
          </el-form-item>
          <el-form-item label="采集频率">
            <el-input v-model="editSensor.frequency" />
          </el-form-item>
          <el-form-item label="埋藏深度">
            <el-input v-model="editSensor.depth" />
          </el-form-item>
          <el-form-item label="制造厂商">
            <el-input v-model="editSensor.manufacturer" />
          </el-form-item>
          <el-form-item label="其他">
            <el-input v-model="editSensor.other" />
          </el-form-item>
          <el-form-item label="图像">
            <el-input v-model="editSensor.image" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditedSensor">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>


<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

export default {
  name: 'SensorPage',
  setup() {
    const store = useStore();
     const sections = [
      { name: '0.63m 底基层断面1', image: '/images/section1.png', dataFile: '/data/section1.js' },
      { name: '0.63m 底基层断面2', image: '/images/section2.png', dataFile: '/data/section2.js' },
      { name: '0.43m 基层断面1', image: '/images/section3.png', dataFile: '/data/section3.js' },
      { name: '0.43m 基层断面2' , image: '/images/section4.png', dataFile: '/data/section4.js' },
      { name: '0.11m 下面层断面1', image: '/images/section5.png', dataFile: '/data/section5.js' },
      { name: '0.11m 下面层断面2', image: '/images/section6.png', dataFile: '/data/section6.js' },
      { name: '0.05m 上面层断面1', image: '/images/section7.png', dataFile: '/data/section7.js' },
      { name: '0.05m 上面层断面2', image: '/images/section8.png', dataFile: '/data/section8.js' }
    ];
    const currentSectionIndex = ref(0); // 当前断面索引
    const sensorData = ref([]); // 传感器数据
    const selectedSensor = ref(null); // 当前选中的传感器
    const newSensor = ref({
      id: '',
      type: '',
      content: '',
      formula: '',
      unit: '',
      frequency: '',
      depth: '',
      manufacturer: '',
      other: '',
      x: 0,
      y: 0,
      image:''
    });
    const isEditMode = ref(false); // 是否处于编辑模式
    const editDialogVisible = ref(false); // 修改传感器对话框是否可见
    const editSensor = ref({}); // 当前编辑的传感器

    // 当前断面图（假设图片路径为 public/images/section1.png）
    const currentImage = computed(() => {
      return sections[currentSectionIndex.value].image;
    });

    // 从 Vuex 获取用户角色
    const isAdmin = computed(() => store.state.user.role === 'admin');

    // 加载传感器数据
    const loadSensorData = async (index) => {
      try {
        const response = await fetch(sections[index].dataFile);
        const text = await response.text();
        if (text.trim() === '') {
          sensorData.value = [];
        } else {
          const data = eval(text);
          sensorData.value = data;
        }
      } catch (error) {
        console.error('加载传感器数据失败:', error);
        sensorData.value = [];
      }
    };

    // 获取图片
    const getSensorImageUrl = (imageName) => {
      const sectionImagePath = sections[currentSectionIndex.value].image;
      const directory = sectionImagePath.substring(0, sectionImagePath.lastIndexOf('/'));
      return `${directory}/sensor${imageName}.png`;
    };

    // 切换断面
    const switchSection = (index) => {
      currentSectionIndex.value = index;
      loadSensorData(index);
    };

    // 保存传感器数据
    const saveData = () => {
      const data = JSON.stringify(sensorData.value, null, 2);
      // 这里需要实现将数据保存到 section1.js 的逻辑
      console.log('保存的数据:', data);
      ElMessage.success('保存成功！');
    };

    // 切换编辑模式
    const toggleEditMode = () => {
      isEditMode.value = !isEditMode.value;
    };

    // 处理图片点击事件（编辑模式下添加传感器）
    const handleImageClick = (event) => {
      if (!isEditMode.value) return;

      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left; // 点击位置的 X 坐标
      const y = event.clientY - rect.top; // 点击位置的 Y 坐标

      // 设置新传感器的位置
      newSensor.value.x = x;
      newSensor.value.y = y;
    };

    // 添加传感器
    const addSensor = () => {
      if (!newSensor.value.id || !newSensor.value.x || !newSensor.value.y) {
        ElMessage.warning('请填写传感器编号并点击图片设置位置');
        return;
      }

      // 将新传感器添加到传感器列表中
      sensorData.value.push({ ...newSensor.value });
      newSensor.value = {
        id: '',
        type: '',
        content: '',
        formula: '',
        unit: '',
        frequency: '',
        depth: '',
        manufacturer: '',
        other: '',
        x: 0,
        y: 0,
        image:''
      };
    };

    // 选择传感器
    const selectSensor = (sensor) => {
      selectedSensor.value = sensor;
    };

    // 删除传感器
    const removeSensor = (sensor) => {
      const index = sensorData.value.indexOf(sensor);
      if (index !== -1) {
        sensorData.value.splice(index, 1);
        selectedSensor.value = null;
      }
    };

    // 打开修改传感器对话框
    const openEditDialog = (sensor) => {
      editSensor.value = { ...sensor };
      editDialogVisible.value = true;
    };

    // 保存修改后的传感器信息
    const saveEditedSensor = () => {
      const index = sensorData.value.findIndex(s => s.id === editSensor.value.id);
      if (index !== -1) {
        sensorData.value[index] = { ...editSensor.value };
        ElMessage.success('修改成功！');
        editDialogVisible.value = false;
      }
    };

    // 鼠标悬停传感器
    const hoverSensor = (sensor) => {
      if (sensor) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    };

    // 初始化加载数据
    loadSensorData(currentSectionIndex.value);

    return {
      currentSectionIndex,
      currentImage,
      sensorData,
      selectedSensor,
      newSensor,
      isEditMode,
      editDialogVisible,
      editSensor,
      isAdmin,
      loadSensorData,
      saveData,
      toggleEditMode,
      handleImageClick,
      addSensor,
      selectSensor,
      removeSensor,
      openEditDialog,
      saveEditedSensor,
      hoverSensor,
      sections,
      switchSection,
      getSensorImageUrl,
    };
  }
};
</script>

<style scoped>
.sensor-page {
  display: flex;
  height: 100vh;
}

.left-panel {
  flex: 1;
  margin-top: 0px;
  margin-bottom: 0px;;
  border-right: 1px solid #ccc;
  text-align: center;
}

.image-container {
  position: relative;
  width: 800px; 
  height: 600px; 
}

.section-image {
  width: 100%;
  height: 100%;
  object-fit: contain; 
}

.sensor-area {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: transparent;
  cursor: pointer;
}

.edit-mode {
  margin-top: 20px;
}

.right-panel {
  flex: 1;
  padding: 20px;
}

.sensor-info {
  text-align: left;
}

.sensor-photo {
  max-width: 100%;
  max-height: 200px;
  margin-top: 0px;
}

.no-sensor-selected {
  color: #999;
  font-style: italic;
}

.add-sensor-form {
  margin-top: 20px;
}
</style>
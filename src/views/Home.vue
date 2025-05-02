<template>
  <div class="welcome-container">
    <div class="header-section">
      <h1>公路路基路面长期性能科学观测网</h1>
      <p class="subtitle">交通基础设施智能监测与长期性能研究平台</p>
    </div>

    <div class="content-section">
      <div class="background-section">
        <h2>项目背景</h2>
        <p>为响应国家交通强国战略，推进交通基础设施数字化、网联化、智能化发展，我们建立了公路路基路面长期性能科学观测网。该项目通过在典型公路路段布设智能传感器网络，实现对道路基础设施健康状态的实时感知与长期监测。</p>
      </div>

      <div class="observation-section">
        <h2>观测网络概况</h2>
        <div class="observation-grid">
          <div class="observation-card">
            <h3>路面监测系统</h3>
            <ul>
              <li>传感器数量：180支</li>
              <li>存活率：98.7%</li>
              <li>布设位置：上面层、下面层、基层、底基层层底</li>
              <li>监测指标：层底水平应变、竖向应变、竖向应力、温度、湿度等</li>
            </ul>
          </div>
          <div class="observation-card">
            <h3>路基监测系统</h3>
            <ul>
              <li>传感器数量：272支</li>
              <li>存活率：98.5%</li>
              <li>布设位置：路中、路肩、坡脚</li>
              <li>监测指标：温度、变形、水分迁移路径、孔隙水压力等</li>
            </ul>
          </div>
          <div class="observation-card">
            <h3>气象环境监测</h3>
            <ul>
              <li>布设位置：气象站布置于观测站房屋顶</li>
              <li>监测指标：大气温度、湿度、风速、风向、雨量、气压等</li>
            </ul>
          </div>
          <div class="observation-card">
            <h3>交通轴载监测</h3>
            <ul>
              <li>设备配置：动态称重系统</li>
              <li>监测指标：交通轴载、交通量、车型、车速等</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="feature-section">
        <h2>监测技术特点</h2>
        <div class="feature-list">
          <div class="feature-item">
            <h3>多类型传感器融合</h3>
            <p>采用光纤光栅式传感器、分布式光纤传感器、电阻式传感器等多种先进传感技术</p>
          </div>
          <div class="feature-item">
            <h3>全断面监测</h3>
            <p>在路面各结构层（上面层、下面层、基层、底基层）和路基关键位置布设传感器</p>
          </div>
          <div class="feature-item">
            <h3>长期性能研究</h3>
            <p>通过长期观测数据分析结构、材料性能演化规律，为工程养护决策提供支持</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
}
</script>

<style scoped>
.welcome-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.header-section {
  text-align: center;
  padding: 40px 0;
  background: url('@/assets/welcome-background.png') no-repeat center center;
  background-size: cover;
  color: white;
  border-radius: 8px;
  margin-bottom: 30px;
  position: relative;
}

.header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  z-index: 0;
}

.header-section h1,
.header-section .subtitle {
  position: relative;
  z-index: 1;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2rem;
  font-weight: 300;
}

h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

h3 {
  font-size: 1.3rem;
  color: #34495e;
  margin-bottom: 15px;
}

.content-section {
  padding: 0 20px;
}

.background-section {
  margin-bottom: 40px;
  line-height: 1.6;
}

.observation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 改为两列 */
  gap: 20px;
  margin-bottom: 40px;
}

.observation-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.observation-card ul {
  padding-left: 20px;
}

.observation-card li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-item {
  background: #e8f4fc;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.feature-item p {
  line-height: 1.6;
  color: #555;
}

@media (max-width: 768px) {
  .header-section {
    padding: 30px 0;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .observation-grid,
  .feature-list {
    grid-template-columns: 1fr;
  }
}
</style>
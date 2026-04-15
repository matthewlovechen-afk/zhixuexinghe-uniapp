<template>
  <view class="virtual-learning-container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">虚拟学习环境</text>
    </view>
    
    <!-- 选项卡切换 -->
    <view class="tabs-container">
      <scroll-view class="tabs-scroll" scroll-x="true" scroll-with-animation="true">
        <view class="tabs">
          <view 
            v-for="(tab, index) in tabs" 
            :key="index"
            :class="['tab-item', { active: activeTab === index }]"
            @click="switchTab(index)"
          >
            {{ tab }}
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 内容区域 -->
    <view class="content-area">
      <component :is="currentComponent"></component>
    </view>
  </view>
</template>

<script>
import Elementary from './elementary.vue'
import Middle from './middle.vue'
import University from './university.vue'
import JuniorExam from './juniorExam.vue'
import SeniorExam from './seniorExam.vue'
import PostgraduateExam from './postgraduateExam.vue'

export default {
  components: {
    Elementary,
    Middle,
    University,
    JuniorExam,
    SeniorExam,
    PostgraduateExam
  },
  data() {
    return {
      activeTab: 3, // 默认选中中考
      tabs: ['小学', '中学', '大学', '中考', '高考', '考研'],
      components: ['Elementary', 'Middle', 'University', 'JuniorExam', 'SeniorExam', 'PostgraduateExam']
    }
  },
  computed: {
    currentComponent() {
      return this.components[this.activeTab]
    }
  },
  methods: {
    switchTab(index) {
      this.activeTab = index
    }
  }
}
</script>

<style scoped lang="scss">
.virtual-learning-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  
  .header {
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #eee;
    
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #333;
    }
  }
  
  .tabs-container {
    background: #fff;
    border-bottom: 1px solid #eee;
    
    .tabs-scroll {
      width: 100%;
      white-space: nowrap;
    }
    
    .tabs {
      display: flex;
      padding: 0 12px;
      
      .tab-item {
        flex-shrink: 0;
        padding: 12px 16px;
        font-size: 14px;
        color: #666;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        
        &.active {
          color: #ff6b6b;
          border-bottom-color: #ff6b6b;
          font-weight: 600;
        }
      }
    }
  }
  
  .content-area {
    flex: 1;
    overflow: hidden;
  }
}
</style>
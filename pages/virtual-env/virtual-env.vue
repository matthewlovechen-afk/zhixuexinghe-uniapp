<template>
  <view class="future-container">
    <scroll-view class="nav-bar" scroll-x :show-scrollbar="false" :scroll-into-view="'tab-' + currentTab">
      <view class="nav-list">
        <view 
          v-for="(item, index) in navList" 
          :key="index"
          :id="'tab-' + index"
          class="nav-item" 
          :class="{ active: currentTab === index }"
          @click="switchTab(index)"
        >
          <text class="nav-text">{{ item.name }}</text>
          <view v-if="currentTab === index" class="tech-line" :style="{ backgroundColor: item.color }"></view>
        </view>
      </view>
    </scroll-view>

    <swiper class="content-swiper" :current="currentTab" @change="onSwiperChange">
      
      <swiper-item>
        <scroll-view scroll-y class="scroll-content">
          <view class="zone-header primary-border">
            <view class="zone-title-wrapper">
              <text class="zone-icon">🪐</text>
              <text class="zone-title primary-color">启蒙星系舱 (小学)</text>
            </view>
            <text class="zone-subtitle">趣味互动 / 基础认知探索</text>
          </view>
          
          <view class="future-card primary-style" v-for="(link, idx) in primaryLinks" :key="idx" @click="openWebview(link.url)">
            <view class="card-border-top"></view>
            <view class="card-info">
              <view class="card-title">{{ link.title }}</view>
              <view class="card-desc">{{ link.desc }}</view>
            </view>
            <view class="future-btn primary-btn">传送 >></view>
          </view>
        </scroll-view>
      </swiper-item>

      <swiper-item>
        <scroll-view scroll-y class="scroll-content">
          <view class="zone-header middle-border">
            <view class="zone-title-wrapper">
              <text class="zone-icon">🧬</text>
              <text class="zone-title middle-color">量子实验室 (中学)</text>
            </view>
            <text class="zone-subtitle">深度推演 / 全息理化生模拟</text>
          </view>

          <view class="future-card middle-style" v-for="(link, idx) in middleLinks" :key="idx" @click="openWebview(link.url)">
            <view class="card-border-top"></view>
            <view class="card-info">
              <view class="card-title">{{ link.title }}</view>
              <view class="card-desc">{{ link.desc }}</view>
            </view>
            <view class="future-btn middle-btn">启动协议</view>
          </view>
        </scroll-view>
      </swiper-item>

      <swiper-item>
        <scroll-view scroll-y class="scroll-content">
          <view class="zone-header uni-border">
            <view class="zone-title-wrapper">
              <text class="zone-icon">🌌</text>
              <text class="zone-title uni-color">元宇宙枢纽 (大学)</text>
            </view>
            <text class="zone-subtitle">高阶学术 / 虚拟研讨与论文库</text>
          </view>

          <view class="future-card uni-style" v-for="(link, idx) in universityLinks" :key="idx" @click="openWebview(link.url)">
             <view class="card-border-top"></view>
            <view class="card-info">
              <view class="card-title">{{ link.title }}</view>
              <view class="card-desc">{{ link.desc }}</view>
            </view>
            <view class="future-btn uni-btn">接入神经网</view>
          </view>
        </scroll-view>
      </swiper-item>

      <swiper-item>
        <scroll-view scroll-y class="scroll-content">
          <view class="zone-header arena-border">
            <view class="zone-title-wrapper">
              <text class="zone-icon">🏆</text>
              <text class="zone-title arena-color">备考竞技场 (大赛)</text>
            </view>
            <text class="zone-subtitle">全真模拟 / 高频考点冲刺计划</text>
          </view>

          <view class="future-card arena-style" v-for="(link, idx) in arenaLinks" :key="idx" @click="openWebview(link.url)">
             <view class="card-border-top"></view>
             <view class="tag-box">{{ link.tag }}</view>
            <view class="card-info">
              <view class="card-title">{{ link.title }}</view>
              <view class="card-desc">{{ link.desc }}</view>
            </view>
            <view class="future-btn arena-btn">进入战场</view>
          </view>
        </scroll-view>
      </swiper-item>

    </swiper>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const currentTab = ref(0);

const navList = ref([
  { name: '小学舱', color: '#007aff' },
  { name: '中学舱', color: '#805ad5' },
  { name: '大学枢纽', color: '#00a870' },
  { name: '竞技场', color: '#ff9500' }
]);

// --- 阶段数据配置 ---
const primaryLinks = ref([
  { title: '智慧教育平台', desc: '教育部官方同步微课资源', url: 'https://basic.smartedu.cn/' },
  { title: 'Scratch 创意中心', desc: '少儿图形化编程与创意空间', url: 'https://scratch.mit.edu/' }
]);

const middleLinks = ref([
  { title: 'PhET 全息实验室', desc: '物理、化学、生物交互式模拟', url: 'https://phet.colorado.edu/zh_CN/' },
  { title: '可汗学院', desc: '全学科深度知识解析库', url: 'https://zh.khanacademy.org/' }
]);

const universityLinks = ref([
  { title: 'Coursera 学术网', desc: '全球名校元宇宙与前沿课', url: 'https://www.coursera.org/' },
  { title: 'arXiv 论文库', desc: '实时同步全球最新科研进展', url: 'https://arxiv.org/' }
]);

// --- 竞技场数据 (针对中考、高考、考研) ---
const arenaLinks = ref([
  { tag: '中考', title: '中考资源网', desc: '历年真题模拟与考点大纲解析', url: 'http://www.zk5u.com/' },
  { tag: '高考', title: '阳光高考平台', desc: '教育部官方高招信息与备考指引', url: 'https://gaokao.chsi.com.cn/' },
  { tag: '考研', title: '研招网 (YZW)', desc: '全国硕士研究生招生考试官方门户', url: 'https://yz.chsi.com.cn/' }
]);

const switchTab = (index) => { currentTab.value = index; };
const onSwiperChange = (e) => { currentTab.value = e.detail.current; };
const openWebview = (url) => {
  uni.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url)}` });
};
</script>

<style scoped>
.future-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa; /* 浅灰色背景，保证打印清晰 */
  color: #333;
}

/* 顶部导航 */
.nav-bar {
  width: 100%; height: 90rpx;
  background: #ffffff;
  border-bottom: 1px solid #e0e6ed;
  white-space: nowrap;
}

.nav-list { display: flex; align-items: center; height: 100%; }
.nav-item {
  position: relative; display: inline-flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 0 40rpx; height: 100%;
}
.nav-text { font-size: 28rpx; color: #7a8ba3; transition: all 0.3s; }
.nav-item.active .nav-text { color: #333; font-weight: bold; font-size: 30rpx; }
.tech-line {
  position: absolute; bottom: 0; width: 50%; height: 6rpx; border-radius: 4rpx;
}

/* 内容区域 */
.content-swiper { flex: 1; height: calc(100vh - 90rpx); }
.scroll-content { height: 100%; padding: 30rpx; box-sizing: border-box; }

/* 标题样式 */
.zone-header {
  margin-bottom: 40rpx; padding-left: 24rpx; position: relative;
}
.zone-header::before {
  content: ''; position: absolute; left: 0; top: 8rpx; bottom: 8rpx; width: 6rpx; border-radius: 4rpx;
}
.primary-border::before { background: #007aff; }
.middle-border::before { background: #805ad5; }
.uni-border::before { background: #00a870; }
.arena-border::before { background: #ff9500; }

.zone-title { font-size: 36rpx; font-weight: 900; }
.zone-subtitle { display: block; font-size: 24rpx; color: #8b9bb4; margin-top: 8rpx; }

/* 卡片设计 */
.future-card {
  position: relative; display: flex; align-items: center;
  background: #ffffff; border: 1px solid #e0e6ed;
  border-radius: 12rpx; padding: 30rpx; margin-bottom: 30rpx;
  box-shadow: 0 4px 12rpx rgba(0,0,0,0.03);
  overflow: hidden;
}
.card-border-top { position: absolute; top: 0; left: 0; width: 100%; height: 4rpx; }

/* 板块标签 */
.tag-box {
  position: absolute; right: -20rpx; top: -10rpx;
  background: #ff9500; color: #fff; font-size: 20rpx;
  padding: 10rpx 40rpx; transform: rotate(15deg);
  font-weight: bold; opacity: 0.8;
}

.card-info { flex: 1; }
.card-title { font-size: 32rpx; font-weight: bold; color: #1a202c; }
.card-desc { font-size: 24rpx; color: #718096; margin-top: 10rpx; }

/* 按钮 */
.future-btn {
  font-size: 24rpx; padding: 12rpx 20rpx; border-radius: 8rpx;
  font-weight: bold; border: 1px solid transparent;
}

/* 主题色应用 */
.primary-color { color: #007aff; }
.primary-style .card-border-top { background: #007aff; }
.primary-btn { color: #007aff; border-color: #007aff; background: rgba(0,122,255,0.05); }

.middle-color { color: #805ad5; }
.middle-style .card-border-top { background: #805ad5; }
.middle-btn { color: #805ad5; border-color: #805ad5; background: rgba(128,90,213,0.05); }

.uni-color { color: #00a870; }
.uni-style .card-border-top { background: #00a870; }
.uni-btn { color: #00a870; border-color: #00a870; background: rgba(0,168,112,0.05); }

.arena-color { color: #ff9500; }
.arena-style .card-border-top { background: #ff9500; }
.arena-btn { color: #ff9500; border-color: #ff9500; background: rgba(255,149,0,0.05); }
</style>
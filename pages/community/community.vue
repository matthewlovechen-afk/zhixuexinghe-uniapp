<template>
  <view class="container">
    <!-- 背景装饰 (可选) -->
    <view class="bg-decoration"></view>

    <!-- 主要内容区域 -->
    <view class="content">
      <!-- 社区 Logo / 图标 (这里用文字代替，你可以替换为图片) -->
      <view class="logo">
        <text class="logo-text">知星岛</text>
      </view>

      <!-- 社区介绍文案 -->
      <view class="intro">
        <text class="intro-title">欢迎来到知星岛</text>
        <text class="intro-desc">在这里，每个星球都有答案。学习上的任何困惑，你都可以在这里找到共鸣和解答。</text>
      </view>

      <!-- 进入社区按钮 -->
      <view class="btn-container">
        <button class="enter-btn" @click="goToCommunity">进入社区</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 你的社区地址
      communityUrl: 'https://129.146.117.41.nip.io'
    }
  },
  methods: {
    goToCommunity() {
      console.log('按钮被点击了'); // 调试：看控制台是否有打印

      // 方法一：推荐用于 App，调用系统浏览器打开（体验最好，不卡顿）
      if (uni.getSystemInfoSync().platform === 'app-plus') {
        plus.runtime.openURL(this.communityUrl);
      } else {
        // 方法二：用于 H5 或小程序环境，或者你想在当前 App 内嵌浏览器打开
        // 如果你想在 App 内部打开网页（而不是跳到手机浏览器），请使用 uni.navigateTo 跳转到一个 web-view 页面
        // 这里为了简单，先演示直接跳转
        window.location.href = this.communityUrl;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 背景装饰，增加层次感 */
.bg-decoration {
  position: absolute;
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  top: -100px;
  right: -100px;
  opacity: 0.1;
}

.content {
  position: relative;
  text-align: center;
  padding: 20px;
  z-index: 10;
}

.logo {
  margin-bottom: 40px;
}

.logo-text {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.intro {
  margin-bottom: 60px;
}

.intro-title {
  font-size: 24px;
  color: #333;
  font-weight: 600;
  margin-bottom: 15px;
  display: block;
}

.intro-desc {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  display: block;
}

.btn-container {
  width: 100%;
}

.enter-btn {
  width: 100%;
  max-width: 300px;
  background-color: #6366f1;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  padding: 12px 0;
  border: none;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
}

.enter-btn:hover {
  background-color: #5a5de0;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}
</style>

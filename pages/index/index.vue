<template>
  <view class="container">
    <view class="header">
      <text class="title">学习资源推荐</text>
      <text class="subtitle"> 多平台学习资源</text>
    </view>

    <view class="card">
      <view class="form-item">
        <text class="label">年级</text>
        <picker @change="onGradeChange" :range="gradeList">
          <view class="picker">{{ grade }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">学科</text>
        <input v-model="subject" class="input" placeholder="例如：数学、物理、英语、编程" />
      </view>

      <view class="form-item">
        <text class="label">推荐数量</text>
        <picker @change="onTopKChange" :range="topKList">
          <view class="picker">{{ top_k }} 条</view>
        </picker>
      </view>

      <button class="submit-btn" @click="getRecommend" :loading="loading">
        开始推荐
      </button>
    </view>

    <view class="card result-card" v-if="showResult">
      <view class="result-title-bar">推荐结果</view>
      <view class="result-item" v-for="(item, idx) in list" :key="idx">
        <view class="item-name">{{ idx + 1 }}. {{ item.title }}</view>
        <view class="item-tags">
          <text class="tag tag-source">{{ item.source }}</text>
          <text class="tag tag-type">{{ item.resource_type }}</text>
          <text class="tag tag-diff">{{ item.difficulty }}</text>
          <text class="tag tag-score">匹配度 {{ Math.round(item.score * 100) }}%</text>
        </view>
        <view class="item-desc">{{ item.description || '暂无简介' }}</view>
        
        <!-- ✅ 这里修好了！-->
        <view class="result-link" @click="openLink(item.url)">
          查看详情 →
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      gradeList: ['小学', '初中', '高中', '大学'],
      grade: '初中',
      subject: '数学',
      topKList: ['5', '10', '15', '20'],
      top_k: '10',
      loading: false,
      list: [],
      showResult: false
    }
  },
  methods: {
    // ✅ 正确的跳转方法
    openLink(url) {
      const encodedUrl = encodeURIComponent(url);
      uni.navigateTo({
        url: `/pages/webview/webview?url=${encodedUrl}`
      });
    },

    onGradeChange(e) {
      this.grade = this.gradeList[e.detail.value]
    },

    onTopKChange(e) {
      this.top_k = this.topKList[e.detail.value]
    },

    async getRecommend() {
      if (!this.subject.trim()) {
        uni.showToast({ title: '请输入学科', icon: 'none' })
        return
      }

      this.loading = true
      this.showResult = false

      try {
        const res = await uni.request({
          url: 'http://116.62.128.164:8080/recommend',
          method: 'GET',
          data: {
            grade: this.grade,
            subject: this.subject,
            top_k: this.top_k
          }
        })

        const data = res.data
        if (data.status === 'success') {
          this.list = data.recommendations
          this.showResult = true
        } else {
          uni.showToast({ title: data.error || '获取失败', icon: 'none' })
        }
      } catch (err) {
        uni.showToast({ title: '网络请求错误', icon: 'none' })
      }

      this.loading = false
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.header {
  text-align: center;
  color: #fff;
  margin: 40rpx 0 60rpx;
}

.title {
  font-size: 50rpx;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  opacity: 0.9;
  margin-top: 10rpx;
  display: block;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 36rpx;
}

.label {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
  color: #333;
}

.picker, .input {
  border: 2rpx solid #eaeaea;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  background: #fff;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  margin-top: 20rpx;
}

.result-title-bar {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}

.result-item {
  border-left: 6rpx solid #667eea;
  padding-left: 24rpx;
  margin-bottom: 40rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 30rpx;
}

.tag-source {
  background: #667eea;
  color: #fff;
}

.tag-type {
  background: #eee;
  color: #666;
}

.tag-diff {
  background: #fff3e0;
  color: #e67e22;
}

.tag-score {
  color: #f39c12;
  font-weight: 500;
}

.item-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.result-link {
  font-size: 26rpx;
  color: #667eea;
}
</style>

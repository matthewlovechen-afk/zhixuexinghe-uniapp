<template>
  <view class="container">
    <view class="header">
      <text class="title">个性化推荐智能学习系统</text>
      <text class="subtitle">基于内容推荐(CNN) + 协同过滤 | 精准匹配你的学习需求</text>
    </view>

    <view class="tabs">
      <view class="tab-btn" :class="{ active: currentTab === 'active' }" @click="switchTab('active')">探索新内容</view>
      <view class="tab-btn" :class="{ active: currentTab === 'auto' }" @click="switchTab('auto')">猜你喜欢</view>
      <view class="tab-btn" :class="{ active: currentTab === 'hybrid' }" @click="switchTab('hybrid')">智能推荐</view>
    </view>

    <!-- 探索新内容（原主动推荐） -->
    <view v-if="currentTab === 'active'" class="card">
      <view class="card-title">探索新内容</view>
      <view class="info-note">
        <text v-if="currentUser">当前用户：{{ currentUser.username || currentUser.nickname || '用户' }}</text>
        <text v-else>请先登录</text>
      </view>
      <view class="info-note">说明：根据你选择的年级和学科，推荐最匹配的学习资源（适合探索新领域）</view>
      <view class="form-group">
        <text class="label">年级</text>
        <picker @change="onGradeChange" :range="gradeList">
          <view class="picker">{{ activeGrade }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="label">学科</text>
        <input v-model="activeSubject" class="input" placeholder="例如: 数学" />
      </view>
      <view class="form-group">
        <text class="label">推荐数量</text>
        <picker @change="onTopKChange($event, 'active')" :range="topKList">
          <view class="picker">{{ activeTopK }}条</view>
        </picker>
      </view>
      <button class="submit-btn" @click="getActiveRecommend">开始推荐</button>
    </view>

    <!-- 猜你喜欢（原自动推荐） -->
    <view v-if="currentTab === 'auto'" class="card">
      <view class="card-title">猜你喜欢</view>
      <view class="info-note">
        <text v-if="currentUser">当前用户：{{ currentUser.username || currentUser.nickname || '用户' }}</text>
        <text v-else>请先登录</text>
      </view>
      <view class="info-note">说明：根据你的历史学习记录，智能推荐你可能感兴趣的内容（适合日常使用）</view>
      <view class="form-group">
        <text class="label">推荐数量</text>
        <picker @change="onTopKChange($event, 'auto')" :range="topKList">
          <view class="picker">{{ autoTopK }}条</view>
        </picker>
      </view>
      <button class="submit-btn" @click="getAutoRecommend" :disabled="!currentUser">
        {{ currentUser ? '开始推荐' : '请先登录' }}
      </button>
    </view>

    <!-- 智能推荐（原混合推荐） -->
    <view v-if="currentTab === 'hybrid'" class="card">
      <view class="card-title">智能推荐</view>
      <view class="info-note">
        <text v-if="currentUser">当前用户：{{ currentUser.username || currentUser.nickname || '用户' }}</text>
        <text v-else>请先登录</text>
      </view>
      <view class="info-note">说明：结合你的学习历史和当前兴趣，综合推荐最优资源（推荐使用）</view>
      <view class="form-group">
        <text class="label">年级</text>
        <picker @change="onHybridGradeChange" :range="gradeList">
          <view class="picker">{{ hybridGrade }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="label">学科</text>
        <input v-model="hybridSubject" class="input" placeholder="例如: 数学" />
      </view>
      <view class="form-group">
        <text class="label">推荐数量</text>
        <picker @change="onTopKChange($event, 'hybrid')" :range="topKList">
          <view class="picker">{{ hybridTopK }}条</view>
        </picker>
      </view>
      <button class="submit-btn" @click="getHybridRecommend" :disabled="!currentUser">
        {{ currentUser ? '开始推荐' : '请先登录' }}
      </button>
    </view>

    <view v-if="showResult" class="card result-card">
      <view class="card-title">推荐结果</view>
      
      <view v-if="loading" class="loading-area">
        <text>正在获取推荐资源，请稍候...</text>
      </view>
      <view v-else-if="errorMsg" class="error">
        <text>{{ errorMsg }}</text>
      </view>
      <view v-else-if="list.length === 0" class="error">
        <text>暂无推荐结果，请尝试其他条件</text>
      </view>
      <view v-else>
        <view class="result-item" v-for="(item, idx) in list" :key="idx">
          <view class="item-name">{{ idx + 1 }}. {{ item.title }}</view>
          <view class="item-tags">
            <text class="tag tag-source">{{ item.source }}</text>
            <text class="tag tag-type">{{ item.resource_type }}</text>
            <text class="tag tag-diff">{{ item.difficulty }}</text>
            <text v-if="item.score" class="tag tag-score">匹配度 {{ Math.round(item.score * 100) }}%</text>
          </view>
          <view class="item-desc">学科: {{ item.subject || '暂无' }}</view>
          <view class="result-link" @click="openLink(item.url)">点击查看详情 →</view>
        </view>
        
        <view class="stats">
          <text>共找到 {{ resultData.total || 0 }} 条推荐结果 | 推荐类型: {{ resultData.type || '未知' }}</text>
          <view v-if="resultData.grade">年级: {{ resultData.grade }}</view>
          <view v-if="resultData.subject">学科: {{ resultData.subject }}</view>
          <view v-if="resultData.user_id">用户ID: {{ resultData.user_id }}</view>
          <view v-if="resultData.message" class="stats-msg">{{ resultData.message }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 'active',
      gradeList: ['小学', '初中', '高中', '大学'],
      topKList: ['5', '10', '15', '20'],
      
      activeGrade: '初中',
      activeSubject: '数学',
      activeTopK: '10',

      autoTopK: '10',

      hybridGrade: '初中',
      hybridSubject: '数学',
      hybridTopK: '10',

      loading: false,
      showResult: false,
      errorMsg: '',
      list: [],
      resultData: {},
      
      currentUser: null
    }
  },
  onLoad() {
    this.checkLoginStatus();
  },
  onShow() {
    this.checkLoginStatus();
  },
  methods: {
    checkLoginStatus() {
      const userInfo = uni.getStorageSync('userInfo');
      if (userInfo && userInfo._id) {
        this.currentUser = userInfo;
        console.log('当前登录用户ID:', userInfo._id);
      } else {
        this.currentUser = null;
        console.log('用户未登录');
      }
    },

    switchTab(tab) {
      this.currentTab = tab;
      this.showResult = false;
    },

    onGradeChange(e) {
      this.activeGrade = this.gradeList[e.detail.value];
    },
    onHybridGradeChange(e) {
      this.hybridGrade = this.gradeList[e.detail.value];
    },
    onTopKChange(e, type) {
      const val = this.topKList[e.detail.value];
      if (type === 'active') this.activeTopK = val;
      if (type === 'auto') this.autoTopK = val;
      if (type === 'hybrid') this.hybridTopK = val;
    },

    openLink(item) {
        if(!item || !item.url) return;
        
        const encodedUrl = encodeURIComponent(item.url);
        const resourceId = item.resource_id || this.generateResourceId(item);
        
        uni.navigateTo({
            url: `/pages/webview/webview?url=${encodedUrl}&resource_id=${resourceId}`
        });
    },
    
    // 辅助方法：如果没有resource_id，根据标题生成一个
    generateResourceId(item) {
        // 简单生成一个唯一标识
        return String(item.title || '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').substring(0, 20) + '_' + Date.now();
    },
    
    async saveActionLog(type, params) {
        const userInfo = uni.getStorageSync('userInfo'); 
        if (!userInfo || !userInfo._id) {
          console.log('用户未登录，跳过行为记录');
          return; 
        }
    
        try {
          await uniCloud.callFunction({
            name: 'add-recommend-history',
            data: {
              user_id: userInfo._id,
              recommend_type: type,
              grade: params.grade || '',
              subject: params.subject || '',
              top_k: params.top_k || 10,
              target_user_id: params.target_user_id || ''
            }
          });
          console.log(`[${type}] 行为记录已成功存入数据库`);
        } catch (e) {
          console.error('行为记录存储失败:', e);
        }
      },
    
    async getActiveRecommend() {
      if (!this.activeSubject.trim()) {
        uni.showToast({ title: '请输入学科', icon: 'none' });
        return;
      }
      
      if (!this.currentUser) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      this.showLoadingState();

      try {
        const requestData = {
          grade: this.activeGrade,
          subject: this.activeSubject,
          top_k: this.activeTopK
        };
        
        if (this.currentUser && this.currentUser._id) {
          requestData.user_id = this.currentUser._id;
        }
        
        const res = await uni.request({
          url: `http://116.62.128.164:8080/recommend/active`,
          method: 'GET',
          data: requestData
        });

        this.handleResponse(res.data);
        
        if (res.data.status === 'success') {
          this.saveActionLog('active', {
            grade: this.activeGrade,
            subject: this.activeSubject,
            top_k: this.activeTopK
          });
        }
      } catch (err) {
        this.errorMsg = '网络错误: 请求失败';
      }
      this.loading = false;
    },
    
    async getAutoRecommend() {
      if (!this.currentUser) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      this.showLoadingState();

      try {
        const res = await uni.request({
          url: `http://116.62.128.164:8080/recommend/auto`,
          method: 'GET',
          data: {
            user_id: this.currentUser._id,
            top_k: this.autoTopK
          }
        });
        this.handleResponse(res.data);

        if (res.data.status === 'success') {
          this.saveActionLog('auto', {
            target_user_id: this.currentUser._id,
            top_k: this.autoTopK
          });
        }
      } catch (err) {
        this.errorMsg = '网络错误: 请求失败';
      }
      this.loading = false;
    },
    
    async getHybridRecommend() {
      if (!this.currentUser) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      this.showLoadingState();

      try {
        const res = await uni.request({
          url: `http://116.62.128.164:8080/recommend/hybrid`,
          method: 'GET',
          data: {
            user_id: this.currentUser._id,
            grade: this.hybridGrade,
            subject: this.hybridSubject,
            top_k: this.hybridTopK
          }
        });
        this.handleResponse(res.data);

        if (res.data.status === 'success') {
          this.saveActionLog('hybrid', {
            target_user_id: this.currentUser._id,
            grade: this.hybridGrade,
            subject: this.hybridSubject,
            top_k: this.hybridTopK
          });
        }
      } catch (err) {
        this.errorMsg = '网络错误: 请求失败';
      }
      this.loading = false;
    },

    showLoadingState() {
      this.showResult = true;
      this.loading = true;
      this.errorMsg = '';
      this.list = [];
      this.resultData = {};
    },

    handleResponse(data) {
      if (data.status !== 'success') {
        this.errorMsg = data.message || '获取推荐失败';
        return;
      }
      this.list = data.recommendations || [];
      this.resultData = data;
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
  font-size: 40rpx;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  opacity: 0.9;
  margin-top: 10rpx;
  display: block;
}

.tabs {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.tab-btn {
  flex: 1;
  padding: 24rpx 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  text-align: center;
  transition: all 0.3s;
}

.tab-btn.active {
  background: #fff;
  color: #667eea;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}

.info-note {
  background: #e8f4fd;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  font-size: 26rpx;
  color: #0066cc;
}

.form-group {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
  color: #333;
}

.picker, .input {
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  background: #fff;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
  margin-top: 40rpx;
  padding: 10rpx 0;
}

.loading-area, .error {
  text-align: center;
  padding: 40rpx;
  font-size: 28rpx;
}

.loading-area {
  color: #667eea;
}

.error {
  background: #fee;
  color: #c33;
  border-radius: 16rpx;
}

.result-item {
  border-left: 8rpx solid #667eea;
  background: #f8f9fa;
  padding: 24rpx;
  margin-bottom: 30rpx;
  border-radius: 0 16rpx 16rpx 0;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  color: #333;
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

.tag-source { background: #667eea; color: #fff; }
.tag-type { background: #e0e0e0; color: #666; }
.tag-diff { background: #fff3e0; color: #e67e22; }
.tag-score { color: #f39c12; font-weight: 500; }

.item-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.result-link {
  font-size: 26rpx;
  color: #667eea;
}

.stats {
  text-align: center;
  color: #666;
  margin-top: 40rpx;
  font-size: 24rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #e0e0e0;
  line-height: 1.8;
}

.stats-msg {
  color: #e67e22;
  margin-top: 10rpx;
}
</style>

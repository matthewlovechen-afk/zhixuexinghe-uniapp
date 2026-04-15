<template>
  <view class="video-card">
    <!-- 视频缩略图 -->
    <view class="video-thumbnail">
      <image :src="video.thumbnail" class="thumbnail-img"></image>
      <view class="duration-badge">{{ video.duration }}</view>
    </view>
    
    <!-- 视频信息 -->
    <view class="video-info">
      <view class="video-title">{{ video.title }}</view>
      <view class="video-meta">
        <text class="author">{{ video.author }}</text>
      </view>
      <view class="video-stats">
        <text class="stat-item">👁 {{ video.views }}</text>
        <text class="stat-item">👍 {{ video.likes }}</text>
        <text class="stat-item">💬 {{ video.comments }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VideoCard',
  props: {
    video: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped lang="scss">
.video-card {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  
  .video-thumbnail {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; // 16:9 aspect ratio
    background: #f0f0f0;
    
    .thumbnail-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .duration-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
  }
  
  .video-info {
    padding: 12px;
    
    .video-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .video-meta {
      font-size: 12px;
      color: #999;
      margin-bottom: 8px;
      
      .author {
        display: inline-block;
      }
    }
    
    .video-stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
      
      .stat-item {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
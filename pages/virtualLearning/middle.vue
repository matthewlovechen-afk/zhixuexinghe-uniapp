<template>
  <view class="empty-page">
    <view class="empty-icon">📚</view>
    <text class="empty-text">中学学习环境建设中...</text>
  </view>
</template>

<script>
export default {
  name: 'Middle'
}
</script>

<style scoped lang="scss">
.empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 16px;
    color: #999;
  }
}
</style>
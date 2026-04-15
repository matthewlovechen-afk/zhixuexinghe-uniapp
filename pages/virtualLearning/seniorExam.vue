<template>
  <view class="exam-page">
    <scroll-view class="scroll-view" scroll-y="true">
      <view class="videos-list">
        <VideoCard 
          v-for="video in videos" 
          :key="video.id"
          :video="video"
        ></VideoCard>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import VideoCard from '@/components/VideoCard.vue'
import { seniorExamVideos } from '@/data/videos.js'

export default {
  name: 'SeniorExam',
  components: {
    VideoCard
  },
  data() {
    return {
      videos: seniorExamVideos
    }
  }
}
</script>

<style scoped lang="scss">
.exam-page {
  height: 100%;
  
  .scroll-view {
    height: 100%;
  }
  
  .videos-list {
    padding: 12px;
  }
}
</style>
<template>
    <view class="webview-container">
        <web-view :src="url" @message="handleMessage"></web-view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            url: ''
        }
    },
    onLoad(options) {
        if (options.url) {
            this.url = decodeURIComponent(options.url);
        }
        
        // 记录点击行为
        this.recordClick(options);
    },
    methods: {
        recordClick(options) {
            const userInfo = uni.getStorageSync('userInfo');
            const resourceId = options.resource_id || '';
            
            if (userInfo && userInfo._id && resourceId) {
                uni.request({
                    url: 'http://116.62.128.164:8080/record/click',
                    method: 'POST',
                    data: {
                        user_id: userInfo._id,
                        resource_id: resourceId
                    }
                });
                
                // 记录开始时间
                this.startTime = Date.now();
                this.currentResourceId = resourceId;
            }
        }
    },
    onUnload() {
        // 记录完成学习
        if (this.startTime && this.currentResourceId) {
            const duration = Math.floor((Date.now() - this.startTime) / 1000);
            const userInfo = uni.getStorageSync('userInfo');
            
            if (duration > 10) {
                uni.request({
                    url: 'http://116.62.128.164:8080/record/complete',
                    method: 'POST',
                    data: {
                        user_id: userInfo._id,
                        resource_id: this.currentResourceId,
                        duration_seconds: duration
                    }
                });
            }
        }
    }
}
</script>

<template>
    <view class="webview-container">
        <web-view 
            :src="url" 
            @message="handleMessage"
            @load="onWebviewLoad"
            @error="onWebviewError">
        </web-view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            url: '',
            startTime: null,
            currentResourceId: '',
            loadCount: 0
        }
    },
    onLoad(options) {
        if (options.url) {
            this.url = decodeURIComponent(options.url);
        }
		if (options.resource_id) {
		        this.currentResourceId = options.resource_id;
		    }
        this.recordClick(options);
    },
	onBackPress(e) {
	        // 阻止默认返回行为，确保返回到推荐页面而非登录页
	        console.log('webview 返回');
	        // 不返回 true，让系统正常处理
	    },
    methods: {
        onWebviewLoad(e) {
            this.loadCount++;
            console.log('web-view加载完成，次数:', this.loadCount);
        },
        onWebviewError(e) {
            console.error('web-view加载错误:', e);
        },
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
                
                this.startTime = Date.now();
                this.currentResourceId = resourceId;
            }
        },
        handleMessage(e) {
            console.log('web-view message:', e.detail);
        }
    },
    onUnload() {
        // 记录完成学习
        if (this.startTime && this.currentResourceId) {
            const duration = Math.floor((Date.now() - this.startTime) / 1000);
            const userInfo = uni.getStorageSync('userInfo');
            
            if (duration > 10 && userInfo) {
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

<style scoped>
.webview-container {
    width: 100%;
    height: 100vh;
}
</style>

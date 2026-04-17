<template>
    <view class="webview-container">
        <!-- 自定义导航栏 -->
        <view class="custom-navbar" v-if="showNavbar">
            <view class="navbar-left" @click="goBack">
                <text class="back-icon">←</text>
                <text class="back-text">返回</text>
            </view>
            <view class="navbar-title">浏览内容</view>
            <view class="navbar-right"></view>
        </view>
        
        <!-- web-view 组件 -->
        <web-view 
            :src="url" 
            @message="handleMessage"
            :style="{ top: showNavbar ? '44px' : '0' }"
        ></web-view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            url: '',
            showNavbar: true,  // 是否显示导航栏
            startTime: null,
            currentResourceId: ''
        }
    },
    onLoad(options) {
        if (options.url) {
            this.url = decodeURIComponent(options.url);
        }
        this.recordClick(options);
    },
    methods: {
        goBack() {
            // 直接返回上一页（推荐页面）
            uni.navigateBack({
                delta: 1
            });
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
            // 接收 web-view 发送的消息（可选）
            console.log('web-view消息:', e);
        }
    },
    onUnload() {
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
    position: relative;
}

.custom-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    background-color: #667eea;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    z-index: 999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.navbar-left {
    display: flex;
    align-items: center;
    padding: 5px 10px;
}

.back-icon {
    font-size: 24px;
    color: #fff;
    margin-right: 5px;
}

.back-text {
    font-size: 16px;
    color: #fff;
}

.navbar-title {
    font-size: 16px;
    color: #fff;
    font-weight: bold;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

.navbar-right {
    width: 60px;
}

web-view {
    position: absolute;
    top: 44px;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
}
</style>

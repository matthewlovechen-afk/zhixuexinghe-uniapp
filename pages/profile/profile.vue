<template>
	<view class="profile-container">
		<view class="user-header">
			<image 
				class="avatar" 
				:src="displayAvatar" 
				mode="aspectFill"
			></image>
			<view class="info">
				<text class="username">{{ userInfo.username || '未登录' }}</text>
			</view>
		</view>

		<view class="action-list">
			<view class="action-item" @click="goTo('personal-info/personal-info')">
				<text>个人资料</text>
				<text class="arrow">></text>
			</view>
            
			<view class="action-item" @click="goTo('faq/faq')">
				<text>常见问题</text>
				<text class="arrow">></text>
			</view>
            
			<view class="action-item" @click="goTo('settings/settings')">
				<text>设置</text>
				<text class="arrow">></text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const userInfo = ref({});
const defaultAvatar = '/static/avatar-user.png'; 
const displayAvatar = ref(defaultAvatar);

onShow(async () => {
	const storedInfo = uni.getStorageSync('userInfo');
	if (storedInfo) {
		userInfo.value = storedInfo;
		
		// 核心修复：处理 cloud:// 协议，让网页端也能显示头像
		if (storedInfo.avatar && storedInfo.avatar.startsWith('cloud://')) {
			try {
				const res = await uniCloud.getTempFileURL({
					fileList: [storedInfo.avatar]
				});
				if (res.fileList && res.fileList[0].tempFileURL) {
					displayAvatar.value = res.fileList[0].tempFileURL;
				} else {
					displayAvatar.value = defaultAvatar;
				}
			} catch (e) {
				console.error('解析头像链接失败:', e);
				displayAvatar.value = defaultAvatar;
			}
		} else {
			displayAvatar.value = storedInfo.avatar || defaultAvatar;
		}
	} else {
		uni.reLaunch({ url: '/pages/login/login' });
	}
});

const goTo = (pageName) => {
	uni.navigateTo({
		url: `/pages/profile/${pageName}`
	});
};
</script>

<style lang="scss" scoped>
.profile-container {
	min-height: 100vh;
	background-color: #f5f6fa;
}
.user-header {
	display: flex;
	align-items: center;
	padding: 80rpx 40rpx;
	background-color: #ffffff;
	margin-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}
.avatar {
	width: 140rpx;
	height: 140rpx;
	border-radius: 70rpx;
	margin-right: 30rpx;
	background-color: #eee;
	border: 4rpx solid #fff;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.info {
	display: flex;
	flex-direction: column;
}
.username {
	font-size: 38rpx;
	font-weight: bold;
	color: #333;
}
.action-list {
	background-color: #ffffff;
	margin-bottom: 40rpx;
}
.action-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 34rpx 40rpx;
	border-bottom: 1rpx solid #f2f2f2;
	font-size: 30rpx;
	color: #333;
	
	&:active {
		background-color: #fafafa;
	}
}
.action-item:last-child {
	border-bottom: none;
}
.arrow {
	color: #ccc;
	font-weight: bold;
	margin-left: 10rpx;
}
</style>
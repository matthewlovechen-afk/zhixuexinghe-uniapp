<template>
	<view class="settings-container">
		<view class="list-group">
			<view class="list-item" @click="goToUpdatePassword">
				<text class="title">修改密码</text>
				<text class="arrow">></text>
			</view>
			
			<view class="list-item" @click="clearCache">
				<text class="title">清除缓存</text>
				<text class="arrow">></text>
			</view>
		</view>
		
		<view class="logout-btn-wrapper">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>
	</view>
</template>

<script setup>
// 跳转到你已经写好的修改密码页面
const goToUpdatePassword = () => {
	uni.navigateTo({
		url: '/pages/profile/edit-password/edit-password'
	});
};

// 清除缓存
const clearCache = () => {
	// 先计算当前缓存大小 (可选，用来给用户更好的体验)
	const storageInfo = uni.getStorageInfoSync();
	const currentSize = storageInfo.currentSize; // 单位是 KB

	if (currentSize === 0) {
		return uni.showToast({ title: '暂无缓存可清理', icon: 'none' });
	}

	uni.showModal({
		title: '清理缓存',
		content: `当前共有 ${currentSize}KB 缓存，确定要清理吗？(不会退出登录)`,
		success: function (res) {
			if (res.confirm) {
				// 1. 先把核心的登录状态数据取出来保存
				const token = uni.getStorageSync('token');
				const userInfo = uni.getStorageSync('userInfo');
				
				// 2. 清空所有本地缓存（这会删掉一切）
				uni.clearStorageSync();
				
				// 3. 把核心数据重新存回去，保持登录状态
				if (token) uni.setStorageSync('token', token);
				if (userInfo) uni.setStorageSync('userInfo', userInfo);
				
				// 4. 提示清理成功
				uni.showToast({
					title: '清理完成',
					icon: 'success'
				});
			}
		}
	});
};

// 退出登录逻辑
const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: function (res) {
			if (res.confirm) {
				// 清除本地存储的用户信息和 token
				uni.clearStorageSync();
				// 重新跳转回登录页
				uni.reLaunch({
					url: '/pages/login/login'
				});
			}
		}
	});
};
</script>

<style scoped>
.settings-container {
	min-height: 100vh;
	background-color: #f5f6fa;
	padding-top: 20rpx;
}

.list-group {
	background-color: #fff;
	margin-bottom: 60rpx;
}

.list-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 34rpx 40rpx;
	border-bottom: 1rpx solid #f2f2f2;
}

.list-item:last-child {
	border-bottom: none;
}

.title {
	font-size: 30rpx;
	color: #333;
}

.arrow {
	color: #ccc;
	font-size: 30rpx;
	font-weight: bold;
}

.logout-btn-wrapper {
	padding: 0 40rpx;
}

.logout-btn {
	background-color: #fff;
	color: #ff4d4f;
	font-size: 32rpx;
	border-radius: 12rpx;
	border: none;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.logout-btn::after {
	border: none;
}
</style>
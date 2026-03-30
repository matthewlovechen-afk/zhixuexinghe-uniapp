<template>
	<view class="profile-container">
		<view class="user-header">
			<image 
				class="avatar" 
				:src="userInfo.avatar || defaultAvatar" 
				@click="changeAvatar" 
				mode="aspectFill"
			></image>
			<view class="info">
				<text class="username">{{ userInfo.username || '未登录' }}</text>
			</view>
		</view>

		<view class="action-list">
			<view class="action-item" @click="changeAvatar">
				<text>更换头像</text>
				<view class="right-area">
					<image v-if="uploading" class="loading-icon" src="/static/loading.gif" mode="aspectFit"></image>
					<text class="arrow">></text>
				</view>
			</view>
            
			<view class="action-item" @click="goTo('edit-username/edit-username')">
				<text>修改用户名</text>
				<text class="arrow">></text>
			</view>
            
			<view class="action-item" @click="goTo('edit-password/edit-password')">
				<text>修改密码</text>
				<text class="arrow">></text>
			</view>
		</view>

		<view class="logout-btn-wrap">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const userInfo = ref({});
const uploading = ref(false); // 用于控制上传状态显示
// 确保你在 static 目录下有一张默认头像，例如 static/avatar-user.png
const defaultAvatar = '/static/avatar-user.png'; 

// 每次进入页面时加载最新的用户信息
onShow(() => {
	const storedInfo = uni.getStorageSync('userInfo');
	if (storedInfo) {
		userInfo.value = storedInfo;
	} else {
		// 如果本地没有用户信息，说明可能未登录或缓存失效
		uni.reLaunch({ url: '/pages/login/login' });
	}
});

// 通用的页面跳转函数
const goTo = (pageName) => {
	uni.navigateTo({
		url: `/pages/profile/${pageName}`
	});
};

// 更换头像的核心逻辑
const changeAvatar = () => {
	if (!userInfo.value._id) {
		uni.showToast({ title: '用户信息异常，请重新登录', icon: 'none' });
		return;
	}

	// 1. 前端选择图片
	uni.chooseImage({
		count: 1, // 最多选择1张
		sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
		sourceType: ['album', 'camera'], // 从相册选择或使用相机
		success: async (res) => {
			const tempFilePath = res.tempFilePaths[0];
			
			// 开启加载提示
			uploading.value = true;
			uni.showLoading({ title: '正在上传...', mask: true });

			try {
				// 2. 上传至云存储
				// 定义云端存储路径，建议按用户ID归档，防止文件名冲突
				const cloudPath = `user-avatars/${userInfo.value._id}_${Date.now()}.jpg`;
				
				const uploadRes = await uniCloud.uploadFile({
					filePath: tempFilePath,
					cloudPath: cloudPath,
					onUploadProgress: (progressEvent) => {
						// 可以这里计算上传进度
						// console.log(progressEvent);
					}
				});

				// 上传成功后，uploadRes.fileID 就是云端图片的永久访问链接
				const fileID = uploadRes.fileID;
				console.log('上传成功，fileID:', fileID);

				// 3. 调用云函数更新数据库
				const updateRes = await uniCloud.callFunction({
					name: 'user-update',
					data: {
						uid: userInfo.value._id,
						avatarUrl: fileID
					}
				});

				if (updateRes.result.code === 200) {
					// 4. 更新前端状态和本地缓存
					// 更新响应式数据，界面会自动刷新
					userInfo.value.avatar = fileID;
					
					// 同步更新本地存储的完整用户信息
					const currentStoredInfo = uni.getStorageSync('userInfo') || {};
					currentStoredInfo.avatar = fileID;
					uni.setStorageSync('userInfo', currentStoredInfo);

					uni.showToast({ title: '头像更新成功', icon: 'success' });
				} else {
					uni.showToast({ title: updateRes.result.message || '更新失败', icon: 'none' });
				}

			} catch (err) {
				console.error('头像处理失败:', err);
				uni.showToast({ title: '网络错误，请稍后再试', icon: 'none' });
			} finally {
				// 无论成功失败，关闭加载提示
				uploading.value = false;
				uni.hideLoading();
			}
		},
		fail: (err) => {
			// 用户取消选择或选择失败
			console.log('选择图片失败或取消', err);
		}
	});
};

const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: function (res) {
			if (res.confirm) {
				uni.removeStorageSync('token');
				uni.removeStorageSync('userInfo');
				uni.reLaunch({ url: '/pages/login/login' });
			}
		}
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
	border-radius: 70rpx; // 圆形头像
	margin-right: 30rpx;
	background-color: #eee;
	border: 4rpx solid #fff;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1); // 加上一点阴影更好看
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
		background-color: #fafafa; // 点击态
	}
}
.action-item:last-child {
	border-bottom: none;
}
.right-area {
	display: flex;
	align-items: center;
}
.loading-icon {
	width: 36rpx;
	height: 36rpx;
	margin-right: 10rpx;
}
.arrow {
	color: #ccc;
	font-weight: bold;
	margin-left: 10rpx;
}
.logout-btn-wrap {
	padding: 0 40rpx;
}
.logout-btn {
	background-color: #ff4d4f;
	color: #ffffff;
	border-radius: 44rpx;
	font-size: 32rpx;
	height: 88rpx;
	line-height: 88rpx;
	border: none;
	
	&:after {
		border: none;
	}
	
	&:active {
		opacity: 0.8;
	}
}
</style>
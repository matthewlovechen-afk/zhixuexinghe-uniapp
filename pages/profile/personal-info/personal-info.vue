<template>
	<view class="container">
		<view class="avatar-section">
			<image 
				class="avatar" 
				:src="displayAvatar" 
				mode="aspectFill"
			></image>
			<button class="change-avatar-btn" @click="changeAvatar" :loading="uploading">更换头像</button>
		</view>

		<view class="divider"></view>

		<view class="form-list">
			<view class="form-item">
				<text class="label">昵　称：</text>
				<input class="input" v-model="formData.username" placeholder="请输入昵称" placeholder-class="placeholder-style" />
			</view>

			<view class="form-item">
				<text class="label">性　别：</text>
				<view class="gender-group">
					<view class="gender-item" :class="{ active: formData.gender === '女' }" @click="formData.gender = '女'">
						<text class="gender-text female" :class="{ selected: formData.gender === '女' }">♀ 女</text>
					</view>
					<view class="gender-item" :class="{ active: formData.gender === '男' }" @click="formData.gender = '男'">
						<text class="gender-text male" :class="{ selected: formData.gender === '男' }">♂ 男</text>
					</view>
				</view>
			</view>

			<view class="form-item">
				<text class="label">出生日期：</text>
				<picker mode="date" :value="formData.birthday" @change="onDateChange">
					<view class="picker-text" :class="{ placeholder: !formData.birthday }">
						{{ formData.birthday || '请输入出生日期' }}
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="label">个性签名：</text>
				<input class="input" v-model="formData.signature" placeholder="请输入个性签名" placeholder-class="placeholder-style" />
			</view>
		</view>

		<view class="bottom-btn-area">
			<button class="submit-btn" @click="submit">确定</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const defaultAvatar = '/static/avatar-user.png';
const displayAvatar = ref(defaultAvatar);
const uploading = ref(false);

const formData = ref({
	_id: '',
	avatar: '',
	username: '',
	gender: '',
	birthday: '',
	signature: ''
});

// 初始化页面数据，并处理头像显示
onShow(async () => {
	const userInfo = uni.getStorageSync('userInfo');
	if (userInfo) {
		formData.value = {
			_id: userInfo._id,
			avatar: userInfo.avatar || '',
			username: userInfo.username || '',
			gender: userInfo.gender || '',
			birthday: userInfo.birthday || '',
			signature: userInfo.signature || ''
		};
		
		// 处理 cloud:// 协议以便显示
		if (userInfo.avatar && userInfo.avatar.startsWith('cloud://')) {
			try {
				const res = await uniCloud.getTempFileURL({ fileList: [userInfo.avatar] });
				if (res.fileList && res.fileList[0].tempFileURL) {
					displayAvatar.value = res.fileList[0].tempFileURL;
				} else {
					displayAvatar.value = defaultAvatar;
				}
			} catch (e) {
				displayAvatar.value = defaultAvatar;
			}
		} else {
			displayAvatar.value = userInfo.avatar || defaultAvatar;
		}
	}
});

const onDateChange = (e) => {
	formData.value.birthday = e.detail.value;
};

// 【即时上传、即时保存、即时转换显示】
const changeAvatar = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const tempFilePath = res.tempFilePaths[0];
			
			uploading.value = true;
			uni.showLoading({ title: '正在上传...', mask: true });

			try {
				const cloudPath = `user-avatars/${formData.value._id}_${Date.now()}.jpg`;
				const uploadRes = await uniCloud.uploadFile({
					filePath: tempFilePath,
					cloudPath: cloudPath
				});

				const fileID = uploadRes.fileID;

				const updateRes = await uniCloud.callFunction({
					name: 'user-update',
					data: {
						uid: formData.value._id,
						avatarUrl: fileID
					}
				});

				uni.hideLoading();

				if (updateRes.result.code === 200) {
					// 转换刚上传的新链接用于立刻显示
					const tempRes = await uniCloud.getTempFileURL({ fileList: [fileID] });
					if (tempRes.fileList && tempRes.fileList[0].tempFileURL) {
						displayAvatar.value = tempRes.fileList[0].tempFileURL;
					}

					formData.value.avatar = fileID;
					
					// 更新本地缓存
					const currentStoredInfo = uni.getStorageSync('userInfo') || {};
					currentStoredInfo.avatar = fileID;
					uni.setStorageSync('userInfo', currentStoredInfo);

					uni.showToast({ title: '头像更新成功', icon: 'success' });
				} else {
					uni.showToast({ title: updateRes.result.message || '更新失败', icon: 'none' });
				}

			} catch (err) {
				console.error('头像处理失败:', err);
				uni.hideLoading();
				uni.showToast({ title: '网络错误，请稍后再试', icon: 'none' });
			} finally {
				uploading.value = false;
			}
		}
	});
};

// 【文本信息提交】
const submit = async () => {
	if (!formData.value.username) {
		return uni.showToast({ title: '昵称不能为空', icon: 'none' });
	}

	uni.showLoading({ title: '保存中...', mask: true });

	try {
		const res = await uniCloud.callFunction({
			name: 'user-update',
			data: {
				uid: formData.value._id,
				username: formData.value.username,
				gender: formData.value.gender,
				birthday: formData.value.birthday,
				signature: formData.value.signature
			}
		});

		uni.hideLoading();

		if (res.result.code === 200) {
			const currentStoredInfo = uni.getStorageSync('userInfo') || {};
			currentStoredInfo.username = formData.value.username;
			currentStoredInfo.gender = formData.value.gender;
			currentStoredInfo.birthday = formData.value.birthday;
			currentStoredInfo.signature = formData.value.signature;
			
			uni.setStorageSync('userInfo', currentStoredInfo);

			uni.showToast({ title: '资料保存成功', icon: 'success' });
			setTimeout(() => {
				uni.navigateBack();
			}, 1000);
		} else {
			uni.showToast({ title: res.result.message || '保存失败', icon: 'none' });
		}
	} catch (e) {
		console.error(e);
		uni.hideLoading();
		uni.showToast({ title: '网络错误', icon: 'none' });
	}
};
</script>

<style lang="scss" scoped>
$intelligent-blue-start: #00c6ff; 
$intelligent-blue-end: #0072ff;   

.container {
	min-height: 100vh;
	background-color: #f8f9fc; 
	padding-bottom: 60rpx;
}

.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 70rpx 0 50rpx;
	background-color: #fff;
	border-bottom-left-radius: 40rpx; 
	border-bottom-right-radius: 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
}

.avatar {
	width: 170rpx;
	height: 170rpx;
	border-radius: 50%;
	background-color: #eee;
	margin-bottom: 35rpx;
	box-shadow: 0 0 15rpx rgba(0,0,0,0.1);
	border: 6rpx solid #fff;
}

.change-avatar-btn {
	background-image: linear-gradient(to right, $intelligent-blue-start 0%, $intelligent-blue-end 100%);
	color: #fff;
	font-size: 28rpx;
	font-weight: 500;
	border-radius: 40rpx;
	padding: 0 45rpx;
	height: 68rpx;
	line-height: 68rpx;
	box-shadow: 0 6rpx 12rpx rgba(0, 114, 255, 0.2); 
	
	&::after { border: none; }
	&:active { opacity: 0.9; transform: scale(0.98); } 
}

.divider {
	height: 24rpx;
	background-color: #f8f9fc;
}

.form-list {
	background-color: #fff;
	margin: 0 30rpx; 
	border-radius: 20rpx;
	padding: 0 30rpx;
	box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.02);
}

.form-item {
	display: flex;
	align-items: center;
	padding: 34rpx 0;
	border-bottom: 1rpx solid #f2f2f2;
	
	&:last-child {
		border-bottom: none;
	}
}

.label {
	width: 160rpx;
	font-size: 30rpx;
	color: #333;
}

.input, .picker-text {
	flex: 1;
	font-size: 30rpx;
	color: #1a1a1a;
}

.placeholder-style {
	color: #bbb;
}

.picker-text.placeholder {
	color: #bbb;
}

.gender-group {
	display: flex;
	gap: 40rpx;
}

.gender-item {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10rpx 20rpx;
}

.gender-text {
	font-size: 30rpx;
	color: #999;
	
	&.female.selected { color: #ff6b81; font-weight: bold; }
	&.male.selected { color: $intelligent-blue-end; font-weight: bold; }
}

.bottom-btn-area {
	margin-top: 100rpx;
	padding: 0 60rpx; 
}

.submit-btn {
	background-image: linear-gradient(135deg, $intelligent-blue-start 0%, $intelligent-blue-end 100%);
	color: #fff;
	border-radius: 50rpx; 
	font-size: 34rpx;
	font-weight: bold;
	height: 96rpx;
	line-height: 96rpx;
	box-shadow: 0 10rpx 25rpx rgba(0, 114, 255, 0.3);
	
	&::after { border: none; }
	&:active { opacity: 0.9; transform: scale(0.97); } 
}
</style>
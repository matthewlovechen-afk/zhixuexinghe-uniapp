<template>
	<view class="login-container">
		<view class="header">
			<text class="logo-text">智学星河</text>
			<text class="subtitle">欢迎开启 AI 学习之旅</text>
		</view>

		<view class="form-area">
			<view class="input-item">
				<input class="input" v-model="form.username" placeholder="请输入用户名" />
			</view>
			<view class="input-item">
				<input class="input" v-model="form.password" password placeholder="请输入密码" />
			</view>
			
			<button class="login-btn" @click="handleAction" :loading="loading">
				{{ isLogin ? '立即登录' : '注册账号' }}
			</button>
			
			<view class="footer-links">
				<text class="link-text" v-if="isLogin">忘记密码</text>
				<text class="link-text" @click="isLogin = !isLogin">
					{{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
				</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue';

const isLogin = ref(true);
const loading = ref(false); // 这里修复了！
const form = reactive({
	username: '',
	password: ''
});

const handleAction = async () => {
	if (!form.username || !form.password) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' });
		return;
	}

	loading.value = true;
	try {
		const functionName = isLogin.value ? 'user-login' : 'user-register';
		const res = await uniCloud.callFunction({
			name: functionName,
			data: form
		});

		console.log("返回结果", res.result);
		
		if (res.result.code === 200) {
			uni.showToast({ title: res.result.message, icon: 'success' });
			
			if (isLogin.value) {
				uni.setStorageSync('token', res.result.token);
				uni.setStorageSync('userInfo', res.result.userInfo);
				
				setTimeout(() => {
					// ✅ 修复：switchTab 改成 redirectTo
					uni.redirectTo({
						url: '/pages/index/index'
					});
				}, 1500);
			} else {
				isLogin.value = true;
			}
		} else {
			uni.showToast({ title: res.result.message, icon: 'none' });
		}
	} catch (err) {
		console.error('请求失败', err);
		uni.showToast({ title: '网络或服务器错误', icon: 'none' });
	} finally {
		loading.value = false;
	}
};
</script>

<style lang="scss" scoped>
.login-container {
	padding: 60rpx;
	background-color: #fff;
	height: 100vh;
}
.header {
	margin-top: 100rpx;
	margin-bottom: 80rpx;
	.logo-text { font-size: 56rpx; font-weight: bold; color: $uni-color-primary; display: block; }
	.subtitle { font-size: 28rpx; color: $uni-text-color-grey; margin-top: 20rpx; display: block; }
}
.input-item {
	border-bottom: 1rpx solid $uni-border-color;
	margin-bottom: 40rpx;
	padding: 20rpx 0;
	.input { font-size: 30rpx; }
}
.login-btn {
	background-color: $uni-color-primary;
	color: #fff;
	border-radius: 50rpx;
	margin-top: 60rpx;
	font-size: 32rpx;
}
.footer-links {
	display: flex;
	justify-content: space-between;
	margin-top: 30rpx;
	.link-text { color: $uni-text-color-grey; font-size: 26rpx; }
}
</style>
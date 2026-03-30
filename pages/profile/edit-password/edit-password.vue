<template>
	<view class="container">
		<input v-model="oldPassword" placeholder="请输入旧密码" password class="input-box" />
		<input v-model="newPassword" placeholder="请输入新密码" password class="input-box" />
		<button @click="submit" class="btn">确认修改并重新登录</button>
	</view>
</template>

<script setup>
import { ref } from 'vue';

const oldPassword = ref('');
const newPassword = ref('');

const submit = async () => {
	if (!oldPassword.value || !newPassword.value) return;
	
	const userInfo = uni.getStorageSync('userInfo');
	const res = await uniCloud.callFunction({
		name: 'user-update-password',
		data: { uid: userInfo._id, oldPassword: oldPassword.value, newPassword: newPassword.value }
	});

	if (res.result.code === 200) {
		uni.showToast({ title: '密码已修改，请重新登录', icon: 'none' });
		uni.clearStorageSync();
		setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500);
	} else {
		uni.showToast({ title: res.result.message, icon: 'none' });
	}
};
</script>

<style scoped>
.container { padding: 40rpx; }
.input-box { border-bottom: 1px solid #eee; padding: 20rpx 0; margin-bottom: 40rpx; }
.btn { background: #ff4d4f; color: #fff; }
</style>
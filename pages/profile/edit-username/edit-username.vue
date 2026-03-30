<template>
	<view class="container">
		<input v-model="newUsername" placeholder="请输入新用户名" class="input-box" />
		<button @click="submit" class="btn">保存</button>
	</view>
</template>

<script setup>
import { ref } from 'vue';

const newUsername = ref('');

const submit = async () => {
	if (!newUsername.value) return uni.showToast({ title: '不能为空', icon: 'none' });
	
	const userInfo = uni.getStorageSync('userInfo');
	const res = await uniCloud.callFunction({
		name: 'user-update',
		data: { uid: userInfo._id, username: newUsername.value }
	});

	if (res.result.code === 200) {
		userInfo.username = newUsername.value;
		uni.setStorageSync('userInfo', userInfo);
		uni.showToast({ title: '修改成功', icon: 'success' });
		setTimeout(() => uni.navigateBack(), 1000);
	}
};
</script>

<style scoped>
.container { padding: 40rpx; }
.input-box { border-bottom: 1px solid #eee; padding: 20rpx 0; margin-bottom: 40rpx; }
.btn { background: #007aff; color: #fff; }
</style>
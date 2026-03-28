<template>
	<view class="page">
		<!-- 顶部欢迎 -->
		<view class="header-card">
			<text class="title">早安，陈同学</text>
			<text class="subtitle">今日学习任务已生成</text>
		</view>

		<!-- 每日任务卡片 -->
		<view class="section-title">今日计划 (AI 生成)</view>
		<view class="task-card">
			<view class="task-item">
				<text class="checkbox">☑️</text>
				<text>复习昨日错题集 (数学)</text>
			</view>
			<view class="task-item">
				<text class="checkbox">⬜</text>
				<text>完成英语阅读理解 1 篇</text>
			</view>
			<view class="task-item">
				<text class="checkbox">⬜</text>
				<text>社区参与一次讨论</text>
			</view>
		</view>

		<!-- 个性化推荐流 -->
		<view class="section-title">为你推荐</view>
		<view class="recommend-list">
			<view class="rec-item" v-for="(item, i) in recommendList" :key="i">
				<image :src="item.img" mode="aspectFill" class="rec-img"></image>
				<view class="rec-info">
					<text class="rec-title">{{ item.title }}</text>
					<text class="rec-tag">{{ item.tag }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '@/utils/request.js';

const recommendList = ref([]);

onMounted(async () => {
	// 模拟从后端获取推荐数据
	// const res = await http({ url: '/api/recommend', method: 'GET' });
	// recommendList.value = res.data;
	
	// 假数据演示
	recommendList.value = [
		{ title: '高等数学：极限求解技巧', tag: '视频课程', img: 'https://via.placeholder.com/150' },
		{ title: '英语四级高频词汇表', tag: '资料文档', img: 'https://via.placeholder.com/150' },
		{ title: '社区热帖：如何准备大创答辩？', tag: '社区精选', img: 'https://via.placeholder.com/150' }
	];
});
</script>

<style lang="scss" scoped>
.page { padding: 30rpx; background: #f5f6fa; min-height: 100vh; }
.header-card {
	background: linear-gradient(135deg, #007aff, #00c6ff);
	color: #fff;
	padding: 40rpx;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
}
.title { font-size: 36rpx; font-weight: bold; display: block; }
.subtitle { font-size: 26rpx; opacity: 0.9; margin-top: 10rpx; display: block; }

.section-title { font-size: 30rpx; font-weight: bold; margin: 20rpx 0; color: #333; }

.task-card {
	background: #fff;
	padding: 30rpx;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
}
.task-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	font-size: 28rpx;
}
.checkbox { margin-right: 20rpx; font-size: 32rpx; }

.recommend-list { display: flex; flex-direction: column; gap: 20rpx; }
.rec-item {
	display: flex;
	background: #fff;
	padding: 20rpx;
	border-radius: 20rpx;
	align-items: center;
}
.rec-img { width: 120rpx; height: 120rpx; border-radius: 10rpx; margin-right: 20rpx; }
.rec-info { flex: 1; }
.rec-title { font-size: 28rpx; font-weight: bold; display: block; margin-bottom: 10rpx; }
.rec-tag { font-size: 24rpx; color: #007aff; background: #e6f2ff; padding: 4rpx 12rpx; border-radius: 20rpx; }
</style>
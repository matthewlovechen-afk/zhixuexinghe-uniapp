<template>
	<view class="faq-container">
		<view class="header-banner">
			<text class="title">常见问题解答</text>
			<text class="subtitle">为您解答使用过程中的疑惑</text>
		</view>

		<view class="faq-list">
			<view class="faq-item" v-for="(item, index) in faqList" :key="index">
				<view class="question">
					<text class="q-icon">Q</text>
					<text class="q-text">{{ item.question }}</text>
				</view>
				<view class="answer">
					<text class="a-icon">A</text>
					<text class="a-text">{{ item.answer }}</text>
				</view>
			</view>
		</view>
		
		<view class="footer-hint">
			<text>如果以上问题未能解决您的疑惑，请在社区留言反馈。</text>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';

// 将我们讨论好的问答内容作为静态数据放在这里
const faqList = ref([
	{
		question: '如何向 AI 助教发送图片或语音？',
		answer: '在“AI 助教”页面底部输入框的左侧，点击“🖼️”图标即可从相册或相机上传图片进行文字识别；点击“📎”图标可以上传音频文件或录制语音，AI 会自动将内容转写为文字并为您解答。'
	},
	{
		question: '如何获得更精准的资源推荐？',
		answer: '您可以在推荐页面精确选择您的“年级”（如初中、高中）并输入具体的“学科”或知识点（例如：数学、线性代数、Python编程），AI 匹配度会更高。'
	},
	{
		question: '清除缓存会删掉我的账号信息吗？',
		answer: '不会。系统设置中的“清除缓存”功能只会清理应用运行过程中产生的临时图片和冗余数据以释放手机空间，不会让您退出登录，也不会删除您的云端个人资料。'
	},
	{
		question: '在“社区广场”浏览时如何返回上一页？',
		answer: '社区采用了网页内嵌模式。当您在社区内浏览时，点击手机的物理返回键或顶部返回键，会优先在社区网页内部后退；如果已经退回社区首页，再次连续按两次返回键即可退出 App。'
	}
]);
</script>

<style scoped>
.faq-container {
	min-height: 100vh;
	background-color: #f5f6fa;
	padding-bottom: 40rpx;
}

.header-banner {
	background: linear-gradient(135deg, #007aff 0%, #005bb5 100%);
	padding: 60rpx 40rpx;
	color: #fff;
}

.header-banner .title {
	font-size: 44rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 16rpx;
}

.header-banner .subtitle {
	font-size: 28rpx;
	opacity: 0.9;
}

.faq-list {
	padding: 30rpx;
	margin-top: -30rpx; /* 让列表稍微上浮覆盖在蓝色背景上 */
}

.faq-item {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
}

.question {
	display: flex;
	align-items: flex-start;
	margin-bottom: 20rpx;
}

.q-icon {
	background-color: #e6f1ff;
	color: #007aff;
	font-size: 24rpx;
	font-weight: bold;
	width: 40rpx;
	height: 40rpx;
	line-height: 40rpx;
	text-align: center;
	border-radius: 8rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
	margin-top: 4rpx;
}

.q-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	line-height: 1.4;
}

.answer {
	display: flex;
	align-items: flex-start;
}

.a-icon {
	background-color: #fff2e8;
	color: #ff7a45;
	font-size: 24rpx;
	font-weight: bold;
	width: 40rpx;
	height: 40rpx;
	line-height: 40rpx;
	text-align: center;
	border-radius: 8rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
	margin-top: 4rpx;
}

.a-text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
}

.footer-hint {
	text-align: center;
	padding: 20rpx 40rpx;
	font-size: 24rpx;
	color: #999;
}
</style>
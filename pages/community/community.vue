<template>
    <view class="chat-container">
        <!-- 顶部导航 -->
        <view class="header">智学星河 AI 助教</view>

        <!-- 聊天记录区域 -->
        <scroll-view scroll-y class="message-list" :scroll-into-view="scrollIntoView">
            <view v-for="(msg, index) in messageList" :key="index" :id="'msg-' + index">
                
                <!-- 用户消息 (右侧) -->
                <view v-if="msg.role === 'user'" class="message-row user-row">
                    <view class="bubble user-bubble">
                        <text>{{ msg.content }}</text>
                    </view>
                    <image src="/static/avatar-user.png" class="avatar"></image>
                </view>

                <!-- AI 消息 (左侧) -->
                <view v-else class="message-row ai-row">
                    <image src="/static/avatar-ai.png" class="avatar"></image>
                    <view class="bubble ai-bubble">
                        <!-- 加载中状态 -->
                        <view v-if="msg.loading" class="loading-dots">
                            <text>AI 正在思考...</text>
                        </view>
                        <!-- Markdown 渲染内容 -->
                        <rich-text v-else :nodes="msg.renderedContent" class="markdown-body"></rich-text>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 底部输入区 -->
        <view class="input-area">
            <view class="input-wrapper">
                <input 
                    class="text-input" 
                    v-model="inputText" 
                    placeholder="输入问题..." 
                    confirm-type="send"
                    @confirm="sendMessage"
                />
                
                <!-- 发送按钮 -->
                <view class="send-btn" @click="sendMessage" :class="{ disabled: !inputText }">
                    <text>发送</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import MarkdownIt from 'markdown-it';

// 初始化 Markdown 解析器
const md = new MarkdownIt();

// 数据状态
const inputText = ref('');
const scrollIntoView = ref('');
const messageList = reactive([
    { 
        role: 'assistant', 
        content: '你好！我是智学星河助手，请输入问题。', 
        renderedContent: md.render('你好！我是**智学星河**助手，请输入问题。'), 
        loading: false 
    }
]);

// 发送消息核心逻辑
const sendMessage = async () => {
    const currentText = inputText.value.trim();
    if (!currentText) return;

    // 1. 添加用户消息
    messageList.push({
        role: 'user',
        content: currentText,
        renderedContent: currentText,
        loading: false
    });

    // 2. 清空输入框并滚动
    inputText.value = '';
    scrollToBottom();

    // 3. 添加 AI 加载消息
    const aiMsgIndex = messageList.length;
    messageList.push({
        role: 'assistant',
        content: '',
        renderedContent: '',
        loading: true
    });
    scrollToBottom();

    try {
        // 4. 调用 DeepSeek API
        // 注意：请务必将下面的 url 修改为你自己的 ngrok 地址
        const response = await uni.request({
            url: 'https://consentingly-uliginous-nasir.ngrok-free.dev/v1/chat/completions', 
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
				'Authorization': 'Bearer sk-你的密钥在这里' 
            },
            data: {
                "messages": [
                    { "role": "user", "content": currentText }
                ],
                "model": "deepseek-r1",
                "stream": false
            }
        });

        // 5. 处理返回结果
        // uni.request 返回的是一个数组 [error, success]
        const resData = response[1].data;
        
        let answer = '';
        if (resData.choices && resData.choices.length > 0) {
            answer = resData.choices[0].message.content;
        } else {
            throw new Error('API 返回格式错误');
        }

        // 6. 更新 AI 消息
        messageList[aiMsgIndex].loading = false;
        messageList[aiMsgIndex].content = answer;
        
        // 使用打字机效果
        typeWriterEffect(answer, aiMsgIndex);

    } catch (error) {
        console.error("请求失败:", error);
        messageList[aiMsgIndex].loading = false;
        messageList[aiMsgIndex].content = "请求失败，请检查网络或 API 地址。";
        messageList[aiMsgIndex].renderedContent = messageList[aiMsgIndex].content;
    }
};

// 打字机效果
const typeWriterEffect = (fullText, index) => {
    let currentText = '';
    const speed = 20; 

    const timer = setInterval(() => {
        if (currentText.length < fullText.length) {
            currentText += fullText.charAt(currentText.length);
            messageList[index].renderedContent = md.render(currentText);
            scrollToBottom();
        } else {
            clearInterval(timer);
            messageList[index].renderedContent = md.render(fullText);
        }
    }, speed);
};

const scrollToBottom = () => {
    nextTick(() => {
        scrollIntoView.value = 'msg-' + (messageList.length - 1);
    });
};
</script>

<style scoped>
/* 这里保留你原来的样式即可，不需要修改 */
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f5f5;
}
.header {
    padding: 20rpx;
    text-align: center;
    background-color: #fff;
    font-weight: bold;
    border-bottom: 1rpx solid #eee;
}
.message-list {
    flex: 1;
    padding: 20rpx;
    box-sizing: border-box;
}
.message-row {
    display: flex;
    margin-bottom: 20rpx;
}
.user-row {
    justify-content: flex-end;
}
.ai-row {
    justify-content: flex-start;
}
.bubble {
    padding: 20rpx;
    border-radius: 10rpx;
    max-width: 70%;
    font-size: 28rpx;
    line-height: 1.5;
}
.user-bubble {
    background-color: #95ec69;
    color: #000;
}
.ai-bubble {
    background-color: #fff;
    color: #000;
}
.avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin: 0 20rpx;
}
.input-area {
    padding: 20rpx;
    background-color: #fff;
    border-top: 1rpx solid #eee;
}
.input-wrapper {
    display: flex;
    align-items: center;
}
.text-input {
    flex: 1;
    border: 1rpx solid #ddd;
    border-radius: 10rpx;
    padding: 20rpx;
    font-size: 28rpx;
}
.send-btn {
    margin-left: 20rpx;
    padding: 20rpx 40rpx;
    background-color: #007aff;
    color: #fff;
    border-radius: 10rpx;
    text-align: center;
}
.send-btn.disabled {
    background-color: #ccc;
}
.loading-dots {
    color: #999;
    font-size: 24rpx;
}
</style>
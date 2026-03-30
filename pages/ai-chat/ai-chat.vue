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
                <!-- 音频上传按钮（回形针） -->
                <view class="voice-btn" @click="chooseAudioFile" :class="{ 'loading': isUploading }">
                    <text class="mic-icon">📎</text>
                </view>

                <input 
                    class="text-input" 
                    v-model="inputText" 
                    placeholder="输入问题或上传音频..." 
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

// --- 状态定义 ---
const inputText = ref('');
const scrollIntoView = ref('');
const isUploading = ref(false);        // 上传转写中的状态
const messageList = reactive([
    {
        role: 'assistant',
        content: '你好！我是智学星河助手。你可以点击左侧的回形针上传音频文件进行转写。',
        renderedContent: '你好！我是智学星河助手。',
        loading: false
    }
]);

// ================= 配置区域（根据你的实际服务器地址修改） =================
const WHISPER_API_URL = 'http://114.55.97.51:8000/transcribe/';   // Whisper 服务地址
const WHISPER_API_KEY = 'jackeylove';                             // Whisper API 密钥
const DEEPSEEK_API_URL = 'http://116.62.128.164:5000/chat';       // DeepSeek 对话接口
// =========================================================================

// --- 选择音频文件（兼容多平台）---
const chooseAudioFile = () => {
    if (isUploading.value) return; // 正在上传中，禁止重复点击

    // #ifdef H5
    uni.chooseFile({
        count: 1,
        type: 'media',
        success: (res) => {
            const fileObj = res.tempFiles[0].originalFileObj || res.tempFiles[0];
            uploadAudio(fileObj, true);
        },
        fail: (err) => {
            console.error('H5选择失败:', err);
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif

    // #ifdef APP-PLUS
    uni.chooseFile({
        count: 1,
        type: 'media',
        success: (res) => {
            const filePath = res.tempFiles[0].path;
            uploadAudio(filePath);
        },
        fail: (err) => {
            console.error('App选择失败:', err);
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif

    // #ifdef MP-WEIXIN
    uni.chooseMedia({
        count: 1,
        type: 'video',
        sourceType: ['album', 'camera'],
        success: (res) => {
            const filePath = res.tempFiles[0].tempFilePath;
            uploadAudio(filePath);
        },
        fail: (err) => {
            console.error('小程序选择失败:', err);
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif
};

// --- 上传音频到 Whisper 服务 ---
const uploadAudio = (file, isH5File = false) => {
    uni.showLoading({ title: '转写中...', mask: true });
    isUploading.value = true;

    // 构建上传参数
    let uploadOptions = {
        url: WHISPER_API_URL,
        name: 'file',                     // 后端参数名
        header: {
            'X-API-Key': WHISPER_API_KEY
        },
        success: (res) => {
            console.log('Whisper 状态码:', res.statusCode);
            console.log('Whisper 响应:', res.data);
            let data;
            try {
                data = JSON.parse(res.data);
            } catch (e) {
                console.error('解析失败:', e);
                data = {};
            }

            if (res.statusCode === 200 && data.transcription) {
                // 将转写结果填入输入框
                inputText.value = data.transcription;
                uni.showToast({ title: '转写成功', icon: 'success' });
            } else if (res.statusCode === 403) {
                uni.showToast({ title: 'API 密钥错误', icon: 'none' });
            } else if (res.statusCode === 422) {
                let errorMsg = '请求参数错误';
                if (data && data.detail) {
                    errorMsg = JSON.stringify(data.detail);
                }
                uni.showToast({ title: errorMsg, icon: 'none' });
                console.error('422 错误:', errorMsg);
            } else {
                uni.showToast({ title: '转写失败', icon: 'none' });
            }
        },
        fail: (err) => {
            console.error('上传失败:', err);
            uni.showToast({ title: '网络错误，请重试', icon: 'none' });
        },
        complete: () => {
            uni.hideLoading();
            isUploading.value = false;
        }
    };

    // H5 端特殊处理
    if (isH5File && typeof file === 'object' && file instanceof File) {
        uploadOptions.files = [{ name: 'file', file: file }];
        delete uploadOptions.name;      // H5 端使用 files 时不需要 name
    } else {
        uploadOptions.filePath = file;  // App/小程序使用 filePath
    }

    uni.uploadFile(uploadOptions);
};

// --- 发送消息给 DeepSeek AI ---
const sendMessage = async () => {
    const currentText = inputText.value.trim();
    if (!currentText) return;

    // 添加用户消息
    messageList.push({
        role: 'user',
        content: currentText,
        renderedContent: currentText,
        loading: false
    });

    // 清空输入框并滚动到底部
    inputText.value = '';
    scrollToBottom();

    // 添加“正在思考”占位消息
    const aiMsgIndex = messageList.length;
    messageList.push({
        role: 'assistant',
        content: '',
        renderedContent: '',
        loading: true
    });
    scrollToBottom();

    // 请求 DeepSeek API
    try {
        const res = await uni.request({
            url: DEEPSEEK_API_URL,
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { message: currentText }
        });

        if (res.statusCode !== 200) {
            throw new Error(`请求失败，状态码: ${res.statusCode}`);
        }

        const responseData = res.data;
        if (responseData && responseData.response) {
            const aiContent = responseData.response;
            messageList[aiMsgIndex].loading = false;
            messageList[aiMsgIndex].content = aiContent;
            typeWriterEffect(aiContent, aiMsgIndex);
        } else {
            throw new Error('API 返回数据格式错误');
        }
    } catch (error) {
        console.error('DeepSeek 请求失败:', error);
        if (messageList[aiMsgIndex]) {
            messageList[aiMsgIndex].loading = false;
            messageList[aiMsgIndex].content = `请求出错: ${error.message || '未知错误'}`;
            messageList[aiMsgIndex].renderedContent = messageList[aiMsgIndex].content;
        }
    }
};

// --- 打字机效果 ---
const typeWriterEffect = (fullText, index) => {
    let currentText = '';
    const speed = 30;
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

// --- 滚动到底部 ---
const scrollToBottom = () => {
    nextTick(() => {
        if (messageList.length > 0) {
            scrollIntoView.value = 'msg-' + (messageList.length - 1);
        }
    });
};
</script>

<style scoped>
/* 样式基本沿用你的原样式，只添加了上传中按钮的 loading 效果 */
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
    padding: 10rpx;
}
.voice-btn {
    padding: 20rpx;
    margin-right: 15rpx;
    background-color: #f1f1f1;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: opacity 0.2s;
}
.voice-btn.loading {
    opacity: 0.5;
    pointer-events: none;
}
.mic-icon {
    font-size: 40rpx;
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
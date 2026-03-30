<template>
    <view class="chat-container">
        <view class="header">智学星河 AI 助教</view>

        <scroll-view scroll-y class="message-list" :scroll-into-view="scrollIntoView">
            <view v-for="(msg, index) in messageList" :key="index" :id="'msg-' + index">
                <view v-if="msg.role === 'user'" class="message-row user-row">
                    <view class="bubble user-bubble">
                        <text>{{ msg.content }}</text>
                    </view>
                    <image src="/static/avatar-user.png" class="avatar"></image>
                </view>

                <view v-else class="message-row ai-row">
                    <image src="/static/avatar-ai.png" class="avatar"></image>
                    <view class="bubble ai-bubble">
                        <view v-if="msg.loading" class="loading-dots">
                            <text>AI 正在思考...</text>
                        </view>
                        <text v-else>{{ msg.content }}</text>
                    </view>
                </view>
            </view>
        </scroll-view>

        <view class="input-area">
            <view class="input-wrapper">
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
                <view class="send-btn" @click="sendMessage" :class="{ disabled: !inputText }">
                    <text>发送</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';

const inputText = ref('');
const scrollIntoView = ref('');
const isUploading = ref(false);

const messageList = reactive([
    {
        role: 'assistant',
        content: '你好！我是智学星河助手。你可以点击左侧的回形针上传音频文件进行转写。',
        loading: false
    }
]);

const WHISPER_API_URL = 'http://114.55.97.51:8000/transcribe/';
const WHISPER_API_KEY = 'jackeylove';
const DEEPSEEK_API_URL = 'http://116.62.128.164:5000/chat';

const chooseAudioFile = () => {
    if (isUploading.value) return;

    // #ifdef H5
    uni.chooseFile({
        count: 1,
        type: 'media',
        success: (res) => {
            const fileObj = res.tempFiles[0].originalFileObj || res.tempFiles[0];
            uploadAudio(fileObj, true);
        },
        fail: (err) => {
            console.error('选择失败:', err);
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif

    // #ifdef APP-PLUS
    uni.chooseFile({
        count: 1,
        type: 'media',
        success: (res) => {
            uploadAudio(res.tempFiles[0].path);
        },
        fail: (err) => {
            console.error('选择失败:', err);
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif

    // #ifdef MP-WEIXIN
    uni.chooseMedia({
        count: 1,
        type: 'video',
        success: (res) => {
            uploadAudio(res.tempFiles[0].tempFilePath);
        },
        fail: (err) => {
            console.error('选择失败:', err);
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif
};

const uploadAudio = (file, isH5File = false) => {
    uni.showLoading({ title: '转写中...', mask: true });
    isUploading.value = true;

    let uploadOptions = {
        url: WHISPER_API_URL,
        name: 'file',
        header: { 'X-API-Key': WHISPER_API_KEY },
        complete: () => {
            uni.hideLoading();
            isUploading.value = false;
        }
    };

    if (isH5File) {
        uploadOptions.files = [{ name: 'file', file }];
        delete uploadOptions.name;
    } else {
        uploadOptions.filePath = file;
    }

    uni.uploadFile({
        ...uploadOptions,
        success: (res) => {
            try {
                let data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                if (res.statusCode === 200 && data.transcription) {
                    inputText.value = data.transcription;
                    uni.showToast({ title: '转写成功', icon: 'success' });
                } else {
                    uni.showToast({ title: '转写失败', icon: 'none' });
                }
            } catch (e) {
                uni.showToast({ title: '解析失败', icon: 'none' });
            }
        },
        fail: () => {
            uni.showToast({ title: '网络错误', icon: 'none' });
        }
    });
};

const sendMessage = async () => {
    const txt = inputText.value.trim();
    if (!txt) return;

    messageList.push({
        role: 'user',
        content: txt,
        loading: false
    });
    inputText.value = '';
    scrollToBottom();

    const idx = messageList.length;
    messageList.push({ role: 'assistant', content: '', loading: true });
    scrollToBottom();

    try {
        const res = await uni.request({
            url: DEEPSEEK_API_URL,
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { message: txt }
        });

        const content = res.data?.response || "抱歉，我没理解你的意思";
        messageList[idx].loading = false;
        messageList[idx].content = content;
        scrollToBottom();

    } catch (e) {
        messageList[idx].loading = false;
        messageList[idx].content = "请求失败，请稍后再试";
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        scrollIntoView.value = 'msg-' + (messageList.length - 1);
    });
};
</script>

<style scoped>
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
}
.ai-bubble {
    background-color: #fff;
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
.voice-btn {
    padding: 20rpx;
    margin-right: 15rpx;
    background-color: #f1f1f1;
    border-radius: 50%;
}
.text-input {
    flex: 1;
    border: 1rpx solid #ddd;
    border-radius: 10rpx;
    padding: 20rpx;
}
.send-btn {
    margin-left: 20rpx;
    padding: 20rpx 40rpx;
    background-color: #007aff;
    color: #fff;
    border-radius: 10rpx;
}
.send-btn.disabled {
    background-color: #ccc;
}
.loading-dots {
    color: #999;
    font-size: 24rpx;
}
</style>

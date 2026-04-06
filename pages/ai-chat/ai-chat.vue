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
        <!-- 图片按钮 -->
        <view class="icon-btn" @click="chooseImage">
          <text class="icon">🖼️</text>
        </view>

        <!-- 语音按钮 -->
        <view class="icon-btn" 
              @touchstart="startRealtimeASR" 
              @touchend="stopRealtimeASR" 
              :class="{ 'loading': isRecording }">
          <text class="mic-icon">🎤</text>
        </view>

        <input 
          class="text-input" 
          v-model="inputText" 
          placeholder="输入问题或上传..." 
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
const isRecording = ref(false);

const messageList = reactive([
  {
    role: 'assistant',
    content: '你好！我是智学星河助手。你可以点击回形针上传音频，或点击图片图标上传图片进行识别。',
    loading: false
  }
]);

// ==================== API 配置 ====================
// 1. 图片识别服务 (PaddleOCR) - 新地址
// 注意：这里去掉了末尾的斜杠，保持与 Swagger 文档一致
const IMAGE_RECOGNITION_API_URL = 'http://101.43.110.90:8080/ocr';

// 2. 语音识别服务 (RTASR) 
const RTASR_API_URL = 'http://101.43.110.90/api/asr'; // 预留 HTTP 接口
const RTASR_WS_URL = 'ws://101.43.110.90:8000/api/v1/asr/ws/realtime?token=12345678'; // 实时流式 WebSocket 接口

// 3. Whisper 服务 (用于音频文件转写) - 旧地址
const WHISPER_API_URL = 'http://114.55.97.51:8000/transcribe/';
const WHISPER_API_KEY = 'jackeylove';

// 4. DeepSeek 服务 (AI 回复) - 旧地址
const DEEPSEEK_API_URL = 'http://116.62.128.164:5000/chat';

// ==================== 实时语音识别 (RTASR) 逻辑 ====================
let socketTask = null;
const recorderManager = uni.getRecorderManager();

// 1. 监听录音切片数据并实时发送给后端
recorderManager.onFrameRecorded((res) => {
  const { frameBuffer } = res;
  if (socketTask) {
    socketTask.send({ data: frameBuffer });
  }
});

// 2. 监听录音结束
recorderManager.onStop((res) => {
  if (socketTask) {
    // 按照后端协议，发送结束信号
    socketTask.send({ data: JSON.stringify({ action: "end" }) });
  }
  isRecording.value = false;
  uni.hideToast();
});

// 3. 开始录音 (绑定在麦克风按钮的 @touchstart)
const startRealtimeASR = () => {
  if (isRecording.value) return;
  isRecording.value = true;
  uni.showToast({ title: '正在聆听...', icon: 'none', duration: 60000 });

  // 建立 WebSocket 连接
  socketTask = uni.connectSocket({
    url: RTASR_WS_URL,
    success: () => console.log('正在连接 ASR 服务...')
  });

  socketTask.onOpen(() => {
    console.log('ASR 服务连接成功，启动录音机');
    // 启动录音机：参数配置 PCM/16000Hz/单声道
    recorderManager.start({
      sampleRate: 16000,
      numberOfChannels: 1,
      format: 'pcm',
      frameSize: 1 // 触发 onFrameRecorded 流式传输
    });
  });

  // 监听后端增量返回的识别文本
  socketTask.onMessage((res) => {
    try {
      const data = JSON.parse(res.data);
      if (data.action === 'result' && data.text) {
        // 实时将识别结果填充到输入框
        inputText.value = data.text;
      } else if (data.action === 'done' || data.action === 'error') {
        if (data.action === 'error') console.error('ASR报错:', data.detail);
        socketTask.close();
        socketTask = null;
      }
    } catch (e) {
      console.error('解析 ASR 响应失败', e);
    }
  });

  socketTask.onError((err) => {
    console.error('WebSocket 连接失败:', err);
    uni.showToast({ title: '语音服务不可用', icon: 'none' });
    recorderManager.stop();
    isRecording.value = false;
  });
};

// 4. 停止录音 (绑定在麦克风按钮的 @touchend)
const stopRealtimeASR = () => {
  if (!isRecording.value) return;
  recorderManager.stop(); // 触发 onStop
};

// ==================== 图片识别逻辑 ====================
const chooseImage = () => {
  if (isUploading.value) return;

  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      recognizeImage(tempFilePath);
    },
    fail: (err) => {
      console.error('选择图片失败:', err);
      uni.showToast({ title: '选择图片失败', icon: 'none' });
    }
  });
};

const recognizeImage = (filePath) => {
  uni.showLoading({ title: '识别中...', mask: true });
  isUploading.value = true;

  uni.uploadFile({
    url: IMAGE_RECOGNITION_API_URL,
    filePath: filePath,
    // 关键修改：根据 Swagger 文档，参数名应为 'image'
    name: 'image',
    // 关键修改：删除手动设置的 Content-Type，让框架自动处理
    // header: { 'Content-Type': 'multipart/form-data' },
    success: (res) => {
      // 关键修改：增加状态码检查
      if (res.statusCode !== 200) {
        console.error('图片识别服务端错误:', res.statusCode, res.data);
        uni.showToast({ title: `服务错误: ${res.statusCode}`, icon: 'none' });
        return;
      }

      try {
        let data = JSON.parse(res.data);
        // 关键修改：根据 Swagger 截图，返回字段为 "text"
        if (data.text) {
          inputText.value = data.text;
          uni.showToast({ title: '识别成功', icon: 'success' });
        } else {
          uni.showToast({ title: '识别失败', icon: 'none' });
        }
      } catch (e) {
        console.error('解析图片识别结果失败:', e);
        uni.showToast({ title: '解析失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('图片上传失败:', err);
      uni.showToast({ title: '网络错误或服务不可用', icon: 'none' });
    },
    complete: () => {
      uni.hideLoading();
      isUploading.value = false;
    }
  });
};

// ==================== 音频文件转写逻辑 (Whisper) ====================
const chooseAudioFile = () => {
  if (isUploading.value) return;

  // #ifdef H5
  uni.chooseFile({
    count: 1,
    type: 'media',
    success: (res) => {
      const fileObj = res.tempFiles[0].originalFileObj || res.tempFiles[0];
      uploadAudio(fileObj, true);
    }
  });
  // #endif

  // #ifdef APP-PLUS || MP-WEIXIN
  uni.chooseMedia({
    count: 1,
    type: ['video', 'image'],
    success: (res) => {
      uploadAudio(res.tempFiles[0].tempFilePath);
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
        let data = JSON.parse(res.data);
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
    fail: (err) => {
      console.error('音频上传失败:', err);
      uni.showToast({ title: '网络错误或服务不可用', icon: 'none' });
    }
  });
};

// ==================== 发送与滚动逻辑 ====================
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
/* 保持原有样式不变 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f4f4;
}

.header {
  background-color: #007AFF;
  color: white;
  font-size: 18px;
  font-weight: bold;
  padding: 15px;
  text-align: center;
}

.message-list {
  flex: 1;
  padding: 10px;
  background-color: #e9e9e9;
}

.message-row {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-end;
}

.user-row {
  justify-content: flex-end;
}

.ai-row {
  justify-content: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-left: 10px;
  margin-right: 10px;
}

.bubble {
  max-width: 70%;
  padding: 12px 15px;
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.5;
}

.user-bubble {
  background-color: #DCF8C6;
  color: #000;
}

.ai-bubble {
  background-color: #FFFFFF;
  color: #000;
}

.loading-dots text {
  color: #888;
}

.input-area {
  border-top: 1px solid #ddd;
  background-color: #fff;
  padding: 10px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 25px;
  padding: 5px 10px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: background-color 0.2s;
}

.icon-btn:active {
  background-color: #d0d0d0;
}

.icon-btn.loading {
  background-color: #b0b0b0;
}

.icon, .mic-icon {
  font-size: 20px;
}

.text-input {
  flex: 1;
  height: 40px;
  padding: 0 10px;
  font-size: 16px;
  background-color: transparent;
  border: none;
}

.send-btn {
  margin-left: 10px;
  padding: 8px 15px;
  background-color: #007AFF;
  color: white;
  border-radius: 20px;
  font-size: 14px;
}

.send-btn.disabled {
  background-color: #cccccc;
}
</style>

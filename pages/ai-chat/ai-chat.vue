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
        <!-- 加号菜单按钮 -->
        <view class="plus-menu-btn" @click="toggleMenu">
          <text class="plus-icon" :class="{ 'rotate': showMenu }">+</text>
        </view>

        <!-- 下拉菜单 -->
        <view class="menu-dropdown" v-if="showMenu">
          <view class="menu-item" @click="handleRealtimeSpeech">
            <image src="/static/realtime-speech.png" class="menu-icon"></image>
            <text>实时语音</text>
          </view>
          <view class="menu-item" @click="chooseVideoOrAudio">
            <image src="/static/video-text.png" class="menu-icon"></image>
            <text>视频转文字</text>
          </view>
          <view class="menu-item" @click="chooseImage">
            <image src="/static/image-text.png" class="menu-icon"></image>
            <text>图片识别</text>
          </view>
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

      <!-- 实时语音录制状态显示 -->
      <view v-if="isRecording" class="recording-status">
        <text>{{ recordingTime }}秒 - 正在录音中...</text>
        <view class="stop-btn" @click="stopRealTimeSpeech">
          <text>停止</text>
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
const showMenu = ref(false);
const isRecording = ref(false);
const recordingTime = ref(0);

let recorder = null;
let recordingTimer = null;
let wsInstance = null;
let recordingFrames = [];

const messageList = reactive([
  {
    role: 'assistant',
    content: '你好！我是智学星河助手。你可以点击加号上传图片、视频或进行实时语音识别。',
    loading: false
  }
]);

// ==================== API 配置 ====================
// 1. 图片识别服务 (PaddleOCR)
const IMAGE_RECOGNITION_API_URL = 'http://101.43.110.90:8080/ocr';

// 2. 实时语音识别 WebSocket (FastAPI 包装的科大讯飞)
const REALTIME_SPEECH_WS_URL = 'ws://101.43.110.90:8000/api/v1/asr/ws/realtime?token=12345678';

// 3. Whisper 服务 (用于音频文件转写)
const WHISPER_API_URL = 'http://114.55.97.51:8000/transcribe/';
const WHISPER_API_KEY = 'jackeylove';

// 4. DeepSeek 服务 (AI 回复)
const DEEPSEEK_API_URL = 'http://116.62.128.164:5000/chat';

// ==================== 菜单控制 ====================
const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const closeMenu = () => {
  showMenu.value = false;
};

// ==================== 实时语音识别 (WebSocket) ====================
const handleRealtimeSpeech = async () => {
  closeMenu();
  
  // 请求录音权限
  try {
    const res = await uni.requestRecordPermission();
    if (res.state !== 'granted') {
      uni.showToast({ title: '需要录音权限', icon: 'none' });
      return;
    }
  } catch (err) {
    console.error('权限请求失败:', err);
  }

  if (isRecording.value) {
    stopRealTimeSpeech();
    return;
  }

  // 初始化录音
  const recorderManager = uni.getRecorderManager();
  recorder = recorderManager;

  recorder.onStart(() => {
    isRecording.value = true;
    recordingTime.value = 0;
    recordingFrames = [];
    
    // 启动计时器
    recordingTimer = setInterval(() => {
      recordingTime.value++;
      if (recordingTime.value > 300) {
        stopRealTimeSpeech();
      }
    }, 1000);

    uni.showToast({ title: '开始录音...', icon: 'none', duration: 1000 });
  });

  recorder.onFrame((res) => {
    if (res.frameBuffer && wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(res.frameBuffer);
    }
  });

  recorder.onStop((res) => {
    isRecording.value = false;
    if (recordingTimer) {
      clearInterval(recordingTimer);
    }
  });

  recorder.onError((err) => {
    isRecording.value = false;
    console.error('录音错误:', err);
    uni.showToast({ title: '录音出错', icon: 'none' });
  });

  // 连接 WebSocket
  connectWebSocket();

  // 开始录音 (16kHz, 单声道, 16bit)
  recorder.start({
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 128000,
    format: 'pcm'
  });
};

const connectWebSocket = () => {
  try {
    wsInstance = new WebSocket(REALTIME_SPEECH_WS_URL);

    wsInstance.onopen = () => {
      console.log('WebSocket 连接成功');
    };

    wsInstance.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('服务器消息:', data);

        if (data.action === 'ready') {
          // 服务器已就绪
          uni.showToast({ title: '服务器就绪', icon: 'none', duration: 500 });
        } else if (data.action === 'started') {
          // 识别已开始
          console.log('识别开始');
        } else if (data.action === 'result' && data.text) {
          // 返回增量识别结果
          const recognizedText = data.text || '';
          if (recognizedText) {
            inputText.value = recognizedText;
          }
        } else if (data.action === 'ack') {
          // 服务器确认
          console.log('服务器 ACK');
        } else if (data.action === 'done') {
          // 识别完成
          stopRealTimeSpeech();
          uni.showToast({ title: '识别完成', icon: 'success', duration: 1000 });
        } else if (data.action === 'error') {
          // 错误信息
          console.error('识别错误:', data.detail);
          uni.showToast({ title: `错误: ${data.detail}`, icon: 'none' });
          stopRealTimeSpeech();
        }
      } catch (e) {
        console.error('解析 WebSocket 消息失败:', e);
      }
    };

    wsInstance.onerror = (err) => {
      console.error('WebSocket 错误:', err);
      uni.showToast({ title: 'WebSocket 连接失败', icon: 'none' });
      stopRealTimeSpeech();
    };

    wsInstance.onclose = () => {
      console.log('WebSocket 连接已关闭');
    };
  } catch (e) {
    console.error('WebSocket 连接异常:', e);
    uni.showToast({ title: '无法连接服务器', icon: 'none' });
  }
};

const stopRealTimeSpeech = () => {
  isRecording.value = false;
  
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }

  if (recorder) {
    try {
      recorder.stop();
    } catch (e) {
      console.error('停止录音失败:', e);
    }
  }

  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    try {
      // 发送结束信号
      wsInstance.send(JSON.stringify({ action: 'end' }));
      wsInstance.close();
    } catch (e) {
      console.error('关闭 WebSocket 失败:', e);
    }
    wsInstance = null;
  }
};

// ==================== 图片识别逻辑 ====================
const chooseImage = () => {
  closeMenu();
  
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
    name: 'image',
    success: (res) => {
      if (res.statusCode !== 200) {
        console.error('图片识别服务端错误:', res.statusCode, res.data);
        uni.showToast({ title: `服务错误: ${res.statusCode}`, icon: 'none' });
        return;
      }

      try {
        let data = JSON.parse(res.data);
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

// ==================== 视频转文字逻辑 ====================
const chooseVideoOrAudio = () => {
  closeMenu();
  
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
    type: ['video'],
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

  closeMenu();

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
/* 保持原有样式，新增菜单相关样式 */
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
  position: relative;
}

/* 加号菜单按钮 */
.plus-menu-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  border-radius: 50%;
  background-color: #007AFF;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.plus-menu-btn:active {
  background-color: #0051BA;
}

.plus-icon {
  font-size: 28px;
  color: white;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.plus-icon.rotate {
  transform: rotate(45deg);
}

/* 下拉菜单 */
.menu-dropdown {
  position: absolute;
  bottom: 60px;
  left: 10px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f5f5f5;
}

.menu-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
}

.menu-item text {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 录音状态显示 */
.recording-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff3cd;
  border-radius: 8px;
  padding: 10px 15px;
  margin-top: 10px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.recording-status text {
  color: #856404;
  font-size: 14px;
  font-weight: bold;
}

.stop-btn {
  background-color: #dc3545;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.stop-btn:active {
  background-color: #c82333;
}

/* 文本输入框 */
.text-input {
  flex: 1;
  height: 40px;
  padding: 0 10px;
  font-size: 16px;
  background-color: transparent;
  border: none;
}

/* 发送按钮 */
.send-btn {
  margin-left: 10px;
  padding: 8px 15px;
  background-color: #007AFF;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  flex-shrink: 0;
}

.send-btn:active {
  background-color: #0051BA;
}

.send-btn.disabled {
  background-color: #cccccc;
}
</style>

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
                <!-- 修改：点击选择音频文件 -->
                <view class="voice-btn" @click="chooseAudioFile">
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
const messageList = reactive([
    {
        role: 'assistant',
        content: '你好！我是智学星河助手。你可以点击左侧的回形针上传音频文件进行转写。',
        renderedContent: '你好！我是智学星河助手。',
        loading: false
    }
]);

// --- 1. 选择音频文件逻辑 (替代录音) ---
const chooseAudioFile = () => {
    // 兼容 H5 和 App/小程序
    // H5 使用 uni.chooseFile
    // App/小程序 使用 uni.chooseMessageFile 或 uni.chooseMedia
    
    // #ifdef H5
    uni.chooseFile({
        count: 1,
        type: 'media', // 或者 'all'
        success: (res) => {
            // H5 返回的是 tempFiles 数组
            const filePath = res.tempFiles[0].path; 
            handleFileUpload(filePath);
        },
        fail: (err) => {
            console.log('选择失败', err);
        }
    });
    // #endif

    // #ifdef APP-PLUS || MP-WEIXIN
    uni.chooseMessageFile({
        count: 1,
        type: 'file', // 允许选择所有文件
        extension: ['mp3', 'wav', 'm4a', 'aac'], // 限制后缀，可选
        success: (res) => {
            const filePath = res.tempFiles[0].path;
            handleFileUpload(filePath);
        },
        fail: (err) => {
            console.log('选择失败', err);
        }
    });
    // #endif
};

// --- 2. 上传音频给 Whisper API ---
// --- 2. 上传音频给 Whisper API ---
const handleFileUpload = (filePath) => {
    uni.showLoading({ title: '正在转文字...' });

    // 1. 读取文件并转换为 Base64
    // 注意：H5 和 App 端的 API 可能不同，这里以微信小程序/H5 兼容写法为例
    const fs = uni.getFileSystemManager();

    fs.readFile({
        filePath: filePath,
        encoding: 'base64', // 直接读取为 base64
        success: (res) => {
            const base64Data = res.data;

            // 2. 准备 JSON 数据
            // 请根据你的 DeepSeek API 文档调整字段名，这里假设是 'audio_base64'
            const jsonData = {
                // "file": base64Data, // 有些 API 可能叫 file
                "audio": base64Data,  // 常见字段名
                "model": "whisper-1" // 如果需要指定模型
            };

            // 3. 发送 JSON 请求
            uni.request({
                url: 'https://consentingly-uliginous-nasir.ngrok-free.dev/transcribe', // 确保路径正确
                method: 'POST',
                data: jsonData,
                header: {
                    'ngrok-skip-browser-warning': 'true',
                    'Content-Type': 'application/json' // ⭐ 必须是 JSON
                },
                success: (response) => {
                    uni.hideLoading();
                    console.log('API 响应:', response.data);

                    // 解析 DeepSeek 返回的结果
                    // 注意：DeepSeek 的返回结构可能和 Whisper 不一样
                    let text = '';
                    if (response.data && response.data.text) {
                        text = response.data.text;
                    } else if (response.data && response.data.choices) {
                        text = response.data.choices[0].message.content;
                    }

                    if (text) {
                        console.log('识别结果:', text);
                        // 在这里更新你的 UI，比如 this.setData({ result: text })
                    } else {
                        uni.showToast({ title: '识别失败，返回空', icon: 'none' });
                    }
                },
                fail: (err) => {
                    uni.hideLoading();
                    console.error('请求失败:', err);
                    uni.showToast({ title: '网络错误', icon: 'none' });
                }
            });
        },
        fail: (err) => {
            uni.hideLoading();
            console.error('读取文件失败:', err);
            uni.showToast({ title: '文件读取失败', icon: 'none' });
        }
    });
};

// --- 3. 发送消息给 DeepSeek ---
const sendMessage = async () => {
    const currentText = inputText.value.trim();
    if (!currentText) return;

    // 1. 添加用户消息到界面
    messageList.push({
        role: 'user',
        content: currentText,
        renderedContent: currentText,
        loading: false
    });

    // 清空输入框并滚动到底部
    inputText.value = '';
    scrollToBottom();

    // 2. 添加一个“正在思考”的 AI 占位消息
    const aiMsgIndex = messageList.length;
    messageList.push({
        role: 'assistant',
        content: '',
        renderedContent: '',
        loading: true
    });
    scrollToBottom();

    // 3. 发起网络请求
  // 3. 发起网络请求
  try {
      // ⭐️ 关键修改点：直接 await，接收返回的对象
      const res = await uni.request({
          url: 'http://116.62.128.164:5000/chat',
          method: 'POST',
          header: {
              'Content-Type': 'application/json',
          },
          data: {
              "message": currentText
          }
      });
  
      // ⭐️ 这里 res 就是 { statusCode: ..., data: ... }
      // 直接使用即可，不需要 [err, res] 解构
      if (res.statusCode !== 200) { // 这里直接用 res.statusCode
          throw new Error(`请求失败，HTTP 状态码: ${res.statusCode}`);
      }
  
      // 继续处理数据...
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
      console.error("请求失败:", error);
      // 安全更新错误信息
      if (messageList[aiMsgIndex]) {
          messageList[aiMsgIndex].loading = false;
          messageList[aiMsgIndex].content = `请求出错: ${error.message || '未知错误'}`;
          messageList[aiMsgIndex].renderedContent = messageList[aiMsgIndex].content;
      }
  }
};
// --- 辅助函数 ---
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

const scrollToBottom = () => {
    nextTick(() => {
        if (messageList.length > 0) {
            scrollIntoView.value = 'msg-' + (messageList.length - 1);
        }
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
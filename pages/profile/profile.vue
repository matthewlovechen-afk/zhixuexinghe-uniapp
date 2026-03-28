<script setup>
import { ref } from 'vue';

const transcribedText = ref('');
const isLoading = ref(false);
const errorInfo = ref('');

// ================= 配置区域 =================
// 你的阿里云服务器地址
const API_URL = 'http://114.55.97.51:8000/transcribe/';
// 你的API密钥（后端验证用）
const API_KEY = 'jackeylove';
// ===========================================

// --- 获取文件的临时路径（兼容H5）---
const getFilePath = (file) => {
    // H5端：从File对象获取临时URL
    if (typeof file === 'object' && file instanceof File) {
        return URL.createObjectURL(file);
    }
    // 其他端：直接返回路径
    return file;
};

// --- 1. 选择音频文件逻辑 ---
const chooseAudioFile = () => {
    if (isLoading.value) return;
    errorInfo.value = '';
    transcribedText.value = '';

    // #ifdef H5
    uni.chooseFile({
        count: 1,
        type: 'media',
        success: (res) => {
            console.log('选择的文件:', res.tempFiles[0]);
            // 获取真实的File对象
            const fileObj = res.tempFiles[0].originalFileObj || res.tempFiles[0];
            // H5端也使用 uploadFile
            handleUpload(fileObj, true);
        },
        fail: (err) => {
            console.error('H5选择失败:', err);
            errorInfo.value = '选择文件失败';
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif

    // #ifdef APP-PLUS
    uni.chooseFile({
        count: 1,
        type: 'media',
        success: (res) => {
            console.log('App选择的文件:', res.tempFiles[0]);
            const filePath = res.tempFiles[0].path;
            handleUpload(filePath);
        },
        fail: (err) => {
            console.error('App选择失败:', err);
            errorInfo.value = '选择文件失败';
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
            console.log('小程序选择的文件:', res.tempFiles[0]);
            const filePath = res.tempFiles[0].tempFilePath;
            handleUpload(filePath);
        },
        fail: (err) => {
            console.error('小程序选择失败:', err);
            errorInfo.value = '选择文件失败';
            uni.showToast({ title: '选择文件失败', icon: 'none' });
        }
    });
    // #endif
};

// --- 统一的文件上传处理（所有平台都用 uni.uploadFile）---
const handleUpload = (file, isH5File = false) => {
    uni.showLoading({ title: '转写中...', mask: true });
    isLoading.value = true;

    // 构建上传参数
    let uploadOptions = {
        url: API_URL,
        name: 'file',  // 后端参数名是 'file'
        header: {
            'X-API-Key': API_KEY
        },
        success: (res) => {
            console.log('状态码:', res.statusCode);
            console.log('原始响应:', res.data);
            
            let data;
            try { 
                data = JSON.parse(res.data); 
                console.log('解析后数据:', data);
            } catch(e) {
                console.error('JSON解析失败:', e);
                data = {};
            }
            
            if (res.statusCode === 200 && data.transcription) {
                transcribedText.value = data.transcription;
                uni.showToast({ title: '转换成功', icon: 'success' });
                errorInfo.value = '';
            } else if (res.statusCode === 403) {
                errorInfo.value = 'API密钥错误，请检查配置';
                uni.showToast({ title: '密钥错误', icon: 'none' });
            } else if (res.statusCode === 422) {
                let errorMsg = '请求参数错误：未收到文件';
                if (data && data.detail) {
                    if (Array.isArray(data.detail)) {
                        errorMsg = data.detail.map(e => e.msg || e).join(', ');
                    } else if (typeof data.detail === 'object') {
                        errorMsg = JSON.stringify(data.detail);
                    } else {
                        errorMsg = data.detail;
                    }
                }
                errorInfo.value = errorMsg;
                uni.showToast({ title: '上传失败', icon: 'none' });
                console.error('422详细错误:', JSON.stringify(data));
            } else {
                errorInfo.value = data?.detail || `请求失败 (${res.statusCode})`;
                uni.showToast({ title: '转换失败', icon: 'none' });
            }
        },
        fail: (err) => {
            console.error('网络错误:', err);
            errorInfo.value = '网络连接失败，请检查网络';
            uni.showToast({ title: '网络错误', icon: 'none' });
        },
        complete: () => {
            uni.hideLoading();
            isLoading.value = false;
        }
    };

    // H5端需要特殊处理：使用 file 对象
    if (isH5File && typeof file === 'object' && file instanceof File) {
        // H5端使用 files 参数
        uploadOptions.files = [{
            name: 'file',
            file: file
        }];
        // 删除 name 参数（H5端用 files 代替）
        delete uploadOptions.name;
    } else {
        // App/小程序端使用 filePath
        uploadOptions.filePath = file;
    }

    uni.uploadFile(uploadOptions);
};
</script>

<template>
    <view class="container">
        <!-- 顶部标题 -->
        <view class="header">
            智学星河 - 语音转文字
        </view>

        <!-- 中间结果显示区域 -->
        <view class="content">
            <!-- 提示文字 -->
            <view class="tip">
                📁 支持 mp3, wav, mp4, m4a, aac 等格式
            </view>
            
            <!-- 转写结果文本框 -->
            <textarea 
                class="result-textarea" 
                v-model="transcribedText" 
                placeholder="转写结果将显示在这里..."
                :disabled="isLoading"
            />
            
            <!-- 错误信息显示 -->
            <view v-if="errorInfo" class="error-info">
                ⚠️ {{ errorInfo }}
            </view>
        </view>

        <!-- 底部操作区域 -->
        <view class="footer">
            <view 
                class="upload-btn" 
                :class="{ 'loading': isLoading }"
                @click="chooseAudioFile"
            >
                <text v-if="!isLoading">📎 选择音频/视频文件</text>
                <text v-else>⏳ 转写中，请稍候...</text>
            </view>
        </view>
    </view>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f7fa;
}

.header {
    padding: 40rpx 0;
    text-align: center;
    background-color: #ffffff;
    font-weight: bold;
    font-size: 40rpx;
    color: #2c3e50;
    border-bottom: 1rpx solid #e9ecef;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
}

.content {
    flex: 1;
    padding: 32rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.tip {
    color: #6c757d;
    font-size: 26rpx;
    margin-bottom: 24rpx;
    text-align: center;
    background-color: #e9ecef;
    padding: 16rpx 24rpx;
    border-radius: 32rpx;
}

.result-textarea {
    width: 100%;
    flex: 1;
    border: 1rpx solid #dee2e6;
    border-radius: 20rpx;
    padding: 28rpx;
    font-size: 30rpx;
    line-height: 1.6;
    color: #212529;
    background-color: #ffffff;
    box-sizing: border-box;
    font-family: inherit;
}

.error-info {
    margin-top: 24rpx;
    color: #dc3545;
    font-size: 26rpx;
    text-align: center;
    background-color: #ffe6e6;
    padding: 16rpx;
    border-radius: 16rpx;
}

.footer {
    padding: 32rpx 32rpx 48rpx;
    background-color: #ffffff;
    border-top: 1rpx solid #e9ecef;
    width: 100%;
    box-sizing: border-box;
}

.upload-btn {
    width: 100%;
    padding: 32rpx;
    background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
    color: #ffffff;
    font-size: 34rpx;
    font-weight: 500;
    text-align: center;
    border-radius: 60rpx;
    transition: all 0.3s;
    box-shadow: 0 4rpx 12rpx rgba(0,122,255,0.3);
}

.upload-btn:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(0,122,255,0.2);
}

.upload-btn.loading {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    pointer-events: none;
    opacity: 0.8;
}
</style>
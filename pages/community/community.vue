<template>
    <view class="community-container">
        <web-view src="https://www.xingqiushequ.tech/"></web-view>
    </view>
</template>

<script setup>
import { onReady, onBackPress } from '@dcloudio/uni-app';

// 用于存储子 webview 的实例
let wvInstance = null;
// 记录上次点击返回键的时间，用于实现双击退出
let lastBackTime = 0;

onReady(() => {
    // #ifdef APP-PLUS
    const sysInfo = uni.getSystemInfoSync();
    const safeAreaBottom = sysInfo.safeAreaInsets ? sysInfo.safeAreaInsets.bottom : 0;
    const tabbarHeight = 50; 
    const totalBottom = tabbarHeight + safeAreaBottom;

    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const currentWebview = page.$getAppWebview();

    setTimeout(() => {
        const children = currentWebview.children();
        if (children && children.length > 0) {
            wvInstance = children[0];
            wvInstance.setStyle({
                bottom: totalBottom + 'px'
            });
        }
    }, 500);
    // #endif
});

// 监听物理返回键 / 顶部导航栏返回
onBackPress((options) => {
    // #ifdef APP-PLUS
    
    // 如果实例还没准备好，走系统默认逻辑
    if (!wvInstance) return false;

    // 检查网页内部是否还能后退
    wvInstance.canBack((e) => {
        if (e.canBack) {
            // 1. 如果网页可以后退，则调用底层 API 让网页后退
            wvInstance.back();
        } else {
            // 2. 如果网页已经不能后退了（处于最顶层目录）
            const nowTime = Date.now();
            // 判断两次点击时间间隔是否大于 2 秒 (2000毫秒)
            if (nowTime - lastBackTime > 2000) {
                lastBackTime = nowTime;
                uni.showToast({
                    title: '再按一次退出智学星河',
                    icon: 'none'
                });
            } else {
                // 连续点击了两次，直接强行退出 App
                plus.runtime.quit();
            }
        }
    });

    // 重点：必须立刻 return true，这会告诉 uni-app “我已经接管了返回键，你不要关页面”
    return true; 
    
    // #endif
});
</script>

<style scoped>
.community-container {
    width: 100%;
    height: 100vh;
}
</style>

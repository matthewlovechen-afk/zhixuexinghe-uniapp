// utils/request.js

const BASE_URL = 'https://consentingly-uliginous-nasir.ngrok-free.dev.ngrok.io'; // 记得确认这里没有多余的 https://

const http = (options) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			// 大模型生成较慢，超时时间设为 120 秒
			timeout: 120000, 
			header: {
				'Content-Type': options.contentType || 'application/json',
				// 如果有 Token 认证，在此处添加
				// 'Authorization': 'Bearer ' + uni.getStorageSync('token')
			},
			success: (res) => {
				if (res.statusCode === 200) {
					resolve(res.data);
				} else {
					uni.showToast({
						title: `请求失败: ${res.statusCode}`,
						icon: 'none'
					});
					reject(res);
				}
			},
			fail: (err) => {
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				});
				reject(err);
			}
		});
	});
};

// 导出方法，方便在其他文件中调用
export default http;
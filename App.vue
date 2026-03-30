<script>
export default {
	onLaunch: function() {
		console.log('App Launch');
		// 检查本地是否存有登录凭证 (token)
		const token = uni.getStorageSync('token');
		if (!token) {
			// 如果没有 token，强制跳转到登录页
			uni.reLaunch({
				url: '/pages/login/login'
			});
		}
	},
	onShow: function() {
		console.log('App Show')
	},
	onHide: function() {
		console.log('App Hide')
	}
}
</script>

<style>
	/*每个页面公共css */
</style>
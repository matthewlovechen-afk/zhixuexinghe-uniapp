'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { username, password } = event;
	const collection = db.collection('users');
	
	const res = await collection.where({ username, password }).get();
	
	if (res.data.length > 0) {
		const userInfo = res.data[0];
		delete userInfo.password;
		
		return { 
			code: 200, 
			message: '登录成功', 
			token: 'token-' + Date.now(),
			userInfo: userInfo 
		};
	} else {
		return { code: 400, message: '用户名或密码错误' };
	}
};
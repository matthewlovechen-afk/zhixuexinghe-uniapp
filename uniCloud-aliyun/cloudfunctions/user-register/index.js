'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { username, password } = event;
	const collection = db.collection('users');
	
	// 检查用户名是否已存在
	const checkUser = await collection.where({ username }).get();
	if (checkUser.data.length > 0) {
		return { code: 400, message: '用户名已存在' };
	}
	
	// 插入新用户
	const res = await collection.add({
		username,
		password, // 生产环境中应使用加密算法处理密码
		create_time: Date.now()
	});
	
	if (res.id) {
		return { code: 200, message: '注册成功' };
	} else {
		return { code: 500, message: '注册失败' };
	}
};
'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	// 预期结构: { uid: '用户ID', avatarUrl: '云端图片链接'(可选), username: '新用户名'(可选) }
	const { uid, avatarUrl, username } = event;
	
	if (!uid) {
		return { code: 400, message: '缺少用户ID' };
	}

	if (!avatarUrl && !username) {
		return { code: 400, message: '没有收到需要更新的内容' };
	}

	const collection = db.collection('users');
	
	try {
		// 动态构建需要更新的数据对象
		const updateData = {
			update_time: Date.now() 
		};
		if (avatarUrl) updateData.avatar = avatarUrl;
		if (username) updateData.username = username;

		const res = await collection.doc(uid).update(updateData);
		
		if (res.updated === 1) {
			return { 
				code: 200, 
				message: '资料更新成功',
				data: updateData
			};
		} else {
			return { code: 404, message: '未找到该用户或数据未变更' };
		}
	} catch (e) {
		console.error('更新数据库失败:', e);
		return { code: 500, message: '服务器内部错误' };
	}
};
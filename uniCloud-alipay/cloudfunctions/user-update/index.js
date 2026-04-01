'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	// 增加 gender, birthday, signature
	const { uid, avatarUrl, username, gender, birthday, signature } = event;
	
	if (!uid) {
		return { code: 400, message: '缺少用户ID' };
	}

	const collection = db.collection('users');
	
	try {
		// 动态构建需要更新的数据对象
		const updateData = {
			update_time: Date.now() 
		};
		if (avatarUrl !== undefined) updateData.avatar = avatarUrl;
		if (username !== undefined) updateData.username = username;
		if (gender !== undefined) updateData.gender = gender;
		if (birthday !== undefined) updateData.birthday = birthday;
		if (signature !== undefined) updateData.signature = signature;

		// 如果没有传入任何需要更新的字段
		if (Object.keys(updateData).length === 1) {
			return { code: 400, message: '没有收到需要更新的内容' };
		}

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


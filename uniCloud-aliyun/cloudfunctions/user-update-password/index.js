'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { uid, oldPassword, newPassword } = event;

	// 1. 严格的参数校验
	if (!uid || !oldPassword || !newPassword) {
		return { code: 400, message: '参数缺失，请填写完整' };
	}

	if (oldPassword === newPassword) {
		return { code: 400, message: '新密码不能与旧密码相同' };
	}

	const collection = db.collection('users');
	
	try {
		// 2. 查询用户当前数据以验证旧密码
		const userRecord = await collection.doc(uid).get();
		
		if (userRecord.data.length === 0) {
			return { code: 404, message: '用户不存在' };
		}
		
		if (userRecord.data[0].password !== oldPassword) {
			return { code: 400, message: '旧密码错误' };
		}
		
		// 3. 验证通过，执行更新
		const res = await collection.doc(uid).update({
			password: newPassword,
			update_time: Date.now()
		});
		
		if (res.updated === 1) {
			return { code: 200, message: '密码修改成功' };
		} else {
			return { code: 500, message: '密码修改失败，系统异常' };
		}
		
	} catch (e) {
		console.error('修改密码失败:', e);
		return { code: 500, message: '服务器内部错误' };
	}
};
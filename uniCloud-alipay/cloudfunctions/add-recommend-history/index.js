'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	// 接收前端传过来的参数
	const { user_id, grade, subject, top_k } = event;

	// 如果没有 user_id（未登录状态），可以选择不记录或者记录为游客
	if (!user_id) {
		return { code: 401, msg: 'User not logged in, ignore record.' };
	}

	try {
		// 将行为记录插入到 recommend-history 集合中
		const res = await db.collection('recommend-history').add({
			user_id: user_id,       // 关联的用户 ID
			grade: grade,           // 搜索的年级
			subject: subject,       // 搜索的学科
			top_k: top_k,           // 推荐的数量
			create_time: Date.now() // 记录创建的精确时间戳
		});

		return {
			code: 200,
			msg: '记录成功',
			data: res
		};
	} catch (e) {
		return {
			code: 500,
			msg: '记录失败',
			error: e
		};
	}
};
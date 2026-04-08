'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	// 1. 接收前端传过来的参数（新增了 recommend_type 和 target_user_id）
	const { user_id, recommend_type, grade, subject, top_k, target_user_id } = event;

	// 如果没有 user_id（未登录状态），可以选择不记录或者记录为游客
	if (!user_id) {
		return { code: 401, msg: 'User not logged in, ignore record.' };
	}

	try {
		// 2. 将行为记录插入到 recommend-history 集合中
		const res = await db.collection('recommend-history').add({
			user_id: user_id,                               // 关联的当前登录用户 ID
			recommend_type: recommend_type || 'active',     // 推荐类型：'active'(主动) | 'auto'(自动) | 'hybrid'(混合)
			target_user_id: target_user_id || '',           // 自动/混合推荐时查询的目标用户ID
			grade: grade || '',                             // 搜索的年级 (自动推荐时可能为空)
			subject: subject || '',                         // 搜索的学科 (自动推荐时可能为空)
			top_k: top_k || 10,                             // 推荐的数量
			create_time: Date.now()                         // 记录创建的精确时间戳
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
'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
    try {
        const collection = db.collection('recommend-history');
        const res = await collection
            .orderBy('create_date', 'desc')
            .limit(100)
            .get();
        
        return {
            code: 200,
            message: 'success',
            count: res.data.length,
            data: res.data
        };
    } catch (err) {
        console.error('查询失败:', err.message);
        return {
            code: 500,
            message: err.message,
            data: []
        };
    }
};
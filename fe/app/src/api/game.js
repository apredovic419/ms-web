import {beInstance} from '../utils.js';

// 获取游戏状态
export const beServerStatus = async () => {
    try {
        return await beInstance.get('/api/v1/game/status');
    } catch (error) {
        throw error;
    }
}

// 获取角色列表
export const beCharList = async () => {
    try {
        return await beInstance.get('/api/v1/character/list');
    } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
    }
};

// 每日签到
export const beCheckIn = async (cid) => {
    try {
        return await beInstance.post('/api/v1/user/checkin', {character_id: cid});
    } catch (error) {
        throw error;
    }
}

// 游戏解卡
export const beEA = async () => {
    try {
        return await beInstance.post('/api/v1/game/ea');
    } catch (error) {
        throw error;
    }
}

// 邀请码申请
export const beInviteCode = async () => {
    try {
        return await beInstance.post('/api/v1/user/apply_invite');
    } catch (error) {
        throw error;
    }
}

// 资料库搜索
export const beItemSearch = async (keyword, category, page, limit) => {
    try {
        return await beInstance.get('/api/v1/library/search', {
            params: {
                query: keyword,
                category: category,
                page: page,
                size: limit,
            },
            timeout: 60000,
        });
    } catch (error) {
        console.log(typeof error)

        console.error('资料库查询失败:', error);
        throw error;
    }
}

// 查询来源
export const beLibrarySource = async (oId, category) => {
    try {
        return await beInstance.get('/api/v1/library/source/', {
            params: {
                oid: oId,
                category: category,
            }
        });
    } catch (error) {
        console.error('查询物品来源失败:', error);
        throw error;
    }
}

// 角色排行
export const beCharRank = async (job, sort, size, page) => {
    try {
        return await beInstance.get('/api/v1/game/character/rank', {
            params: {
                job: job,
                sort: sort,
                size: size,
                page: page,
            }
        });
    } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
    }
}

// 家族排行
export const beGuildRank = async (size, page) => {
    try {
        return await beInstance.get('/api/v1/game/guild/rank', {
            params: {
                size: size,
                page: page,
            }
        });
    } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
    }
}
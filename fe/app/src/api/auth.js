import {storage, beInstance} from '../utils.js';

// 登录
export const beLogin = async (username, password) => {
    try {
        const response = await beInstance.post('/api/v1/auth/login', {username, password});
        const nowTime = Date.now();
        let expireTime = response.data.expires_in * 1000 - nowTime;
        console.log(`登录成功，token有效期 ${expireTime / 1000} 秒`);
        storage.setExpire('token', response.data.token, expireTime);
        expireTime = response.data.refresh_expires_in * 1000 - nowTime;
        storage.setExpire('refresh_token', response.data.refresh_token, expireTime);
        return response;
    } catch (error) {
        console.error('登录失败:', error);
        throw error;
    }
};

// 刷新Token
export const beRefreshToken = async (refreshToken) => {
    try {
        const response = await beInstance.post(`/api/v1/auth/refresh?refresh_token=${refreshToken}`);
        const nowTime = Date.now();
        let expireTime = response.data.expires_in * 1000 - nowTime;
        console.log(`刷新token成功，token有效期 ${expireTime / 1000} 秒`);
        storage.setExpire('token', response.data.token, expireTime);
        expireTime = response.data.refresh_expires_in * 1000 - nowTime;
        storage.setExpire('refresh_token', response.data.refresh_token, expireTime);
        return response;
    } catch (error) {
        console.error('刷新token失败:', error);
        throw error;
    }
}

// 用户信息
export const beUserInfo = async () => {
    try {
        const response = await beInstance.get('/api/v1/user/info');
        console.log('获取用户信息成功:', response.data);
        return response;
    } catch (error) {
        if (error.code === 401) {
            const refreshToken = storage.getExpire('refresh_token');
            if (!refreshToken) {
                console.error('刷新token失败，refresh_token不存在');
                throw error;
            }
            try {
                await beRefreshToken(refreshToken)
                return await beInstance.get('/api/v1/user/info');
            } catch (refreshError) {
                console.error('刷新token失败:', refreshError);
                throw refreshError; // 抛出刷新token的错误
            }
        }
        console.error('获取用户信息失败:', error);
        throw error;
    }
}

export const beCharList = async () => {
    try {
        return await beInstance.get('/api/v1/character/list');
    } catch (error) {
        console.error('获取角色列表失败:', error);
        throw error;
    }
};

export const beResetReqCode = async (username) => {
    try {
        return await beInstance.post('/api/v1/auth/reset', {username});
    } catch (error) {
        console.error('请求验证码失败:', error);
        throw error;
    }
}

export const beResetPassword = async (username, password, captcha) => {
    try {
        return await beInstance.put('/api/v1/auth/reset', {username, password, captcha});
    } catch (error) {
        console.error('重置密码失败:', error);
        throw error;
    }
}

export const beVote = async (username) => {
    try {
        return await beInstance.post('/api/v1/vote/', {username});
    } catch (error) {
        console.error('投票失败:', error);
        throw error;
    }
}

export const beTos = async () => {
    try {
        return await beInstance.get("/api/tos");
    } catch (error) {
        throw error;
    }
}

export const beInviteHelper = async () => {
    try {
        return await beInstance.get("/api/invite");
    } catch (error) {
        throw error;
    }
}

// 获取注册验证码
export const beRegCaptcha = async (email) => {
    try {
        return await beInstance.post('/register/captcha', {email});
    } catch (error) {
        console.error('获取注册验证码失败:', error);
        throw error;
    }
}

// 确认注册
export const beRegister = async (username, email, code, pwd1, pwd2, birthday, invitation_code, captcha) => {
    try {
        return await beInstance.post('/api/v1/auth/register', {username, email, code, pwd1, pwd2, birthday, invitation_code, captcha});
    } catch (error) {
        console.error('注册失败:', error);
        throw error;
    }
}
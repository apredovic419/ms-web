import axios from 'axios';

export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';
export const beHost = process.env.REACT_APP_API_BASE_URL || ``;
export const cdnHost = process.env.REACT_APP_CDN_BASE_URL || ``;
export const beInstance = axios.create({
    baseURL: beHost,
    headers: {
        'Content-Type': 'application/json', // 设置请求头为JSON
    },
    timeout: 150000,
});

// 添加请求拦截器，统一添加token
beInstance.interceptors.request.use(
    (config) => {
        const token = storage.getExpire('token'); // 获取token，这里可以根据实际情况修改
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 添加响应拦截器，统一处理响应
beInstance.interceptors.response.use(
    (response) => {
        // 获取业务数据，如果业务状态码不为0，抛出错误
        if (response.data.code !== 200) {
            const errorMessage = response?.data?.message || '服务器错误';
            console.error(errorMessage);
            return Promise.reject(response.data);
        }
        return response.data; // 直接返回data部分
    },
    (error) => {
        // 统一处理错误
        if (error.code === 'ECONNABORTED') {
            return Promise.reject('处理超时');
        }
        const errorMessage = error.response?.data?.message || '服务器错误';
        console.error(errorMessage);
        return Promise.reject(errorMessage);
    }
);

// 工具函数
export const padStart = (str, n) => (Array(n).join(0) + str).slice(-n);

export const getServerTime = () => {
    const timezone = 8;
    const nowDate = new Date();
    const targetDate = new Date(nowDate.getTime() + nowDate.getTimezoneOffset() * 60 * 1000 + timezone * 60 * 60 * 1000);
    return `${padStart(targetDate.getHours(), 2)}:${padStart(targetDate.getMinutes(), 2)}:${padStart(targetDate.getSeconds(), 2)}`;
};

export const getLocalDate = (date) => {
    const dt = new Date(date.replace(/-/g, '/'));
    const tz = dt.getTimezoneOffset() > 0 ? `GMT-${padStart(Math.abs(dt.getTimezoneOffset() / 60), 2)}:00` : `GMT+${padStart(Math.abs(dt.getTimezoneOffset() / 60), 2)}:00`;
    return `${dt.getFullYear()}-${padStart(dt.getMonth() + 1, 2)}-${padStart(dt.getDate(), 2)} ${padStart(dt.getHours(), 2)}:${padStart(dt.getMinutes(), 2)}:${padStart(dt.getSeconds(), 2)} ${tz}`;
};

export const getQueryVariable = (variable) => {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return false;
};

export const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

// 本地存储
export const storage = {
    setExpire: (key, value, expire) => {
        const obj = {
            data: value,
            time: Date.now(),
            expire: expire,
        };
        localStorage.setItem(key, JSON.stringify(obj));
    },
    getExpire: (key) => {
        const val = localStorage.getItem(key);
        if (!val) {
            return val;
        }
        const parsedVal = JSON.parse(val);
        if (Date.now() - parsedVal.time > parsedVal.expire) {
            localStorage.removeItem(key);
            return null;
        }
        return parsedVal.data;
    },
    clear: () => {
        localStorage.clear();
    },
    setItem: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    getItem: (key) => {
        return JSON.parse(localStorage.getItem(key));
    },
};

// 从错误对象中提取错误信息
export const extractMessage = (error, default_) => {
    let message = default_;
    if (typeof error === 'string') {
        message = error;
    } else if (error.message !== undefined) {
        message = error.message;
    }
    return message;
}

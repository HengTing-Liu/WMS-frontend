import type { RequestClientOptions } from '@vben/request';

import { RequestClient } from '@vben/request';
import { useAccessStore } from '@vben/stores';
import { preferences } from '@vben/preferences';

/**
 * 创建请求客户端
 */
export function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const token = accessStore.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Accept-Language'] = preferences.app.locale || 'zh-CN';
      return config;
    },
  });

  // 响应处理
  client.addResponseInterceptor({
    fulfilled: (response) => {
      const { data } = response;
      // 统一处理响应格式
      if (data && typeof data === 'object') {
        // 如果后端返回的数据没有 code 字段（如 rows/total 格式），直接返回数据
        if (data.code === undefined) {
          return data;
        }
        if (data.code !== 200 && data.code !== 0) {
          return Promise.reject(new Error(data.msg || data.message || '请求失败'));
        }
        return data.data || data;
      }
      return data;
    },
    rejected: (error) => {
      const msg = error?.response?.data?.msg || error?.message || '网络错误';
      return Promise.reject(new Error(msg));
    },
  });

  return client;
}

// API 基础 URL
const apiURL = import.meta.env.VITE_GLOB_API_URL || '/api';

// 创建默认请求客户端
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

// 基础请求客户端（无拦截器）
export const baseRequestClient = createRequestClient(apiURL);

// 扩展下载方法
(requestClient as any).download = async (url: string, config?: any) => {
  return requestClient.get(url, {
    ...config,
    responseType: 'blob',
  });
};

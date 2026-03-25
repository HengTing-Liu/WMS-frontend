import { requestClient } from '#/api/request';

/**
 * 日志数据类型
 */
export interface SysLogResult {
  log_id: number;
  log_type: string;
  log_title: string;
  business_type?: string;
  method?: string;
  request_method?: string;
  request_url?: string;
  request_param?: string;
  request_result?: string;
  request_time?: number;
  user_id?: number;
  user_name?: string;
  ip?: string;
  location?: string;
  is_enabled?: number;
  create_by?: string;
  create_time?: string;
  update_by?: string;
  update_time?: string;
  remark?: string;
}

/**
 * 日志类型枚举
 */
export const LogTypeEnum = {
  OPERATE: 'operate',
  LOGIN: 'login',
  ACCESS: 'access',
  ERROR: 'error',
} as const;

/**
 * 日志类型映射
 */
export const LogTypeMap: Record<string, string> = {
  operate: '操作日志',
  login: '登录日志',
  access: '访问日志',
  error: '错误日志',
};

/**
 * 操作日志 CRUD API
 * 接口规范: /crud/{tableCode}
 */
export const sysLogApi = {
  // 分页查询
  page: async (params: any) => {
    const res = await requestClient.get('/crud/sys_log/list', { params });
    return {
      rows: res.rows || res.list || [],
      total: res.total || 0,
    };
  },

  // 获取详情
  get: async (id: number) => {
    const res = await requestClient.get(`/crud/sys_log/${id}`);
    return res;
  },

  // 删除
  delete: async (id: number) => {
    const res = await requestClient.delete(`/crud/sys_log/${id}`);
    return res;
  },

  // 批量删除
  batchDelete: async (ids: number[]) => {
    const promises = ids.map(id => requestClient.delete(`/crud/sys_log/${id}`));
    await Promise.all(promises);
    return { success: true };
  },

  // 导出
  export: async (params: any) => {
    const res = await requestClient.post('/crud/sys_log/export', params, {
      responseType: 'blob',
    });
    return res;
  },

  // 清空日志
  clear: async (logType: string) => {
    const res = await requestClient.delete(`/crud/sys_log/clear/${logType}`);
    return res;
  },
};

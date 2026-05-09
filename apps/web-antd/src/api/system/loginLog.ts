import { requestClient } from '#/api/request';

export interface LoginLogItem {
  infoId: number;
  userName: string;
  status: string;
  ipaddr: string;
  msg: string;
  accessTime: string;
  [key: string]: any;
}

export interface LoginLogListResult {
  total: number;
  rows: LoginLogItem[];
}

/** 登录日志列表 GET /api/logininfor/list */
export async function getLoginLogList(params: Record<string, any>) {
  return requestClient.get<LoginLogListResult>('/api/logininfor/list', {
    params,
    responseReturn: 'body',
  });
}

/** 删除登录日志 DELETE /api/logininfor/{infoId} */
export async function deleteLoginLog(infoId: number | number[] | string) {
  const idStr = Array.isArray(infoId) ? infoId.join(',') : String(infoId);
  return requestClient.delete(`/api/logininfor/${idStr}`, { responseReturn: 'body' });
}

/** 清空登录日志 */
export async function cleanLoginLog() {
  return requestClient.delete('/api/logininfor/clean', { responseReturn: 'body' });
}

/** 解锁用户 GET /api/logininfor/unlock/{userName} */
export async function unlockLoginUser(userName: string) {
  return requestClient.get(`/api/logininfor/unlock/${userName}`, { responseReturn: 'body' });
}

/** 导出登录日志 POST /api/logininfor/export */
export async function exportLoginLog(data: Record<string, any> = {}) {
  return requestClient.post('/api/logininfor/export', data, {
    responseType: 'blob',
    responseReturn: 'body',
  });
}

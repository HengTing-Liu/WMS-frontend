import { requestClient } from '#/api/request';

export interface DictTypeItem {
  createBy?: string | null;
  createTime?: string | null;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
  dictId: number;
  dictName: string;
  dictType: string;
  status: string;
  [key: string]: any;
}

export interface DictTypeListResult {
  total: number;
  rows: DictTypeItem[];
}

export interface DictTypeListParams {
  pageNum?: number;
  pageSize?: number;
  dictName?: string;
  dictType?: string;
  status?: string;
  params?: { beginTime?: string; endTime?: string };
}

/**
 * 获取字典类型列表
 * GET /api/dict/type/list
 */
async function getDictTypeList(params?: DictTypeListParams) {
  return requestClient.get<DictTypeListResult>('/api/dict/type/list', {
    params,
    responseReturn: 'body',
  });
}

/**
 * 新增字典类型
 * POST /api/dict/type
 */
async function addDictType(data: {
  dictName: string;
  dictType: string;
  status: string;
  remark?: string;
}) {
  return requestClient.post('/api/dict/type', data, { responseReturn: 'body' });
}

/**
 * 获取字典类型详情
 * GET /api/dict/type/{dictId}
 */
async function getDictTypeDetail(dictId: number | string) {
  return requestClient.get<DictTypeItem>(`/api/dict/type/${dictId}`, {
    responseReturn: 'body',
  });
}

/**
 * 编辑字典类型
 * PUT /api/dict/type
 */
async function editDictType(data: {
  dictId: number;
  dictName: string;
  dictType: string;
  status: string;
  remark?: string;
}) {
  return requestClient.put('/api/dict/type', data, { responseReturn: 'body' });
}

/**
 * 删除字典类型
 * DELETE /api/dict/type/{dictId}
 */
async function deleteDictType(dictId: number | number[] | string) {
  const idStr = Array.isArray(dictId) ? dictId.join(',') : String(dictId);
  return requestClient.delete(`/api/dict/type/${idStr}`, { responseReturn: 'body' });
}

/**
 * 导出字典类型
 * POST /api/dict/type/export
 */
async function exportDictType(data: DictTypeListParams = {}) {
  return requestClient.post('/api/dict/type/export', data, {
    responseType: 'blob',
    responseReturn: 'body',
  });
}

/**
 * 刷新字典缓存
 * GET /api/dict/type/refreshCache 或 POST（依后端实现）
 */
async function refreshDictCache() {
  return requestClient.get('/api/dict/type/refreshCache', { responseReturn: 'body' });
}

export {
  getDictTypeList,
  addDictType,
  getDictTypeDetail,
  editDictType,
  deleteDictType,
  exportDictType,
  refreshDictCache,
};

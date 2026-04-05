import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取字典类型列表
 */
export async function getDictTypeList(params?: Recordable<any>) {
  const res = await requestClient.get('/dict/type/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取字典类型详情
 */
export function getDictTypeById(dictId: number) {
  return requestClient.get(`/api/dict/type/${dictId}`);
}

/**
 * 新增字典类型
 */
export function addDictType(data: any) {
  return requestClient.post('/dict/type', data);
}

/**
 * 修改字典类型
 */
export function updateDictType(data: any) {
  return requestClient.put('/dict/type', data);
}
export const editDictType = updateDictType;

/**
 * 修改字典类型状态
 */
export function changeDictTypeStatus(data: any) {
  return requestClient.put('/dict/type/changeStatus', data);
}

/**
 * 删除字典类型
 */
export function deleteDictType(dictId: number) {
  return requestClient.delete(`/api/dict/type/${dictId}`);
}

/**
 * 导出字典类型
 */
export function exportDictType(params?: Recordable<any>) {
  return requestClient.download('/dict/type/export', params);
}

/**
 * 导入字典类型
 */
export function importDictType(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/dict/type/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 下载字典类型导入模板
 */
export function downloadDictTypeTemplate() {
  return requestClient.download('/dict/type/importTemplate');
}

/**
 * 获取字典数据列表
 */
export async function getDictDataList(params?: Recordable<any>) {
  const res = await requestClient.get('/dict/data/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 根据字典类型获取字典数据
 */
export function getDictDataByType(dictType: string) {
  return requestClient.get(`/api/dict/data/type/${dictType}`);
}

/**
 * 获取字典数据详情
 */
export function getDictDataById(dictCode: number) {
  return requestClient.get(`/api/dict/data/${dictCode}`);
}

/**
 * 新增字典数据
 */
export function addDictData(data: any) {
  return requestClient.post('/dict/data', data);
}

/**
 * 修改字典数据
 */
export function updateDictData(data: any) {
  return requestClient.put('/dict/data', data);
}
export const editDictData = updateDictData;

/**
 * 修改字典数据状态
 */
export function changeDictDataStatus(data: any) {
  return requestClient.put('/dict/data/changeStatus', data);
}

/**
 * 删除字典数据
 */
export function deleteDictData(dictCode: number) {
  return requestClient.delete(`/api/dict/data/${dictCode}`);
}

/**
 * 导出字典数据
 */
export function exportDictData(params?: Recordable<any>) {
  return requestClient.download('/dict/data/export', params);
}

/**
 * 刷新字典缓存
 */
export function refreshDictCache() {
  return requestClient.delete('/dict/type/refreshCache');
}

/**
 * 清除字典缓存
 */
export function clearDictCache() {
  return requestClient.delete('/dict/type/clearCache');
}

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取枚举定义列表
 */
export async function getEnumDefineList(params?: Recordable<any>) {
  const res = await requestClient.get('/enum/define/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取枚举定义详情
 */
export function getEnumDefineById(id: number) {
  return requestClient.get(`/api/enum/define/${id}`);
}

/**
 * 新增枚举定义
 */
export function addEnumDefine(data: any) {
  return requestClient.post('/enum/define', data);
}

/**
 * 修改枚举定义
 */
export function updateEnumDefine(data: any) {
  return requestClient.put('/enum/define', data);
}
export const editEnumDefine = updateEnumDefine;

/**
 * 删除枚举定义
 */
export function deleteEnumDefine(id: string | number) {
  return requestClient.delete(`/api/enum/define/${id}`);
}

/**
 * 导出枚举定义
 */
export function exportEnumDefine(params?: Recordable<any>) {
  return requestClient.download('/enum/define/export', params);
}

/**
 * 导入枚举定义
 */
export function importEnumDefine(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/enum/define/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 下载枚举定义导入模板
 */
export function downloadEnumDefineTemplate() {
  return requestClient.download('/enum/define/importTemplate');
}

/**
 * 获取枚举项列表
 */
export async function getEnumItemList(params?: Recordable<any>) {
  const res = await requestClient.get('/enum/item/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 根据枚举类型获取枚举项
 */
export function getEnumItemsByType(enumType: string) {
  return requestClient.get(`/api/enum/item/type/${enumType}`);
}

/**
 * 获取枚举项详情
 */
export function getEnumItemById(id: number) {
  return requestClient.get(`/api/enum/item/${id}`);
}

/**
 * 新增枚举项
 */
export function addEnumItem(data: any) {
  return requestClient.post('/enum/item', data);
}

/**
 * 修改枚举项
 */
export function updateEnumItem(data: any) {
  return requestClient.put('/enum/item', data);
}
export const editEnumItem = updateEnumItem;

/**
 * 修改枚举项状态
 */
export function changeEnumItemStatus(data: any) {
  return requestClient.put('/enum/item/changeStatus', data);
}

/**
 * 删除枚举项
 */
export function deleteEnumItem(id: string | number) {
  return requestClient.delete(`/api/enum/item/${id}`);
}

/**
 * 导出枚举项
 */
export function exportEnumItem(params?: Recordable<any>) {
  return requestClient.download('/enum/item/export', params);
}

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取流水号规则列表
 */
export async function getSerialRuleList(params?: Recordable<any>) {
  const res = await requestClient.get('/serial/rule/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || res?.list || [],
  };
}
export const getSerialNumberList = getSerialRuleList;

/**
 * 获取流水号规则详情
 */
export function getSerialRuleById(id: number) {
  return requestClient.get(`/api/serial/rule/${id}`);
}
export const getSerialNumberById = getSerialRuleById;

/**
 * 新增流水号规则
 */
export function addSerialRule(data: any) {
  return requestClient.post('/serial/rule', data);
}
export const addSerialNumber = addSerialRule;

/**
 * 修改流水号规则
 */
export function updateSerialRule(data: any) {
  return requestClient.put('/serial/rule', data);
}
export const editSerialNumber = updateSerialRule;

/**
 * 删除流水号规则
 */
export function deleteSerialRule(ids: string) {
  return requestClient.delete(`/api/serial/rule/${ids}`);
}
export const deleteSerialNumber = deleteSerialRule;

/**
 * 导出流水号规则
 */
export function exportSerialRule(params?: Recordable<any>) {
  return requestClient.download('/serial/rule/export', params);
}
export const exportSerialNumber = exportSerialRule;

/**
 * 获取下一流水号
 */
export function getNextSerialNumber(ruleCode: string) {
  return requestClient.get(`/api/serial/rule/next/${ruleCode}`);
}
export const generateSerialNumber = getNextSerialNumber;

/**
 * 批量生成流水号
 */
export function batchGenerateSerialNumber(data: { ruleCode: string; count: number }) {
  return requestClient.post('/serial/rule/batch', data);
}

/**
 * 预览流水号
 */
export function previewSerialNumber(data: any) {
  return requestClient.post('/serial/rule/preview', data);
}

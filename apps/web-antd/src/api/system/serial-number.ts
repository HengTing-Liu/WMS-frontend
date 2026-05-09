import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

const SERIAL_BASE = '/api/serial';

/**
 * 获取流水号规则列表
 */
export async function getSerialRuleList(params?: Recordable<any>) {
  const res = await requestClient.get(`${SERIAL_BASE}/rule/list`, { params });
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
  return requestClient.get(`${SERIAL_BASE}/rule/${id}`);
}
export const getSerialNumberById = getSerialRuleById;

/**
 * 新增流水号规则
 */
export function addSerialRule(data: any) {
  return requestClient.post(`${SERIAL_BASE}/rule/add`, data);
}
export const addSerialNumber = addSerialRule;

/**
 * 修改流水号规则
 */
export function updateSerialRule(data: any) {
  return requestClient.put(`${SERIAL_BASE}/rule/edit`, data);
}
export const editSerialNumber = updateSerialRule;

/**
 * 删除流水号规则
 */
export function deleteSerialRule(ids: string) {
  return requestClient.delete(`${SERIAL_BASE}/rule/${ids}`);
}
export const deleteSerialNumber = deleteSerialRule;

/**
 * 修改流水号规则状态
 */
export function changeSerialRuleStatus(data: { id: number; status: string }) {
  return requestClient.put(`${SERIAL_BASE}/rule/changeStatus`, data);
}

/**
 * 导出流水号规则
 */
export function exportSerialRule(params?: Recordable<any>) {
  return requestClient.download(`${SERIAL_BASE}/rule/export`, {
    method: 'POST',
    data: params ?? {},
  });
}
export const exportSerialNumber = exportSerialRule;

/**
 * 生成流水号
 */
export function generateSerialNumber(
  payloadOrRuleName:
    | {
        businessNo?: string;
        businessType?: string;
        ruleName: string;
      }
    | string,
  businessNo?: string,
  businessType?: string,
) {
  const payload =
    typeof payloadOrRuleName === 'string'
      ? {
          ruleName: payloadOrRuleName,
          businessNo,
          businessType,
        }
      : payloadOrRuleName;
  return requestClient.post(`${SERIAL_BASE}/generate`, payload);
}
export const getNextSerialNumber = generateSerialNumber;

/**
 * 批量生成流水号
 */
export function batchGenerateSerialNumber(
  payloadOrRuleName: { count: number; ruleName: string } | string,
  count?: number,
) {
  const payload =
    typeof payloadOrRuleName === 'string'
      ? { ruleName: payloadOrRuleName, count: count ?? 1 }
      : payloadOrRuleName;
  return requestClient.post(`${SERIAL_BASE}/batchGenerate`, payload);
}

/**
 * 预览流水号（后端无独立 preview 接口，复用 generate）
 */
export function previewSerialNumber(data: any) {
  return generateSerialNumber(data);
}

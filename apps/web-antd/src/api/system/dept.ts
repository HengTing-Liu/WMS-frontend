import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取部门列表
 */
export async function getDeptList(params?: Recordable<any>) {
  const res = await requestClient.get('/system/dept/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取部门树
 */
export function getDeptTree() {
  return requestClient.get('/system/dept/treeselect');
}

/**
 * 获取部门详情
 */
export function getDeptById(deptId: number | string) {
  return requestClient.get(`/api/system/dept/${deptId}`);
}

/**
 * 新增部门
 */
export function addDept(data: any) {
  return requestClient.post('/system/dept', data);
}

/**
 * 修改部门
 */
export function updateDept(data: any) {
  return requestClient.put('/system/dept', data);
}
export const editDept = updateDept;

/**
 * 修改部门状态
 */
export function changeDeptStatus(data: { deptId: number | string; status: string }) {
  return requestClient.put('/system/dept/changeStatus', data);
}

/**
 * 删除部门
 */
export function deleteDept(deptId: number | string) {
  return requestClient.delete(`/api/system/dept/${deptId}`);
}

/**
 * 导出部门
 */
export function exportDept(params?: Recordable<any>) {
  return requestClient.download('/system/dept/export', params);
}

/**
 * 获取排除节点后的部门树
 */
export function getDeptTreeExcludeChild(deptId: number | string) {
  return requestClient.get(`/api/system/dept/list/exclude/${deptId}`);
}

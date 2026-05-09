import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 二维码明细 API
 */

// 类型定义
export namespace InvQrcodedetailApi {
  export interface QrcodeDetail {
    id?: string | number;
    qrcode?: string;
    [key: string]: any;
  }
}

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/inv/qrcodeDetail/list', { params });
}
export const getQrcodeDetailList = getList;

// 查询详情
export function getQrcodeDetailById(id: string | number) {
  return requestClient.get(`/inv/qrcodeDetail/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/inv/qrcodeDetail', data);
}
export const addQrcodeDetail = add;

// 修改
export function update(data: any) {
  return requestClient.put('/inv/qrcodeDetail', data);
}
export const updateQrcodeDetail = update;

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/inv/qrcodeDetail/${id}`);
}
export const deleteQrcodeDetail = remove;

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/inv/qrcodeDetail/export', params);
}
export const exportQrcodeDetail = exportData;

// 导入
export function importQrcodeDetail(data: FormData) {
  return requestClient.post('/inv/qrcodeDetail/import', data);
}

// 下载模板
export function downloadQrcodeTemplate() {
  return requestClient.download('/inv/qrcodeDetail/template');
}
export const downloadTemplate = downloadQrcodeTemplate;

// 根据二维码查询
export function getByQrcode(qrcode: string) {
  return requestClient.get(`/inv/qrcodeDetail/qrcode/${qrcode}`);
}

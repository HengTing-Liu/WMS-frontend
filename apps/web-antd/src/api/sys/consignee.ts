import type { CrudApi, FieldMeta } from '#/components/crud/types';
import { requestClient } from '#/api/request';

/**
 * 收货人字段元数据
 */
export const consigneeFieldMetas: FieldMeta[] = [
  {
    fieldCode: 'consignee_id',
    fieldName: '收货人ID',
    fieldType: 'number',
    isQuery: false,
    isList: false,
    isForm: false,
  },
  {
    fieldCode: 'consignee_code',
    fieldName: '收货人编码',
    fieldType: 'string',
    required: true,
    maxLength: 50,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'consignee_name',
    fieldName: '收货人名称',
    fieldType: 'string',
    required: true,
    maxLength: 100,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'contact_name',
    fieldName: '联系人',
    fieldType: 'string',
    maxLength: 50,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'contact_phone',
    fieldName: '联系电话',
    fieldType: 'string',
    maxLength: 20,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'address',
    fieldName: '收货地址',
    fieldType: 'textarea',
    required: true,
    maxLength: 500,
    isQuery: false,
    isList: true,
    isForm: true,
  },
  {
    fieldCode: 'company',
    fieldName: '所属公司',
    fieldType: 'string',
    maxLength: 100,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'eq',
  },
  {
    fieldCode: 'is_enabled',
    fieldName: '是否启用',
    fieldType: 'boolean',
    required: true,
    isQuery: false,
    isList: true,
    isForm: true,
    defaultValue: 1,
  },
  {
    fieldCode: 'remark',
    fieldName: '备注',
    fieldType: 'textarea',
    maxLength: 500,
    isQuery: false,
    isList: false,
    isForm: true,
  },
  {
    fieldCode: 'create_by',
    fieldName: '创建人',
    fieldType: 'string',
    isQuery: false,
    isList: true,
    isForm: false,
  },
  {
    fieldCode: 'create_time',
    fieldName: '创建时间',
    fieldType: 'datetime',
    isQuery: false,
    isList: true,
    isForm: false,
  },
  {
    fieldCode: 'update_by',
    fieldName: '更新人',
    fieldType: 'string',
    isQuery: false,
    isList: true,
    isForm: false,
  },
  {
    fieldCode: 'update_time',
    fieldName: '更新时间',
    fieldType: 'datetime',
    isQuery: false,
    isList: true,
    isForm: false,
  },
];

/**
 * 收货人CRUD API
 * 接口规范: /crud/{tableCode}
 */
export const consigneeApi: CrudApi = {
  // 分页查询 - POST /crud/sys_consignee/list
  page: async (params: any) => {
    const res = await requestClient.post('/crud/sys_consignee/list', params);
    return {
      rows: res.rows || res.list || [],
      total: res.total || 0,
    };
  },

  // 获取详情 - GET /crud/sys_consignee/{id}
  get: async (id: number) => {
    const res = await requestClient.get(`/crud/sys_consignee/${id}`);
    return res;
  },

  // 新增 - POST /crud/sys_consignee
  add: async (data: any) => {
    const res = await requestClient.post('/crud/sys_consignee', data);
    return res;
  },

  // 编辑 - PUT /crud/sys_consignee/{id}
  edit: async (data: any) => {
    const id = data.consignee_id;
    const res = await requestClient.put(`/crud/sys_consignee/${id}`, data);
    return res;
  },

  // 删除 - DELETE /crud/sys_consignee/{id}
  delete: async (id: number) => {
    const res = await requestClient.delete(`/crud/sys_consignee/${id}`);
    return res;
  },

  // 批量删除
  batchDelete: async (ids: number[]) => {
    // 批量删除通过循环调用单条删除
    const promises = ids.map(id => requestClient.delete(`/crud/sys_consignee/${id}`));
    await Promise.all(promises);
    return { success: true };
  },

  // 导出
  export: async (params: any) => {
    const res = await requestClient.post('/crud/sys_consignee/export', params, {
      responseType: 'blob',
    });
    return res;
  },
};

/**
 * 收货人页面配置
 */
export const consigneePageConfig = {
  tableCode: 'sys_consignee',
  tableName: '收货人管理',
  queryFields: ['consignee_code', 'consignee_name', 'contact_name', 'contact_phone', 'company'],
  tableFields: ['consignee_code', 'consignee_name', 'contact_name', 'contact_phone', 'address', 'company', 'is_enabled', 'create_time'],
  formFields: ['consignee_code', 'consignee_name', 'contact_name', 'contact_phone', 'address', 'company', 'is_enabled', 'remark'],
  fieldMetas: consigneeFieldMetas,
  primaryKey: 'consignee_id',
  permPrefix: 'sys:consignee',
};

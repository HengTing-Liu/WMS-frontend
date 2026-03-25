import type { CrudApi, FieldMeta } from '#/components/crud/types';
import { requestClient } from '#/api/request';

/**
 * 用户数据类型
 */
export interface SysUserResult {
  user_id: number;
  dept_id?: number;
  user_name: string;
  nick_name: string;
  user_type?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
  status?: string;
  default_page?: string; // 默认首页
  login_ip?: string;
  login_date?: string;
  pwd_update_date?: string;
  create_by?: string;
  create_time?: string;
  update_by?: string;
  update_time?: string;
  remark?: string;
}

/**
 * 用户字段元数据
 */
export const sysUserFieldMetas: FieldMeta[] = [
  {
    fieldCode: 'user_id',
    fieldName: '用户ID',
    fieldType: 'number',
    isQuery: false,
    isList: false,
    isForm: false,
  },
  {
    fieldCode: 'user_name',
    fieldName: '用户账号',
    fieldType: 'string',
    required: true,
    maxLength: 30,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'nick_name',
    fieldName: '用户昵称',
    fieldType: 'string',
    required: true,
    maxLength: 30,
    isQuery: false,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'dept_id',
    fieldName: '部门ID',
    fieldType: 'number',
    isQuery: false,
    isList: false,
    isForm: false,
  },
  {
    fieldCode: 'email',
    fieldName: '用户邮箱',
    fieldType: 'string',
    maxLength: 50,
    isQuery: false,
    isList: false,
    isForm: true,
  },
  {
    fieldCode: 'phonenumber',
    fieldName: '手机号码',
    fieldType: 'string',
    maxLength: 11,
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'like',
  },
  {
    fieldCode: 'sex',
    fieldName: '用户性别',
    fieldType: 'select',
    isQuery: false,
    isList: true,
    isForm: true,
    options: [
      { label: '男', value: '0' },
      { label: '女', value: '1' },
      { label: '未知', value: '2' },
    ],
  },
  {
    fieldCode: 'status',
    fieldName: '账号状态',
    fieldType: 'select',
    isQuery: true,
    isList: true,
    isForm: true,
    queryType: 'eq',
    options: [
      { label: '正常', value: '0' },
      { label: '停用', value: '1' },
    ],
  },
  {
    fieldCode: 'avatar',
    fieldName: '头像地址',
    fieldType: 'string',
    isQuery: false,
    isList: false,
    isForm: false,
  },
  {
    fieldCode: 'default_page',
    fieldName: '默认首页',
    fieldType: 'string',
    maxLength: 200,
    isQuery: false,
    isList: false,
    isForm: true,
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
    fieldName: '创建者',
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
    fieldName: '更新者',
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
 * 用户CRUD API
 * 接口规范: /crud/{tableCode}
 */
export const sysUserApi: CrudApi<SysUserResult> = {
  // 分页查询 - POST /crud/sys_user/list
  page: async (params: any) => {
    const res = await requestClient.get('/crud/sys_user/list', { params });
    return {
      rows: res.rows || res.list || [],
      total: res.total || 0,
    };
  },

  // 获取详情 - GET /crud/sys_user/{id}
  get: async (id: number) => {
    const res = await requestClient.get(`/crud/sys_user/${id}`);
    return res;
  },

  // 新增 - POST /crud/sys_user
  add: async (data: any) => {
    const res = await requestClient.post('/crud/sys_user', data);
    return res;
  },

  // 编辑 - PUT /crud/sys_user/{id}
  edit: async (data: any) => {
    const id = data.user_id;
    const res = await requestClient.put(`/crud/sys_user/${id}`, data);
    return res;
  },

  // 删除 - DELETE /crud/sys_user/{id}
  delete: async (id: number) => {
    const res = await requestClient.delete(`/crud/sys_user/${id}`);
    return res;
  },

  // 批量删除
  batchDelete: async (ids: number[]) => {
    // 批量删除通过循环调用单条删除
    const promises = ids.map(id => requestClient.delete(`/crud/sys_user/${id}`));
    await Promise.all(promises);
    return { success: true };
  },

  // 导出
  export: async (params: any) => {
    const res = await requestClient.post('/crud/sys_user/export', params, {
      responseType: 'blob',
    });
    return res;
  },
};

/**
 * 用户页面配置
 */
export const sysUserPageConfig = {
  tableCode: 'sys_user',
  tableName: '用户管理',
  queryFields: ['user_name', 'phonenumber', 'status'],
  tableFields: ['user_name', 'nick_name', 'phonenumber', 'sex', 'status', 'create_by', 'create_time'],
  formFields: ['user_name', 'nick_name', 'email', 'phonenumber', 'sex', 'status', 'default_page', 'remark'],
  fieldMetas: sysUserFieldMetas,
  primaryKey: 'user_id',
  permPrefix: 'sys:user',
};

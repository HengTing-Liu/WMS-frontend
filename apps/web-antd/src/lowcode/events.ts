/**
 * Lowcode 工具栏按钮事件处理器
 *
 * 支持的事件类型：
 * - builtin: 内置动作（create/edit/delete/toggle/export）
 * - api: REST API 调用
 * - download: 文件下载
 * - redirect: 页面跳转
 *
 * 使用方式：
 * 在 sys_table_operation 表中配置 event_type 和 event_config
 */

import { message, Modal } from 'ant-design-vue';
import { useAccess } from '@vben/access';
import { downloadBlob } from '#/utils/download';
import type { LowcodeAction, ApiEventConfig, DownloadEventConfig, UploadEventConfig, RedirectEventConfig } from './types';
import { expandAllPermissionCodes } from './permission-utils';

export interface ActionContext {
  crudPrefix?: string;
  tableCode: string;
  searchForm: Record<string, any>;
  /** 与列表查询一致：各搜索字段 eq / like，用于组装 queryModes */
  searchQueryModes?: Record<string, 'eq' | 'like'>;
  selectedRowKeys: any[];
  pagination: {
    current: number;
    pageSize: number;
  };
  handleCreate: () => void;
  handleEdit: (record: any) => void;
  handleRead: (record: any) => void;
  handleDelete: (id: number | string) => Promise<void>;
  handleToggle: (record: any, enabled: boolean) => Promise<void>;
  handleExport: () => Promise<void>;
  reload: () => void;
}

/** 内置动作处理器映射 */
export const BUILTIN_HANDLERS: Record<string, (ctx: ActionContext, record?: any) => void> = {
  create: (ctx) => ctx.handleCreate(),
  /** 与 create 同义，兼容 operation_code = add */
  add: (ctx) => ctx.handleCreate(),
  edit: (ctx, record) => ctx.handleEdit(record),
  /** 与 edit 同义，兼容 operation_code = row_edit */
  row_edit: (ctx, record) => ctx.handleEdit(record),
  read: (ctx, record) => ctx.handleRead(record),
  /** 与 read 同义，兼容 operation_code = row_read */
  row_read: (ctx, record) => ctx.handleRead(record),
  delete: (ctx, record) => ctx.handleDelete(record?.id ?? record?.dictId ?? record?.dictCode),
  /** 与 delete 同义，兼容 operation_code = row_delete */
  row_delete: (ctx, record) => ctx.handleDelete(record?.id ?? record?.dictId ?? record?.dictCode),
  toggle: (ctx, record) => ctx.handleToggle(record, !((record?.isEnabled ?? record?.is_enabled) === 1 || (record?.isEnabled ?? record?.is_enabled) === true)),
  export: (ctx) => ctx.handleExport(),
};

/** 判断是否为导出动作 */
export function isExportAction(key: string): boolean {
  if (!key) return false;
  const exportKeys = ['export', 'exportData', 'exportExcel', 'export_data', '导出', 'excel'];
  return exportKeys.includes(key.toLowerCase());
}

/** 解析事件配置 JSON */
export function parseEventConfig(config?: string | object): any {
  // 调试信息
  if (import.meta.env.DEV) {
    console.log('[parseEventConfig] input:', config, 'type:', typeof config);
  }

  if (!config) return {};

  // 如果已经是 object，直接返回
  if (typeof config === 'object') {
    return config;
  }

  // 如果是 string，尝试解析
  if (typeof config === 'string') {
    try {
      const parsed = JSON.parse(config);
      // 处理双编码情况（如果解析后还是字符串，再解析一次）
      if (typeof parsed === 'string') {
        try {
          return JSON.parse(parsed);
        } catch {
          return {};
        }
      }
      return parsed;
    } catch {
      console.warn('Failed to parse event_config:', config);
      return {};
    }
  }

  return {};
}

/** 执行内置动作 */
export function executeBuiltinHandler(
  action: LowcodeAction,
  ctx: ActionContext,
  record?: any,
): void {
  const config = parseEventConfig(action.eventConfig);
  const handlerName = config.handler || action.key;
  const handler = BUILTIN_HANDLERS[handlerName];

  if (handler) {
    handler(ctx, record);
  } else {
    console.warn(`Unknown builtin handler: ${handlerName}`);
    message.warning(`未知动作: ${handlerName}`);
  }
}

/** 执行 API 调用 */
export async function executeApiAction(
  action: LowcodeAction,
  ctx: ActionContext,
): Promise<boolean> {
  const config: ApiEventConfig = parseEventConfig(action.eventConfig);
  const { hasAccessByCodes } = useAccess();

  // 权限校验（与 LowcodePage 展示逻辑一致，含别名）
  const permCodes = expandAllPermissionCodes(action.permission);
  if (permCodes.length && !permCodes.some((c) => hasAccessByCodes([c]))) {
    message.error('您没有执行此操作的权限');
    return false;
  }

  // 构建 URL
  let url = config.url;
  // 替换路径参数（如 {id}）
  if (ctx.selectedRowKeys.length === 1 && url.includes('{id}')) {
    url = url.replace('{id}', ctx.selectedRowKeys[0]);
  }

  // 构建请求参数
  const payload = buildPayload(config.payloadType, ctx);

  try {
    const response = await fetch(url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: config.method === 'GET' ? undefined : JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      message.success(config.successMessage || action.confirmMessage || '操作成功');
      ctx.reload();
      return true;
    } else {
      message.error(config.failMessage || result.message || '操作失败');
      return false;
    }
  } catch (error: any) {
    console.error('API call failed:', error);
    message.error(config.failMessage || error.message || '请求失败');
    return false;
  }
}

/** 执行文件下载 */
export async function executeDownloadAction(
  action: LowcodeAction,
  ctx: ActionContext,
): Promise<boolean> {
  const config: DownloadEventConfig = parseEventConfig(action.eventConfig);
  const { hasAccessByCodes } = useAccess();

  const permCodes = expandAllPermissionCodes(action.permission);
  if (permCodes.length && !permCodes.some((c) => hasAccessByCodes([c]))) {
    message.error('您没有执行此操作的权限');
    return false;
  }

  // 检查勾选数据
  if (config.payloadType === 'selected' && !ctx.selectedRowKeys.length) {
    message.warning('请先勾选要操作的数据');
    return false;
  }

  // 构建请求参数
  const payload = buildPayload(config.payloadType, ctx);

  // 构建 URL：优先使用配置 URL，否则使用通用导出接口
  let url = config.url;
  if (!url) {
    // 优先使用 crudPrefix + /export
    if (ctx.crudPrefix) {
      url = `${ctx.crudPrefix}/export`;
    } else if (ctx.tableCode) {
      // 使用通用 CRUD 导出接口
      url = `/api/wms/crud/${ctx.tableCode}/export`;
    } else {
      message.error('导出接口未配置');
      return false;
    }
  }

  // 驼峰转蛇形（处理字段名映射）
  const snakePayload = buildSnakePayload(payload);

  const fileName = config.fileName || `${action.label || '导出'}_${new Date().getTime()}.xlsx`;

  try {
    // 与 LowcodeCrudController @GetMapping("/{tableCode}/export") 一致；未配置时默认 GET
    await downloadBlob(url, snakePayload, {
      method: config.method || 'GET',
      fileName,
    });
    message.success('导出成功');
    return true;
  } catch (error: any) {
    console.error('Download failed:', error);
    message.error('导出失败: ' + error.message);
    return false;
  }
}

/** 驼峰转蛇形 */
/** 执行文件上传（导入） */
export async function executeUploadAction(
  action: LowcodeAction,
  ctx: ActionContext,
): Promise<boolean> {
  const config: UploadEventConfig = parseEventConfig(action.eventConfig);
  const { hasAccessByCodes } = useAccess();

  const permCodes = expandAllPermissionCodes(action.permission);
  if (permCodes.length && !permCodes.some((c) => hasAccessByCodes([c]))) {
    message.error('您没有执行此操作的权限');
    return false;
  }

  const url = config.url || (ctx.crudPrefix ? `${ctx.crudPrefix}/importData` : '');
  if (!url) {
    message.error('上传接口未配置');
    return false;
  }

  const accept = config.accept || '.xlsx,.xls';
  const fileField = config.fileField || 'file';

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(false);
        return;
      }

      const formData = new FormData();
      formData.append(fileField, file);
      if (config.updateSupport !== undefined) {
        formData.append('updateSupport', String(config.updateSupport));
      }
      if (config.extraParams) {
        for (const [key, value] of Object.entries(config.extraParams)) {
          formData.append(key, String(value));
        }
      }

      try {
        const requestOptions: RequestInit = {
          method: config.method || 'POST',
          headers: {},
          body: formData,
        };

        const token = localStorage.getItem('accessToken') || localStorage.getItem('oms_token');
        if (token) {
          (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
        const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('oms_tenant_id');
        if (tenantId) {
          (requestOptions.headers as Record<string, string>)['X-Tenant-Id'] = tenantId;
        }

        const response = await fetch(url, requestOptions);
        const result = await response.json().catch(() => ({}));

        if (response.ok && (result.code === 0 || result.code === 200)) {
          message.success(config.successMessage || result.data || '导入成功');
          ctx.reload();
          resolve(true);
        } else {
          message.error(config.failMessage || result.message || `导入失败: ${response.status}`);
          resolve(false);
        }
      } catch (error: any) {
        console.error('Upload failed:', error);
        message.error(config.failMessage || error.message || '上传失败');
        resolve(false);
      }
    };
    input.click();
  });
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** 与 CrudServiceImpl / PageHelper 约定的参数名一致，禁止转成 snake_case */
const EXPORT_RESERVED_KEYS = new Set([
  'queryModes',
  'pageNum',
  'pageSize',
  'orderByColumn',
  'isAsc',
  'ids',
]);

/** 构建蛇形字段名的请求参数 */
function buildSnakePayload(payload: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue;
    const outKey = EXPORT_RESERVED_KEYS.has(key) ? key : camelToSnake(key);
    result[outKey] = value;
  }
  return result;
}

/** 执行页面跳转 */
export function executeRedirectAction(
  action: LowcodeAction,
  ctx: ActionContext,
): void {
  const config: RedirectEventConfig = parseEventConfig(action.eventConfig);
  const router = (window as any).__VITE_ROUTER__; // 需要注入 router

  if (!router) {
    console.warn('Router not available');
    return;
  }

  const query = buildQueryParams(config.query, ctx);
  router.push({ path: config.path, query });
}

/** 构建查询参数 */
function buildQueryParams(
  query: Record<string, string> | undefined,
  ctx: ActionContext,
): Record<string, string> {
  if (!query) return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value.startsWith('${') && value.endsWith('}')) {
      const field = value.slice(2, -1);
      if (field === 'selectedId' && ctx.selectedRowKeys.length === 1) {
        result[key] = ctx.selectedRowKeys[0];
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** 与 LowcodePage#buildExportParams 对齐：搜索字段转 snake_case + queryModes JSON */
function buildExportLikePayload(ctx: ActionContext, options: { all?: boolean }): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(ctx.searchForm || {})) {
    if (key === '__queryModes') continue;
    if (value !== undefined && value !== null && value !== '') {
      result[camelToSnake(key)] = value;
    }
  }
  const modes = ctx.searchQueryModes || {};
  const queryModes: Record<string, 'eq' | 'like'> = {};
  for (const [key, mode] of Object.entries(modes)) {
    const snakeKey = camelToSnake(key);
    if (result[snakeKey] === undefined) continue;
    queryModes[snakeKey] = mode === 'eq' ? 'eq' : 'like';
  }
  result.queryModes = JSON.stringify(queryModes);
  if (options.all) {
    result.pageSize = 999999;
  }
  return result;
}

/** 根据 payloadType 构建请求参数 */
function buildPayload(
  payloadType: string | undefined,
  ctx: ActionContext,
): Record<string, any> {
  const payload: Record<string, any> = {};

  switch (payloadType) {
    case 'none':
      // 不传递任何数据
      break;

    case 'selected':
      // 勾选行 + 当前筛选条件（与列表逻辑一致）；后端先按条件查再在内存按 ids 过滤
      Object.assign(payload, buildExportLikePayload(ctx, {}));
      payload.ids = ctx.selectedRowKeys;
      break;

    case 'currentPage': {
      Object.assign(payload, buildExportLikePayload(ctx, {}));
      payload.pageNum = ctx.pagination.current;
      payload.pageSize = ctx.pagination.pageSize;
      break;
    }

    case 'filtered':
    case 'all':
    default:
      Object.assign(payload, buildExportLikePayload(ctx, { all: payloadType === 'all' }));
      break;
  }

  return payload;
}

/** 显示确认对话框 */
export async function showConfirm(action: LowcodeAction): Promise<boolean> {
  // 调试信息
  if (import.meta.env.DEV) {
    console.log('[Confirm] action.confirmMessage:', action.confirmMessage);
  }

  if (!action.confirmMessage) return true;

  // 替换动态参数
  let confirmContent = action.confirmMessage;
  const count = action.position === 'toolbar' ? 0 : 1; // toolbar 时无法确定数量

  confirmContent = confirmContent.replace('{count}', String(count));

  return new Promise((resolve) => {
    Modal.confirm({
      title: '确认操作',
      content: confirmContent,
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

/** 统一事件分发入口 */
export async function handleAction(
  action: LowcodeAction,
  ctx: ActionContext,
  record?: any,
): Promise<boolean> {
  // 调试信息
  if (import.meta.env.DEV) {
    console.log('[handleAction] eventType:', action.eventType);
    console.log('[handleAction] action:', action);
  }

  // 1. 确认提示
  const confirmed = await showConfirm(action);
  if (!confirmed) return false;

  // 2. 根据 eventType 分发
  const eventType = action.eventType || 'builtin';

  switch (eventType) {
    case 'builtin':
      executeBuiltinHandler(action, ctx, record);
      return true;

    case 'api':
      return executeApiAction(action, ctx);

    case 'download':
      return executeDownloadAction(action, ctx);

    case 'upload':
      return executeUploadAction(action, ctx);

    case 'redirect':
      executeRedirectAction(action, ctx);
      return true;

    default:
      console.warn(`Unknown eventType: ${eventType}`);
      message.warning(`不支持的事件类型: ${eventType}`);
      return false;
  }
}

import { requestClient } from '#/api/request';

// 测试表单字段类型（完全按照后端返回结构）
export namespace TestingApi {
  export interface FieldOption {
    label: string;
    value: any;
  }

  export interface FieldItem {
    /** 组件类型，目前后端只返回 Input / Select */
    component: 'Input' | 'Select';
    /** 字段名，例如 name / age / sex */
    field: string;
    /** 默认值，可选 */
    defaultValue?: any;
    /** 是否禁用 */
    disabled?: boolean;
    /** 界面显示的标签 */
    label: string;
    /** 下拉选项（只有 Select 才有） */
    options?: FieldOption[];
  }

  export interface ListResponse {
    code: number;
    msg: string | null;
    data: FieldItem[];
  }
}

/**
 * 获取测试表单字段配置
 * GET /api/test/list
 * 真实返回：{ code, msg, data: FieldItem[] }
 */
async function getTestFieldList() {
  // 保留最外层结构，方便调用方直接拿到 code/msg/data
  return requestClient.get<TestingApi.ListResponse>('/api/test/list', {
    responseReturn: 'body',
  });
}

export { getTestFieldList };


import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductCategoryApi {
  export interface ProductItem {
    id: string | number;
    catalogNo: string;
    productName: string;
    brand: string;
    productStatus: string;
    sellStatus?: string;
    createTime?: string;
    modifier?: string;
    modifyTime?: string;
    [key: string]: any;
  }

  export interface ListResult {
    total: number;
    rows: ProductItem[];
  }

  /** 品牌 / 品牌状态选项 */
  export interface BrandStatusOption {
    label: string;
    value: string | number;
  }
}

/** 分页查询产品分类列表 */
async function getProductCategoryList(params?: Recordable<any>) {
  return requestClient.get<ProductCategoryApi.ListResult>(
    '/api/test/list',
    { params },
  );
}

/** 新增产品 */
async function addProductCategory(data: Recordable<any>) {
  return requestClient.post('/api/productCategory/add', data, {
    responseReturn: 'body',
  });
}

/** 修改产品 */
async function updateProductCategory(data: Recordable<any>) {
  return requestClient.put('/api/productCategory/edit', data, {
    responseReturn: 'body',
  });
}

/** 删除产品（单个或批量，ids 逗号分隔） */
async function deleteProductCategory(ids: string | number) {
  return requestClient.delete(`/api/productCategory/${ids}`, {
    responseReturn: 'body',
  });
}

/** 获取单条产品详情（编辑回显） */
async function getProductCategoryDetail(id: string | number) {
  return requestClient.get<Recordable<any>>(`/api/productCategory/${id}`);
}

/**
 * 获取表单配置：后端返回需要渲染在界面上的数据（四个区块的 schema）
 * 请求会通过代理转发到 http://192.168.110.74:8080/api/test/getFormSchema
 */
export interface FormSchemaResponse {
  basicSchema?: Recordable<any>[];
  categorySchema?: Recordable<any>[];
  applicationSchema?: Recordable<any>[];
  otherSchema?: Recordable<any>[];
  /** 或使用 sections 格式 */
  sections?: Array<{ key: string; title?: string; schema: Recordable<any>[] }>;
  /** 可选：语言选项 */
  languageOptions?: { label: string; value: string }[];
  /** 可选：前端联动规则配置 */
  linkageRules?: Recordable<any>[];
  /** 可选：异步联动的全局配置 */
  asyncLinkageConfig?: {
    defaultParams?: Recordable<any>;
    errorMsg?: string;
  };
}

async function getFormSchema(id?: string | number) {
  return requestClient.get<FormSchemaResponse>('/api/test/getFormSchema', {
    params: id != null ? { id } : undefined,
  });
}

/**
 * 本地联调：向 /api/test/add 传入四个区块的 schema（JSON）
 * 请求会通过代理转发到 http://192.168.110.74:8080/api/test/add
 */
export interface TestAddPayload {
  basicSchema: Recordable<any>[];
  categorySchema: Recordable<any>[];
  applicationSchema: Recordable<any>[];
  otherSchema: Recordable<any>[];
}

async function submitTestAdd(payload: TestAddPayload) {
  return requestClient.post('/api/test/add', payload, {
    responseReturn: 'body',
  });
}

/** 品牌 & 其他枚举选项（级联用） */
async function getBrandStatus(params?: Recordable<any>) {
  return requestClient.get<ProductCategoryApi.BrandStatusOption[]>('/api/test/brandStatus', {
    params,
  });
}

export {
  getProductCategoryList,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory,
  getProductCategoryDetail,
  getFormSchema,
  submitTestAdd,
   getBrandStatus,
};

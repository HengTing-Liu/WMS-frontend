import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductCatalogFormApi {
  export interface LanguageItem {
    code: string;
    name: string;
  }

  export interface OptionItem {
    value: string | number;
    label: string;
  }

  export interface FieldColumn {
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    isRequired?: boolean;
    maxLength?: number | null;
    defaultValue?: any;
    apiUrl?: string | null;
    options?: OptionItem[] | null;
  }

  export interface FieldItem {
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    isRequired?: boolean;
    isMultilang?: boolean;
    maxLength?: number | null;
    sortNum?: number;
    defaultValue?: any;
    options?: OptionItem[] | null;
    columns?: FieldColumn[] | null;
    apiUrl?: string | null;
  }

  export interface FormSection {
    fields: FieldItem[];
  }

  export interface FormDefinition {
    languageList: LanguageItem[];
    basicInfo?: FormSection;
    classificationInfo?: FormSection;
    applicationInfo?: FormSection;
    otherInfo?: FormSection;
  }
}

/** 产品目录：表单定义 */
export async function getProductCatalogFormDefinition(params: Recordable<any>) {
  return requestClient.post<ProductCatalogFormApi.FormDefinition>(
    '/api/product/catalog/formDefinition',
    params,
  );
}

/** 产品目录：分页列表 */
export async function getProductCatalogList(params?: Recordable<any>) {
  return requestClient.get('/api/product/catalog/list', {
    params,
  });
}

/** 产品目录：详情（编辑回显 / 详情，与 formDefinition 结构一致，含 defaultValue） */
export async function getProductCatalogDetail(
  id: string | number,
  params?: Recordable<any>,
) {
  return requestClient.get<ProductCatalogFormApi.FormDefinition>(
    `/api/product/catalog/detail/${id}`,
    { params },
  );
}

/** 产品目录：新增 */
export async function saveProductCatalog(payload: Recordable<any>) {
  return requestClient.post('/api/product/catalog/add', payload, {
    responseReturn: 'body',
  });
}

/** 产品目录：修改（须带 id） */
export async function updateProductCatalog(payload: Recordable<any>) {
  return requestClient.post('/api/product/catalog/update', payload, {
    responseReturn: 'body',
  });
}


import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductCategoryTreeApi {
  export interface TreeNode {
    id: number;
    categoryNameCn: string;
    categoryNameEn: string;
    categoryCode: string;
    categoryType: string;
    parentId: number;
    version: string;
    isDeleted: string | null;
    children?: TreeNode[];
  }
}

/** 获取产品分类树 */
async function getProductCategoryTree(params?: Recordable<any>) {
  return requestClient.get<ProductCategoryTreeApi.TreeNode[]>(
    '/api/product/category/tree',
    { params },
  );
}

export { getProductCategoryTree };


<template>
  <div class="product-category-page">
    <Row :gutter="16" align="stretch">
      <Col :span="6">
        <Page auto-content-height>
          <CategoryTree
            v-if="treeData.length"
            :tree-data="treeData"
            search-placeholder="请输入分类名称"
            :sync-highlight="true"
            :highlight-node-id="currentNode?.id ?? null"
            @select="handleTreeSelect"
          />
        </Page>
      </Col>
      <Col :span="18">
        <Page auto-content-height>
          <Grid>
            <template #toolbar-tools>
              <Button class="btn-yellow mr-2 flex items-center" @click="handleAdd">
                <IconifyIcon icon="material-symbols:add" class="size-5" />
                新增
              </Button>
            </template>
            <template #action="{ row }">
              <Button type="link" @click="handleEdit(row)">编辑</Button>
              <Button type="link" @click="handleDetail(row)">详情</Button>
            </template>
          </Grid>
        </Page>
      </Col>
    </Row>

    <Drawer
      v-model:open="formDrawerOpen"
      :title="formDrawerTitle"
      placement="right"
      :width="'70%'"
      :destroy-on-close="true"
      :body-style="{ padding: '12px 16px', overflow: 'auto' }"
      root-class-name="product-category-form-drawer"
    >
      <DynamicFormDefinitionPage
        v-if="formDrawerOpen"
        :key="formDrawerKey"
        :fetch-definition="catalogFetchDefinition"
        :params="formDrawerParams"
        :readonly="formDrawerReadonly"
        :on-cancel="closeProductForm"
        :on-save="formDrawerReadonly ? undefined : onProductFormSave"
      />
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Col, Drawer, Row } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { ProductCategoryTreeApi } from '#/api';
import {
  getProductCatalogDetail,
  getProductCatalogFormDefinition,
  getProductCatalogList,
  getProductCategoryTree,
  saveProductCatalog,
  updateProductCatalog,
} from '#/api';
import DynamicFormDefinitionPage from '#/components/DynamicFormDefinitionPage.vue';
import CategoryTree from '../productCategory/modules/categoryTree.vue';
import { buildProductCatalogAddPayload } from '../productCategory/utils/buildProductCatalogPayload';
import { attachCatalogTreeMeta, mapCatalogRowCommon, pickListCategoryCode } from '../productCategory/utils/catalogPageUtils';

type TreeNode = ProductCategoryTreeApi.TreeNode & {
  label?: string;
  level?: number;
  lineage?: Array<{
    level: number;
    categoryCode?: string;
    categoryName?: string;
    categoryNameCn?: string;
  }>;
};
type RowType = any;

/** 与列表接口约定：默认只查分子产品线（与树节点 categoryCode 一致时可被树选中覆盖） */
const MOL_LIST_CATEGORY_DEFAULT = 'SECT_分子';
const MOL_CATEGORY_NAME = '分子';
const TREE_ROOT_CATEGORY_CODE = 'MB';

const treeData = ref<TreeNode[]>([]);
const currentNode = ref<TreeNode | null>(null);

const formDrawerOpen = ref(false);
const formDrawerKey = ref(0);
const formDrawerTitle = ref('新增分子产品信息');
const formDrawerReadonly = ref(false);
/** 与产品目录（抗体等）新增默认语言一致 */
const DEFAULT_ADD_LANG = 'en_us';
const formDrawerParams = ref<Record<string, any>>({
  lang: DEFAULT_ADD_LANG,
  categoryName: MOL_CATEGORY_NAME,
});

function mapCatalogRow(raw: any) {
  return mapCatalogRowCommon(raw);
}

function attachLabel(nodes: TreeNode[]) {
  return attachCatalogTreeMeta(nodes) as any;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  for (const n of nodes || []) {
    out.push(n);
    if (n.children?.length) out.push(...flattenTree(n.children as TreeNode[]));
  }
  return out;
}

function findMolCategoryNode(nodes: TreeNode[]): TreeNode | null {
  const flat = flattenTree(nodes);
  const hit = flat.find((n: any) => {
    const cn = n?.categoryNameCn != null ? String(n.categoryNameCn).trim() : '';
    const name = n?.categoryName != null ? String(n.categoryName).trim() : '';
    const label = n?.label != null ? String(n.label).trim() : '';
    return cn === MOL_CATEGORY_NAME || name === MOL_CATEGORY_NAME || label === MOL_CATEGORY_NAME;
  });
  return hit ?? null;
}

async function loadTree(categoryCode?: string) {
  try {
    const code = categoryCode ?? TREE_ROOT_CATEGORY_CODE;
    const res = await getProductCategoryTree(
      code ? { category: code } : undefined,
    );
    const list: TreeNode[] = Array.isArray((res as any)?.data)
      ? (res as any).data
      : Array.isArray(res)
        ? (res as any)
        : [];
    treeData.value = list ? attachLabel(list) : [];
  } catch (e: any) {
    message.error(e?.message ?? '加载产品分类树失败');
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-5',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'catalogNo',
      label: '货号',
      formItemClass: 'col-span-1',
      labelWidth: 70,
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Input',
      fieldName: 'productName',
      label: '产品名',
      formItemClass: 'col-span-1',
      labelWidth: 70,
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Select',
      fieldName: 'visibleStatus',
      label: '可售状态',
      formItemClass: 'col-span-1',
      labelWidth: 90,
      componentProps: {
        allowClear: true,
        options: [
          { label: '可售', value: '1' },
          { label: '不可售', value: '0' },
        ],
        placeholder: '请选择',
      },
    },
    {
      component: 'Select',
      fieldName: 'shelfStatus',
      label: '产品状态',
      formItemClass: 'col-span-1',
      labelWidth: 90,
      componentProps: {
        allowClear: true,
        options: [
          { label: '上架', value: '1' },
          { label: '下架', value: '0' },
        ],
        placeholder: '请选择',
      },
    },
    {
      component: 'Input',
      fieldName: 'brand',
      label: '品牌',
      formItemClass: 'col-span-1',
      labelWidth: 60,
      componentProps: { placeholder: '请输入' },
    },
  ],
};

const gridOptions: VxeTableGridOptions<RowType> = {
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'catalog_no', title: '货号', minWidth: 120 },
    { field: 'name', title: '产品名', minWidth: 220 },
    { field: 'category', title: '产品分类', minWidth: 160 },
    { field: 'cp_status', title: '产品状态', width: 110 },
    { field: 'ks_status', title: '可售状态', width: 110 },
    { field: 'brand', title: '品牌', width: 120 },
    { field: 'createTime', title: '创建时间', width: 160 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: { autoHidden: false },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const code = pickListCategoryCode({
          selectedCode: (currentNode.value as TreeNode | null)?.categoryCode,
          level1Code: (treeData.value?.[0] as any)?.categoryCode,
          fallbackCode: MOL_LIST_CATEGORY_DEFAULT,
        });
        const fv = { ...(formValues ?? {}) } as Record<string, any>;
        const visibleStatus = fv.visibleStatus;
        const shelfStatus = fv.shelfStatus;
        delete fv.visibleStatus;
        delete fv.shelfStatus;
        const res = await getProductCatalogList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...(code ? { category: code } : {}),
          ...fv,
          ...(visibleStatus !== undefined && visibleStatus !== '' && visibleStatus != null
            ? { visibleStatus: visibleStatus }
            : {}),
          ...(shelfStatus !== undefined && shelfStatus !== '' && shelfStatus != null
            ? { shelfStatus: shelfStatus }
            : {}),
        });
        const body = (res as any)?.rows ? (res as any) : (res as any)?.data ?? res;
        const rows = Array.isArray(body?.rows) ? body.rows : [];
        return {
          total: body?.total ?? rows.length ?? 0,
          items: rows.map((row: any) => mapCatalogRow(row)),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
} as any);

async function openProductForm(
  extra: Record<string, any> = {},
  opts?: { readonly?: boolean },
) {
  const readonly = opts?.readonly ?? false;
  const id = extra?.id;
  const hasId = id != null && String(id) !== '';
  const selectedCategoryCode =
    extra?.categoryCode ?? (currentNode.value as any)?.categoryCode ?? MOL_LIST_CATEGORY_DEFAULT;

  if (!hasId) {
    const categoryName =
      (currentNode.value as any)?.categoryName ??
      (currentNode.value as any)?.categoryNameCn ??
      MOL_CATEGORY_NAME;
    if (!categoryName) {
      message.warning('请先在左侧选择产品分类');
      return;
    }
  }
  formDrawerReadonly.value = readonly;
  formDrawerTitle.value = readonly
    ? '分子产品详情'
    : hasId
      ? '编辑分子产品信息'
      : '新增分子产品信息';

  const base: Record<string, any> = { ...extra };
  if (hasId) {
    base.id = String(id);
    base.lang = 'en_us';
    base.autoSelectBuSbu = false;
  } else {
    if (base.lang == null || base.lang === '') {
      base.lang = DEFAULT_ADD_LANG;
    }
    base.categoryName =
      (currentNode.value as any)?.categoryName ??
      (currentNode.value as any)?.categoryNameCn ??
      MOL_CATEGORY_NAME;
    const currentLevel = Number((currentNode.value as any)?.level ?? 0);
    base.autoSelectBuSbu = currentLevel === 4;
    if (base.autoSelectBuSbu) {
      const lineage = ((currentNode.value as any)?.lineage ?? []) as Array<any>;
      const l2 = lineage.find((x: any) => Number(x?.level) === 2);
      const l4 = lineage.find((x: any) => Number(x?.level) === 4);
      base.preferBuCode = l2?.categoryCode;
      base.preferBuName = l2?.categoryName ?? l2?.categoryNameCn;
      base.preferSbuCode = l4?.categoryCode;
      base.preferSbuName = l4?.categoryName ?? l4?.categoryNameCn;
    }
  }

  if (selectedCategoryCode != null && String(selectedCategoryCode) !== '') {
    base.categoryCode = String(selectedCategoryCode);
  }

  formDrawerParams.value = base;
  formDrawerKey.value += 1;
  formDrawerOpen.value = true;
}

function closeProductForm() {
  formDrawerOpen.value = false;
}

async function catalogFetchDefinition(params: Record<string, any>) {
  const id = params?.id;
  if (id != null && String(id) !== '') {
    const { id: catalogId, ...query } = params;
    return getProductCatalogDetail(catalogId, query);
  }
  return getProductCatalogFormDefinition({
    ...params,
    categoryName: params?.categoryName ?? MOL_CATEGORY_NAME,
  });
}

async function onProductFormSave(model: Record<string, any>) {
  const payload = buildProductCatalogAddPayload(model, {
    defaultSourceLang: (formDrawerParams.value.lang as string) || 'zh_cn',
  });
  const catalogId = formDrawerParams.value?.id;
  try {
    let res: any;
    if (catalogId != null && String(catalogId) !== '') {
      const idNum = Number(catalogId);
      res = await updateProductCatalog({
        id: Number.isFinite(idNum) ? idNum : catalogId,
        ...payload,
      });
    } else {
      res = await saveProductCatalog(payload);
    }

    if (res && typeof res === 'object' && 'code' in res && res.code !== 200) {
      message.error(res?.msg ?? '操作失败');
      return;
    }

    message.success('保存成功');
    formDrawerOpen.value = false;
    gridApi.reload();
  } catch (e: any) {
    message.error(e?.response?.data?.msg ?? e?.data?.msg ?? e?.message ?? '保存失败');
  }
}

function handleTreeSelect(node: any) {
  currentNode.value = node ?? null;
  gridApi.reload();
}

async function handleAdd() {
  await openProductForm({});
}

async function handleEdit(row: any) {
  const id = row?.id;
  if (id == null || id === '') {
    message.warning('缺少产品 id，无法编辑');
    return;
  }
  await openProductForm({ id, categoryCode: row?.categoryCode });
}

async function handleDetail(row: any) {
  const id = row?.id;
  if (id == null || id === '') {
    message.warning('缺少产品 id，无法查看详情');
    return;
  }
  await openProductForm({ id, categoryCode: row?.categoryCode }, { readonly: true });
}

onMounted(async () => {
  await loadTree(TREE_ROOT_CATEGORY_CODE);
  const mol = findMolCategoryNode(treeData.value);
  if (mol) {
    currentNode.value = mol;
  }
  gridApi.reload();
});

onActivated(() => {
  gridApi.reload();
});
</script>

<template>
  <div class="product-category-page">
    <Row :gutter="16" align="stretch">
      <!-- 左侧产品分类树（固定 + 独立滚动） -->
      <Col :span="6">
        <Page auto-content-height>
          <CategoryTree
            v-if="treeData.length"
            :treeData="treeData"
            search-placeholder="请输入分类名称"
            :sync-highlight="true"
            :highlight-node-id="currentNode?.id ?? null"
            @select="handleTreeSelect"
          />
        </Page>
      </Col>
      <!-- 右侧：查询 + 按钮 + 表格 + 分页 -->
      <Col :span="18">
        <Page auto-content-height>
          <Grid>
            <template #toolbar-tools>
              <Button class="btn-yellow mr-2 flex items-center" @click="handleAdd">
                <IconifyIcon icon="material-symbols:add" class="size-5" />
                新增
              </Button>
              <!-- <Popconfirm title="是否确认批量删除选中产品?" ok-text="确认" cancel-text="取消" @confirm="handleBatchDelete">
                <Button class="btn-gray mr-2 flex items-center"
                  :disabled="!(gridApi.grid?.getCheckboxRecords?.()?.length)">
                  <IconifyIcon icon="material-symbols:delete" class="size-5" />
                  批量删除
                </Button>
              </Popconfirm> -->
            </template>
            <template #action="{ row }">
              <Button type="link" @click="handleEdit(row)">编辑</Button>
              <Button type="link" @click="handleDetail(row)">详情</Button>
              <!-- <Popconfirm title="是否确认删除该产品?" ok-text="确认" cancel-text="取消" @confirm="handleDelete(row)">
                <Button danger type="link">删除</Button>
              </Popconfirm> -->
            </template>
          </Grid>
        </Page>
      </Col>
    </Row>
    <!-- 新增/编辑：抽屉内嵌动态表单（不走路由） -->
    <Drawer v-model:open="formDrawerOpen" :title="formDrawerTitle" placement="right" :width="'70%'"
      :destroy-on-close="true" :body-style="{ padding: '12px 16px', overflow: 'auto' }"
      root-class-name="product-category-form-drawer">
      <DynamicFormDefinitionPage v-if="formDrawerOpen" :key="formDrawerKey" :fetch-definition="catalogFetchDefinition"
        :params="formDrawerParams" :readonly="formDrawerReadonly" :on-cancel="closeProductForm"
        :on-save="formDrawerReadonly ? undefined : onProductFormSave" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Col, Drawer, Popconfirm, Row } from 'ant-design-vue';
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
import CategoryTree from './modules/categoryTree.vue';
import { buildProductCatalogAddPayload } from './utils/buildProductCatalogPayload';
import { attachCatalogTreeMeta, mapCatalogRowCommon, pickListCategoryCode } from './utils/catalogPageUtils';
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
const treeData = ref<TreeNode[]>([]);
const currentNode = ref<TreeNode | null>(null);

/** 抽屉表单：仅在打开时赋值，避免 params 深度 watch 死循环 */
const formDrawerOpen = ref(false);
const formDrawerKey = ref(0);
const formDrawerTitle = ref('新增产品目录');
const formDrawerReadonly = ref(false);
const DEFAULT_ADD_LANG = 'en_us';
const TREE_ROOT_CATEGORY_CODE = 'AB';
const DEFAULT_LIST_CATEGORY = 'SECT_免疫';
const formDrawerParams = ref<Record<string, any>>({ lang: DEFAULT_ADD_LANG, categoryName: '免疫' });

function mapCatalogRow(raw: any) {
  return mapCatalogRowCommon(raw);
}
function attachLabel(
  nodes: TreeNode[],
  level = 1,
  lineage: TreeNode['lineage'] = [],
): TreeNode[] {
  return attachCatalogTreeMeta(nodes, level, lineage as any) as any;
}
async function loadTree() {
  try {
    const code = TREE_ROOT_CATEGORY_CODE;
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
    // { field: 'gene_id', title: '基因ID', width: 120 },
    // { field: 'mono_type', title: '单抗状态', width: 120 },
    // { field: 'creator', title: '创建人', width: 100 },
    { field: 'createTime', title: '创建时间', width: 160 },
    // { field: 'modifier', title: '更新人', width: 100 },
    // { field: 'modify_time', title: '更新时间', width: 160 },
    {
      field: 'action', fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    // 数据不足一页时也显示分页栏，避免“看起来没渲染”
    autoHidden: false,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const code = pickListCategoryCode({
          selectedCode: (currentNode.value as TreeNode | null)?.categoryCode,
          level1Code: (treeData.value?.[0] as any)?.categoryCode,
          fallbackCode: DEFAULT_LIST_CATEGORY,
        });
        const fv = { ...(formValues ?? {}) } as Record<string, any>;
        const visibleStatus = fv.visibleStatus;
        const shelfStatus = fv.shelfStatus;
        delete fv.visibleStatus;
        delete fv.shelfStatus;
        const res = await getProductCatalogList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          // 左侧树选中时，与 /api/product/category/tree 一致，传 categoryCode（不再传 category 中文名）
          ...(code ? { category: code } : {}),
          ...fv,
          ...(visibleStatus !== undefined && visibleStatus !== '' && visibleStatus != null
            ? { visibleStatus: visibleStatus }
            : {}),
          ...(shelfStatus !== undefined && shelfStatus !== '' && shelfStatus != null
            ? { shelfStatus: shelfStatus }
            : {}),
        });
        // 兼容两类返回：{ total, rows } / { code, msg, data: { total, rows } }
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
  // 给后端 tree/dropDown 传入当前分类编码
  const selectedCategoryCode =
    extra?.categoryCode ?? (currentNode.value as any)?.categoryCode;

  // 新增必须选左侧分类；编辑/详情只依赖列表 id
  if (!hasId) {
    const categoryName =
      (currentNode.value as any)?.categoryName ??
      (currentNode.value as any)?.categoryNameCn;
    if (!categoryName) {
      message.warning('请先在左侧选择产品分类');
      return;
    }
  }

  formDrawerReadonly.value = readonly;
  formDrawerTitle.value = readonly
    ? '产品目录详情'
    : hasId
      ? '编辑产品目录'
      : '新增产品目录';

  const base: Record<string, any> = { ...extra };
  if (hasId) {
    base.id = String(id);
    // 编辑/详情：默认使用英文
    base.lang = 'en_us';
    base.autoSelectBuSbu = false;
  } else {
    // 新增：默认 en_us；后续可在表单头部切换语言（reload 会带 currentLang 请求）
    if (base.lang == null || base.lang === '') {
      base.lang = DEFAULT_ADD_LANG;
    }
    base.categoryName =
      (currentNode.value as any)?.categoryName ??
      (currentNode.value as any)?.categoryNameCn;
    const currentLevel = Number((currentNode.value as any)?.level ?? 0);
    // 仅当选中四级分类时才自动默认选中 BU/SBU
    base.autoSelectBuSbu = currentLevel === 4;
    const lineage = ((currentNode.value as any)?.lineage ?? []) as Array<any>;
    const l2 = lineage.find((x: any) => Number(x?.level) === 2);
    const l4 = lineage.find((x: any) => Number(x?.level) === 4);
    if (base.autoSelectBuSbu) {
      // 仅四级时：BU 来自二级，SBU 来自四级
      base.preferBuCode = l2?.categoryCode;
      base.preferBuName = l2?.categoryName ?? l2?.categoryNameCn;
      base.preferSbuCode = l4?.categoryCode;
      base.preferSbuName = l4?.categoryName ?? l4?.categoryNameCn;
    }
  }
  // tree/dropDown 依赖的 categoryCode
  if (selectedCategoryCode != null && String(selectedCategoryCode) !== '') {
    base.categoryCode = String(selectedCategoryCode);
  }
  // 仅编辑/详情时刷新树；新增不触发 tree 接口请求
  if (hasId) {
    await loadTree();
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
  return getProductCatalogFormDefinition(params);
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

    // 部分接口设置 responseReturn='body'，所以 { code, msg } 不会触发异常，需要手动判断
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
  await loadTree();
  if (!currentNode.value && treeData.value.length > 0) {
    currentNode.value = treeData.value[0] as TreeNode;
  }
  gridApi.reload();
});
onActivated(() => {
  gridApi.reload();
});
</script>
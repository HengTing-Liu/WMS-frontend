<template>
  <div>
    <Page auto-content-height>
      <Grid>
        <template #toolbar-tools>
          <Button type="primary" class="mr-2 flex items-center" @click="handleAdd">
            <IconifyIcon icon="material-symbols:add" class="size-5" /> 新增
          </Button>
          <Popconfirm
            title="是否确认批量删除选中产品?"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleBatchDelete"
          >
            <Button danger class="mr-2 flex items-center">
              <IconifyIcon icon="material-symbols:delete" class="size-5" /> 删除
            </Button>
          </Popconfirm>
        </template>
        <template #action="{ row }">
          <Button type="link" @click="handleEdit(row)">修改</Button>
          <Popconfirm
            title="是否确认删除该产品?"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleDelete(row)"
          >
            <Button danger type="link">删除</Button>
          </Popconfirm>
        </template>
      </Grid>
    </Page>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button, Popconfirm } from 'ant-design-vue';
import {
  getProductCategoryList,
  deleteProductCategory,
} from '#/api';
import type { ProductCategoryApi } from '#/api';

type RowType = ProductCategoryApi.ProductItem;

const router = useRouter();

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
      labelWidth: 80,
      componentProps: { placeholder: '请输入货号' },
    },
    {
      component: 'Input',
      fieldName: 'productName',
      label: '名称',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: { placeholder: '请输入名称' },
    },
    {
      component: 'Select',
      fieldName: 'productStatus',
      label: '产品状态',
      formItemClass: 'col-span-1',
      labelWidth: 90,
      componentProps: {
        allowClear: true,
        options: [
          { label: '可售', value: '可售' },
          { label: '停售', value: '停售' },
        ],
        placeholder: '请选择',
      },
    },
    {
      component: 'Input',
      fieldName: 'brand',
      label: '品牌',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: { placeholder: '请输入品牌' },
    },
  ],
};

const gridOptions: VxeTableGridOptions<RowType> = {
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'catalog_no', title: '货号', minWidth: 120 },
    { field: 'name', title: '名称', minWidth: 180 },
    { field: 'brand', title: '品牌', width: 120 },
    { field: 'cp_status', title: '产品状态', width: 100 },
    { field: 'ks_status', title: '可售状态', width: 100 },
    // { field: 'createTime', title: '创建时间', width: 180, formatter: 'formatDateTime' },
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
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const res = await getProductCategoryList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
        return {
          total: res?.total ?? 0,
          items: res?.rows ?? [],
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid<RowType>({
  formOptions,
  gridOptions,
});

function handleAdd() {
  // 新增：跳转到最新的动态表单界面
  router.push({ path: '/basicArchive/productCategory/formDefinition' });
}

function handleEdit(row: RowType) {
  // 编辑：跳转到最新的动态表单界面（先透传 id）
  router.push({ path: '/basicArchive/productCategory/formDefinition', query: { id: String(row.id) } });
}

async function handleDelete(row: RowType) {
  try {
    await deleteProductCategory(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

async function handleBatchDelete() {
  const rows = gridApi.grid?.getCheckboxRecords?.() ?? [];
  if (!rows.length) {
    message.warning('请勾选需要删除的产品');
    return;
  }
  const ids = rows.map((r) => r.id).join(',');
  try {
    await deleteProductCategory(ids);
    message.success('批量删除成功');
    gridApi.reload();
  } catch (e: any) {
    message.error(e?.message || '批量删除失败');
  }
}
</script>

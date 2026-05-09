<template>
  <Page auto-content-height :title="$t('page.inv.qrcodeDetail.title')">
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="'inv:qrcodedetail:add'"
          type="primary"
          class="mr-2"
          @click="handleAdd"
        >
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button
          v-access:code="'inv:qrcodedetail:import'"
          class="mr-2"
          @click="handleImport"
        >
          <IconifyIcon icon="material-symbols:upload" class="size-5" />
          {{ $t('page.common.import') }}
        </Button>
        <Button
          v-access:code="'inv:qrcodedetail:export'"
          @click="handleExport"
        >
          <IconifyIcon icon="material-symbols:download" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
      </template>

      <template #action="{ row }">
        <Button
          v-access:code="'inv:qrcodedetail:edit'"
          type="link"
          @click="handleEdit(row)"
        >
          {{ $t('page.common.edit') }}
        </Button>
        <Button
          v-access:code="'inv:qrcodedetail:delete'"
          type="link"
          danger
          @click="handleDelete(row)"
        >
          {{ $t('page.common.delete') }}
        </Button>
      </template>
    </Grid>

    <!-- 新增/编辑弹窗 -->
    <QrcodeDetailModal
      ref="modalRef"
      @success="handleModalSuccess"
    />

    <!-- 导入弹窗 -->
    <ImportModal
      ref="importModalRef"
      @success="handleImportSuccess"
    />
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, message, Modal } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { VbenFormProps } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  getQrcodeDetailList,
  deleteQrcodeDetail,
  exportQrcodeDetail,
  type InvQrcodedetailApi,
} from '#/api/inv/qrcode-detail';

import QrcodeDetailModal from './modules/qrcode-detail-modal.vue';
import ImportModal from './modules/import-modal.vue';

const modalRef = ref();
const importModalRef = ref();

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'qrcode',
      label: $t('page.inv.qrcodeDetail.qrcode'),
      componentProps: {
        placeholder: $t('page.inv.qrcodeDetail.qrcodePlaceholder'),
        allowClear: true,
      },
    },
  ],
};

// 表格配置
const gridOptions: any = {
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' },
    { type: 'seq', width: 60, title: $t('page.common.seq') },
    {
      field: 'qrcode',
      title: $t('page.inv.qrcodeDetail.qrcode'),
      minWidth: 200,
    },
    {
      field: 'createTime',
      title: $t('page.common.createTime'),
      width: 180,
    },
    {
      field: 'action',
      title: $t('page.common.operation'),
      fixed: 'right',
      slots: { default: 'action' },
      width: 150,
    },
  ],
  height: 'auto',
  pagerConfig: {
    enabled: true,
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const res = await getQrcodeDetailList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
        return { rows: res.rows, total: res.total };
      },
    },
  },
  rowConfig: {
    isCurrent: true,
    isHover: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 新增
const handleAdd = () => {
  modalRef.value?.open();
};

// 编辑
const handleEdit = (row: InvQrcodedetailApi.QrcodeDetail) => {
  modalRef.value?.open(row);
};

// 删除
const handleDelete = (row: InvQrcodedetailApi.QrcodeDetail) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.inv.qrcodeDetail.confirmDelete', { qrcode: row.qrcode }),
    async onOk() {
      await deleteQrcodeDetail(row.id);
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
};

// 导入
const handleImport = () => {
  importModalRef.value?.open();
};

// 导出
const handleExport = async () => {
  try {
    const blob = await exportQrcodeDetail();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `qrcode-detail-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.success($t('page.message.exportSuccess'));
  } catch (error) {
    message.error($t('page.message.exportFail'));
  }
};

// 弹窗成功回调
const handleModalSuccess = () => {
  gridApi.reload();
};

// 导入成功回调
const handleImportSuccess = () => {
  gridApi.reload();
};
</script>

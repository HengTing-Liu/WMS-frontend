<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button class="mr-2" @click="handleExport">
          <IconifyIcon icon="bx:export" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
        <Button type="primary" @click="handleGenerate">
          <IconifyIcon icon="mdi:lightning-bolt" class="size-5" />
          {{ $t('page.system.serial.generate') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Tag :color="row.status === '0' ? 'success' : 'default'">
          {{ row.status === '0' ? $t('page.common.enabled') : $t('page.common.disabled') }}
        </Tag>
      </template>

      <template #dateFormat="{ row }">
        <Tag v-if="row.dateFormat">{{ row.dateFormat }}</Tag>
        <span v-else class="text-gray-400">{{ $t('page.system.serial.noDate') }}</span>
      </template>

      <template #currentSeq="{ row }">
        <span class="font-mono">{{ formatSeq(row.currentSeq, row.seqLength) }}</span>
      </template>

      <template #action="{ row }">
        <Button type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>

    <SerialNumberModal ref="modalRef" @success="handleReload" />
    <GenerateModal ref="generateModalRef" @success="handleReload" />
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Tag } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { downloadFileFromBlob } from '@vben/utils';
import type { VbenFormProps } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getSerialNumberList,
  deleteSerialNumber,
  exportSerialNumber,
} from '#/api';
import SerialNumberModal from './modules/serial-number-modal.vue';
import GenerateModal from './modules/generate-modal.vue';

const modalRef = ref();
const generateModalRef = ref();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'ruleName',
      label: $t('page.system.serial.ruleName'),
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.common.status'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.common.enabled'), value: '0' },
          { label: $t('page.common.disabled'), value: '1' },
        ],
      },
    },
  ],
};

const gridOptions = {
  columns: [
    { type: 'seq' as const, width: 60, title: $t('page.common.seq') },
    { field: 'ruleName', title: $t('page.system.serial.ruleName'), minWidth: 150 },
    { field: 'prefix', title: $t('page.system.serial.prefix'), width: 100 },
    { field: 'dateFormat', title: $t('page.system.serial.dateFormat'), width: 120, slots: { default: 'dateFormat' } },
    { field: 'seqLength', title: $t('page.system.serial.seqLength'), width: 80, align: 'center' as const },
    { field: 'suffix', title: $t('page.system.serial.suffix'), width: 100 },
    { field: 'currentSeq', title: $t('page.system.serial.currentSeq'), width: 100, align: 'center' as const, slots: { default: 'currentSeq' } },
    { field: 'resetType', title: $t('page.system.serial.resetType'), width: 100 },
    { field: 'status', title: $t('page.common.status'), width: 80, slots: { default: 'status' } },
    { field: 'createTime', title: $t('page.common.createTime'), width: 160, formatter: 'formatDateTime' },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 200 },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    response: {
      total: 'total',
      result: 'rows',
    },
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const res = await getSerialNumberList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
        return res;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const handleAdd = () => modalRef.value?.open();
const handleEdit = (row: any) => modalRef.value?.open(row);
const handleReload = () => gridApi.reload();

// 格式化序号
const formatSeq = (seq: number, length: number) => {
  if (!seq) return '0'.padStart(length || 3, '0');
  return String(seq).padStart(length || 3, '0');
};

// 打开生成弹窗
const handleGenerate = () => {
  generateModalRef.value?.open();
};

const handleDelete = async (row: any) => {
  await deleteSerialNumber(String(row.id));
  message.success($t('page.message.deleteSuccess'));
  gridApi.reload();
};

// 导出
const handleExport = async () => {
  try {
    const formValues = await gridApi.formApi?.getValues?.();
    const blob = await exportSerialNumber(formValues);
    downloadFileFromBlob({ source: blob, fileName: `serial_number_${Date.now()}.xlsx` });
    message.success($t('page.message.exportSuccess'));
  } catch (error) {
    message.error($t('page.message.exportFail'));
  }
};
</script>

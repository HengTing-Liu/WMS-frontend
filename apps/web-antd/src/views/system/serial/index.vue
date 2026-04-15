<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button v-access:code="'sys:serial:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button v-access:code="'sys:serial:generate'" class="mr-2" @click="handleGenerate">
          <IconifyIcon icon="material-symbols:bolt" class="size-5" />
          {{ $t('page.system.serial.generateTitle') }}
        </Button>
        <Button v-access:code="'sys:serial:export'" @click="handleExport">
          <IconifyIcon icon="material-symbols:download" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Switch :checked="isStatusEnabled(row.status)" @change="(checked) => handleStatusChange(row, checked)" />
      </template>

      <template #action="{ row }">
        <Button v-access:code="'sys:serial:edit'" type="link" @click="handleEdit(row)">
          {{ $t('page.common.edit') }}
        </Button>
        <Button v-access:code="'sys:serial:delete'" type="link" danger @click="handleDelete(row)">
          {{ $t('page.common.delete') }}
        </Button>
      </template>
    </Grid>

    <SerialNumberModal ref="modalRef" @success="handleReload" />
    <GenerateModal ref="generateModalRef" @success="handleReload" />
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  changeSerialRuleStatus,
  deleteSerialNumber,
  exportSerialNumber,
  getSerialNumberList,
} from '#/api';
import { Button, message, Modal, Switch } from 'ant-design-vue';

import GenerateModal from './modules/generate-modal.vue';
import SerialNumberModal from './modules/serial-number-modal.vue';

const modalRef = ref<InstanceType<typeof SerialNumberModal> | null>(null);
const generateModalRef = ref<InstanceType<typeof GenerateModal> | null>(null);

const gridOptions = {
  columns: [
    { type: 'seq' as const, title: $t('page.common.seq'), width: 60, align: 'center' as const },
    { field: 'ruleCode', title: $t('page.system.serial.ruleCode'), minWidth: 140 },
    { field: 'ruleName', title: $t('page.system.serial.ruleName'), minWidth: 160 },
    { field: 'prefix', title: $t('page.system.serial.prefix'), width: 110 },
    { field: 'dateFormat', title: $t('page.system.serial.dateFormat'), width: 120 },
    { field: 'seqLength', title: $t('page.system.serial.seqLength'), width: 100, align: 'center' as const },
    { field: 'currentSeq', title: $t('page.system.serial.currentSeq'), width: 110, align: 'right' as const },
    { field: 'maxSeq', title: $t('page.system.serial.startSeq'), width: 120, align: 'right' as const },
    { field: 'suffix', title: $t('page.system.serial.suffix'), width: 110 },
    { field: 'resetType', title: $t('page.system.serial.resetType'), width: 100, align: 'center' as const },
    { field: 'status', title: $t('page.common.status'), width: 90, slots: { default: 'status' } },
    { field: 'updateTime', title: $t('page.common.updateTime'), width: 170, formatter: 'formatDateTime' },
    {
      field: 'action',
      title: $t('page.common.operation'),
      width: 140,
      fixed: 'right' as const,
      slots: { default: 'action' },
    },
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
        return await getSerialNumberList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const formOptions = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'ruleCode',
      label: $t('page.system.serial.ruleCode'),
    },
    {
      component: 'Input',
      fieldName: 'ruleName',
      label: $t('page.system.serial.ruleName'),
    },
    {
      component: 'Select',
      fieldName: 'resetType',
      label: $t('page.system.serial.resetType'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.system.serial.never'), value: 'NEVER' },
          { label: $t('page.system.serial.everyDay'), value: 'DAY' },
          { label: $t('page.system.serial.everyMonth'), value: 'MONTH' },
          { label: $t('page.system.serial.everyYear'), value: 'YEAR' },
        ],
      },
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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

function isStatusEnabled(status: unknown): boolean {
  return status === 0 || status === '0' || status === true || status === 'true';
}

function handleAdd() {
  modalRef.value?.open();
}

function handleEdit(row: any) {
  modalRef.value?.open(row);
}

function handleGenerate() {
  generateModalRef.value?.open();
}

function handleReload() {
  gridApi.reload();
}

function handleDelete(row: any) {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: `${$t('page.common.delete')}「${row.ruleName || row.ruleCode}」?`,
    async onOk() {
      await deleteSerialNumber(String(row.id));
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
}

function handleStatusChange(row: any, checked: boolean) {
  const nextStatus = checked ? '0' : '1';
  const currentStatus = isStatusEnabled(row.status) ? '0' : '1';
  if (nextStatus === currentStatus) return;

  Modal.confirm({
    title: $t('page.common.confirm'),
    content: nextStatus === '0' ? '确认启用该规则吗？' : '确认停用该规则吗？',
    async onOk() {
      await changeSerialRuleStatus({ id: Number(row.id), status: nextStatus });
      message.success($t('page.message.operationSuccess'));
      gridApi.reload();
    },
  });
}

async function handleExport() {
  try {
    const formValues = gridApi.formValues || {};
    const blob = await exportSerialNumber(formValues);
    const url = window.URL.createObjectURL(blob as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `serial_rule_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success($t('page.message.exportSuccess'));
  } catch (error) {
    console.error(error);
    message.error($t('page.message.exportFail'));
  }
}
</script>

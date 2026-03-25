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
        <Button class="mr-2" @click="handleImport">
          <IconifyIcon icon="bx:import" class="size-5" />
          {{ $t('page.common.import') }}
        </Button>
      </template>
      
      <template #isEnabled="{ row }">
        <Switch
          :checked="row.isEnabled === 1 || row.isEnabled === '1'"
          @change="(checked) => handleChangeStatus(row, checked)"
        />
      </template>
      
      <template #action="{ row }">
        <Button type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>
    
    <EnumModal ref="modalRef" @success="handleReload" />
    
    <!-- 导入弹窗 -->
    <Modal
      :title="$t('page.common.import')"
      v-model:open="importModalVisible"
      @ok="handleImportSubmit"
      :confirm-loading="importLoading"
    >
      <Upload
        v-model:file-list="fileList"
        :before-upload="beforeUpload"
        accept=".xlsx,.xls"
        :max-count="1"
      >
        <Button>
          <IconifyIcon icon="ant-design:upload-outlined" />
          {{ $t('page.common.selectFile') }}
        </Button>
      </Upload>
      <div class="mt-4">
        <Button type="link" @click="handleDownloadTemplate">
          {{ $t('page.common.downloadTemplate') }}
        </Button>
      </div>
    </Modal>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Switch, Modal, Upload } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { downloadFileFromBlob } from '@vben/utils';
import type { VbenFormProps } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { 
  getEnumDefineList, editEnumDefine, deleteEnumDefine,
  exportEnumDefine, importEnumDefine, downloadEnumDefineTemplate
} from '#/api';
import EnumModal from './modules/enum-modal.vue';

const modalRef = ref();
const importModalVisible = ref(false);
const importLoading = ref(false);
const fileList = ref<any[]>([]);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'enumName',
      label: $t('page.system.enum.enumName'),
    },
    {
      component: 'Input',
      fieldName: 'enumCode',
      label: $t('page.system.enum.enumCode'),
    },
    {
      component: 'Select',
      fieldName: 'isEnabled',
      label: $t('page.common.status'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.common.enabled'), value: 1 },
          { label: $t('page.common.disabled'), value: 0 },
        ],
      },
    },
  ],
};

const gridOptions = {
  columns: [
    { type: 'seq' as const, width: 60, title: $t('page.common.seq') },
    { field: 'enumCode', title: $t('page.system.enum.enumCode'), minWidth: 150 },
    { field: 'enumName', title: $t('page.system.enum.enumName'), minWidth: 150 },
    { field: 'enumDesc', title: $t('page.system.enum.enumDesc'), minWidth: 200 },
    { field: 'categoryName', title: $t('page.system.enum.categoryName'), width: 120 },
    { field: 'isEnabled', title: $t('page.common.status'), width: 100, slots: { default: 'isEnabled' } },
    { field: 'sortOrder', title: $t('page.system.enum.sortOrder'), width: 80, align: 'center' as const },
    { field: 'createTime', title: $t('page.common.createTime'), width: 160, formatter: 'formatDateTime' },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 150 },
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
        const res = await getEnumDefineList({
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

const handleChangeStatus = async (row: any, checked: boolean | string) => {
  // 使用 checked 参数判断是否启用
  const nextStatus = checked ? 1 : 0;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(checked ? 'page.system.enum.confirmEnable' : 'page.system.enum.confirmDisable', { name: row.enumName }),
    okText: $t('page.common.confirm'),
    cancelText: $t('page.common.cancel'),
    async onOk() {
      try {
        await editEnumDefine({ id: row.id, isEnabled: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
      }
    },
    onCancel() {
      // 取消时恢复 Switch 状态
      gridApi.reload();
    },
  });
};

const handleDelete = async (row: any) => {
  await deleteEnumDefine(String(row.id));
  message.success($t('page.message.deleteSuccess'));
  gridApi.reload();
};

// 导出
const handleExport = async () => {
  try {
    const formValues = await gridApi.formApi?.getValues?.();
    const blob = await exportEnumDefine(formValues);
    downloadFileFromBlob({ source: blob, fileName: `enum_define_${Date.now()}.xlsx` });
    message.success($t('page.message.exportSuccess'));
  } catch (error) {
    message.error($t('page.message.exportFail'));
  }
};

// 导入
const handleImport = () => {
  importModalVisible.value = true;
  fileList.value = [];
};

const beforeUpload = () => {
  return false;
};

const handleImportSubmit = async () => {
  if (fileList.value.length === 0) {
    message.warning($t('page.message.pleaseSelectFile'));
    return;
  }
  
  importLoading.value = true;
  try {
    const file = fileList.value[0].originFileObj;
    await importEnumDefine(file);
    message.success($t('page.message.importSuccess'));
    importModalVisible.value = false;
    gridApi.reload();
  } catch (error) {
    message.error($t('page.message.importFail'));
  } finally {
    importLoading.value = false;
  }
};

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const blob = await downloadEnumDefineTemplate();
    downloadFileFromBlob({ source: blob, fileName: 'enum_define_template.xlsx' });
  } catch (error) {
    message.error($t('page.message.downloadFail'));
  }
};
</script>

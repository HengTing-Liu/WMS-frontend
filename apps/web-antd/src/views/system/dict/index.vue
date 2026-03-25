<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button v-access:code="'system:dict:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button v-access:code="'system:dict:export'" class="mr-2" @click="handleExport">
          <IconifyIcon icon="bx:export" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
        <Button v-access:code="'system:dict:import'" class="mr-2" @click="handleImport">
          <IconifyIcon icon="bx:import" class="size-5" />
          {{ $t('page.common.import') }}
        </Button>
      </template>
      
      <template #status="{ row }">
        <Switch
          :checked="row.status"
          :checkedValue="'0'"
          :unCheckedValue="'1'"
          @change="() => handleChangeStatus(row)"
        />
      </template>
      
      <template #action="{ row }">
        <Button v-access:code="'system:dict:edit'" type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button v-access:code="'system:dict:delete'" type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>
    
    <DictTypeModal ref="modalRef" @success="handleReload" />
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
  getDictTypeList, changeDictTypeStatus, deleteDictType,
  exportDictType, importDictType, downloadDictTypeTemplate
} from '#/api';
import DictTypeModal from './modules/dict-type-modal.vue';

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
      fieldName: 'dictName',
      label: $t('page.system.dict.dictName'),
    },
    {
      component: 'Input',
      fieldName: 'dictType',
      label: $t('page.system.dict.dictType'),
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
    { field: 'dictId', title: $t('page.system.dict.dictId'), width: 100 },
    { field: 'dictName', title: $t('page.system.dict.dictName'), minWidth: 150 },
    { field: 'dictType', title: $t('page.system.dict.dictType'), minWidth: 150 },
    { field: 'status', title: $t('page.common.status'), width: 100, slots: { default: 'status' } },
    { field: 'createTime', title: $t('page.common.createTime'), width: 160, formatter: 'formatDateTime' },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 120 },
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
        const res = await getDictTypeList({
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

const handleChangeStatus = async (row: any) => {
  // :checked 已经改变了 row.status，直接使用
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(nextStatus === '1' ? 'page.system.dict.confirmDisable' : 'page.system.dict.confirmEnable', { name: row.dictName }),
    okText: $t('page.common.confirm'),
    cancelText: $t('page.common.cancel'),
    async onOk() {
      try {
        await changeDictTypeStatus({ dictId: row.dictId, status: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
      }
    },
  });
};

const handleDelete = async (row: any) => {
  await deleteDictType(String(row.dictId));
  message.success($t('page.message.deleteSuccess'));
  gridApi.reload();
};

// 导出
const handleExport = async () => {
  try {
    const formValues = await gridApi.formApi?.getValues?.();
    const blob = await exportDictType(formValues);
    downloadFileFromBlob({ source: blob, fileName: `dict_type_${Date.now()}.xlsx` });
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
  return false; // 阻止自动上传
};

const handleImportSubmit = async () => {
  if (fileList.value.length === 0) {
    message.warning($t('page.message.pleaseSelectFile'));
    return;
  }
  
  importLoading.value = true;
  try {
    const file = fileList.value[0].originFileObj;
    await importDictType(file);
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
    const blob = await downloadDictTypeTemplate();
    downloadFileFromBlob({ source: blob, fileName: 'dict_type_template.xlsx' });
  } catch (error) {
    message.error($t('page.message.downloadFail'));
  }
};
</script>

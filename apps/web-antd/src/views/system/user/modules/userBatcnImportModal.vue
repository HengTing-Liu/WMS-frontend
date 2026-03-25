<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message, Upload, Button, Progress } from 'ant-design-vue';
import { downloadFileFromBlob } from '@vben/utils';
import {importTemplate, importUsers } from '#/api';

const fileList = ref<any[]>([]);
const uploading = ref(false);
const progressPercent = ref(0);
const importResult = ref<{
  total: number;
  success: number;
  failed: number;
  message?: string;
} | null>(null);

const beforeUpload = async (file: File) => {
  fileList.value = [file];
  progressPercent.value = 0;
  importResult.value = null;
};
const onRemove = () => {
  fileList.value = [];
  progressPercent.value = 0;
  importResult.value = null;
};
const [Modal, modalApi] = useVbenModal({
  showCancelButton: true,
  showConfirmButton: true,
  openAutoFocus: false,
  draggable: true,
  destroyOnClose: true,
  centered: true,
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (!fileList.value.length) {
      message.warning($t('page.message.pleaseSelectFile'));
      return;
    }

    uploading.value = true;
    progressPercent.value = 0;
    importResult.value = null;

    try {
      const file = fileList.value[0].originFileObj || fileList.value[0];
      const res = await importUsers(file, (progressEvent) => {
        if (progressEvent.total) {
          progressPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      });
      if (res?.code === 200) {
        message.success($t('page.message.importSuccess'));
      } else {
        message.error(res?.msg || $t('page.message.importFail'));
      }
    } catch (error: any) {
      importResult.value = {
        total: 0,
        success: 0,
        failed: 0,
        message: error.message || $t('page.message.importFail'),
      };
      message.error($t('page.message.importFail'));
    } finally {
      uploading.value = false;
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      fileList.value = [];
      progressPercent.value = 0;
      importResult.value = null;
      uploading.value = false;
    }
  },
  confirmText: () => $t('page.common.import'),
  title: () => $t('page.system.user.batchImportTitle'),
});

const download = async () => {
  const blob = await importTemplate();
  downloadFileFromBlob({
    fileName: `${$t('page.system.user.importTemplate')}.xlsx`,
    source: blob,
  });
};

</script>
<template>
  <Modal>
    <template #append-footer>
    </template>
    <Upload.Dragger
       v-model:file-list="fileList"
      :before-upload="beforeUpload"
      :custom-request="() => {}"
      :show-upload-list="false"
      @remove="onRemove"
      :max-count="1"
      accept=".xls,.xlsx"
    >
      <p class="ant-upload-drag-icon">
        <span class="text-3xl">📄</span>
      </p>
      <div v-if="fileList.length === 0">
        <p class="ant-upload-text">{{ $t('page.common.clickOrDragExcel') }}</p>
        <p class="ant-upload-hint">{{ $t('page.common.onlySupportExcel') }}</p>
      </div>
      <div v-else>
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div class="flex items-center">
            <span>{{ fileList[0]?.name }}</span>
          </div>
          <Button type="text" size="small" @click="onRemove" :disabled="uploading">
            {{ $t('page.common.delete') }}
          </Button>
        </div>

        <div v-if="uploading" class="mt-2 px-2">
           <div>{{ $t('page.common.progress') }}{{ progressPercent }}</div>
          <Progress :percent="progressPercent" status="active" />
        </div>
      </div>
      <div v-if="importResult">
        <div>{{ $t('page.common.result') }}{{ importResult }}</div>
      </div>
    </Upload.Dragger>
    <div>
      <Button type="link" class="mr-2 flex items-center" @click="download">
        {{ $t('page.common.downloadTemplate') }}
      </Button>
    </div>
  </Modal>
</template>

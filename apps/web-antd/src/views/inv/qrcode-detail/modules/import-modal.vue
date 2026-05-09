<template>
  <Modal
    :title="$t('page.inv.qrcodeDetail.importTitle')"
    v-model:open="visible"
    :confirm-loading="uploading"
    :ok-button-props="{ disabled: !selectedFile }"
    @ok="handleUpload"
    @cancel="handleCancel"
    width="500px"
  >
    <div class="import-content">
      <!-- 模板下载 -->
      <div class="template-section">
        <Alert type="info" show-icon>
          <template #message>
            {{ $t('page.inv.qrcodeDetail.importTip') }}
          </template>
        </Alert>
        <Button type="link" @click="handleDownloadTemplate">
          <IconifyIcon icon="material-symbols:download" />
          {{ $t('page.common.downloadTemplate') }}
        </Button>
      </div>

      <Divider />

      <!-- 文件上传 -->
      <div class="upload-section">
        <Form :model="formData" layout="vertical">
          <FormItem :label="$t('page.inv.qrcodeDetail.selectFile')">
            <Upload
              :before-upload="handleBeforeUpload"
              :file-list="fileList"
              :max-count="1"
              accept=".xlsx,.xls"
              @remove="handleRemove"
            >
              <Button>
                <IconifyIcon icon="material-symbols:upload-file" />
                {{ $t('page.common.selectFile') }}
              </Button>
            </Upload>
          </FormItem>

          <FormItem>
            <Checkbox v-model:checked="formData.updateSupport">
              {{ $t('page.inv.qrcodeDetail.updateSupport') }}
            </Checkbox>
          </FormItem>
        </Form>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="progress-section">
        <Progress :percent="uploadPercent" status="active" />
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Modal, Form, FormItem, Button, Upload, Checkbox, Progress, Alert, message, Divider } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { importQrcodeDetail, downloadTemplate } from '#/api/inv/qrcode-detail';

const visible = ref(false);
const uploading = ref(false);
const uploadPercent = ref(0);
const selectedFile = ref<File | null>(null);
const fileList = ref<any[]>([]);

const formData = reactive({
  updateSupport: false,
});

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 打开弹窗
const open = () => {
  visible.value = true;
  uploading.value = false;
  uploadPercent.value = 0;
  selectedFile.value = null;
  fileList.value = [];
  formData.updateSupport = false;
};

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const blob = await downloadTemplate();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'qrcode-detail-template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.success($t('page.message.downloadSuccess'));
  } catch (error) {
    message.error($t('page.message.downloadFail'));
  }
};

// 文件选择前
const handleBeforeUpload = (file: File) => {
  const isExcel =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel';
  
  if (!isExcel) {
    message.error($t('page.inv.qrcodeDetail.excelOnly'));
    return false;
  }
  
  selectedFile.value = file;
  fileList.value = [{ uid: file.name, name: file.name, status: 'done' }];
  return false; // 阻止自动上传
};

// 移除文件
const handleRemove = () => {
  selectedFile.value = null;
  fileList.value = [];
};

// 上传
const handleUpload = async () => {
  if (!selectedFile.value) {
    message.warning($t('page.common.pleaseSelectFile'));
    return;
  }

  try {
    uploading.value = true;
    uploadPercent.value = 0;

    await importQrcodeDetail(
      selectedFile.value,
      formData.updateSupport,
      (progressEvent: any) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        uploadPercent.value = percent;
      }
    );

    message.success($t('page.message.importSuccess'));
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error($t('page.message.importFail'));
  } finally {
    uploading.value = false;
  }
};

// 取消
const handleCancel = () => {
  selectedFile.value = null;
  fileList.value = [];
  uploadPercent.value = 0;
};

defineExpose({ open });
</script>

<style scoped lang="less">
.import-content {
  .template-section {
    margin-bottom: 16px;
  }

  .upload-section {
    margin-top: 16px;
  }

  .progress-section {
    margin-top: 16px;
  }
}
</style>

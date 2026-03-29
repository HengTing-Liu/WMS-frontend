<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message, Upload, Button, Table, Progress } from 'ant-design-vue';
import { downloadFileFromBlob } from '@vben/utils';
import {importTemplate, importUsers } from '#/api';
import type { UploadChangeParam, UploadProps } from 'ant-design-vue';

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
  // 重置状态
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
  destroyOnClose:true,
  centered: true,
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (!fileList.value.length) {
      message.warning('请选择要导入的文件');
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
      //  importResult={}
        message.success('导入成功');
      } else {
        //  importResult={}
        message.error(res?.msg || '导入失败');
      }
    } catch (error: any) {
      importResult.value = {
        total: 0,
        success: 0,
        failed: 0,
        message: error.message || '导入失败'
      };
      message.error('导入失败');
    } finally {
      uploading.value = false;
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 重置状态
      fileList.value = [];
      progressPercent.value = 0;
      importResult.value = null;
      uploading.value = false;
    }
  },
  confirmText: '导入',
  title: '批量导入用户',
});

const download = async () => {
  const blob = await importTemplate();
  console.log(blob,'blob');
  downloadFileFromBlob({
    fileName: `用户列表导入模板.xlsx`,
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
        <p class="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
        <p class="ant-upload-hint">仅支持 .xls / .xlsx</p>
      </div>
      <div v-else>
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div class="flex items-center">
            <!-- <span class="text-3xl mr-2">📄</span> -->
            <span>{{ fileList[0]?.name }}</span>
          </div>
          <Button type="text" size="small" @click="onRemove" :disabled="uploading">
            删除
          </Button>
        </div>
        
        <!-- 上传进度 -->
        <div v-if="uploading" class="mt-2 px-2">
           <div>进度{{ progressPercent }}</div>
          <Progress :percent="progressPercent" status="active" />
        </div>
      </div>
      <div v-if="importResult">
        <div>结果{{ importResult }}</div>
      </div>
    </Upload.Dragger>
    <div>
      <Button type="link" class="mr-2 flex items-center" @click="download">
        模板下载
      </Button>
    </div>
  </Modal>
</template>
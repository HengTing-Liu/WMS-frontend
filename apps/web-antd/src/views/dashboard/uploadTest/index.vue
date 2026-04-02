<script setup lang="ts">
import { ref } from 'vue';
import { Button, Upload, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { getFilesCredential, confirmFile, putFileToOss } from '#/api';

const ossFileList = ref<File[]>([]) as any;
const minioFileList = ref<File[]>([]) as any;

const beforeUpload = (file: File, uploadType: 'OSS' | 'MINIO') => {
  const targetList = uploadType === 'OSS' ? ossFileList : minioFileList;
  const isLt2m = file.size / 1024 / 1024 < 2;
  const exist = targetList.value.filter((_file: File) => _file.name === file.name);
  if (!isLt2m) {
    message.error('上传的文件不能超过2M');
  } else if (exist.length > 0) {
    message.error('不能上传重复文件！');
  } else {
    targetList.value = [...targetList.value, file];
    uploadFile(file, uploadType);
  }
  return false;
};

const uploadFile = async (file: File, uploadType: 'OSS' | 'MINIO') => {
  try {
    // 1. 请求凭证（与部门管理等页面一致，使用 #/api 封装的接口）
    const res = await getFilesCredential({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      bizModule: 'product-center',
      uploadType,
    });
    // requestClient 默认 responseReturn: 'data'，返回的已是 data 内容
    const cred = (res as any)?.data ?? res;
    const { fileNo, uploadUrl } = cred;

    // 2. 直传 OSS（使用项目内封装的 putFileToOss，不依赖 axios）
    await putFileToOss(uploadUrl, file, (percent) => {
      console.log(`上传进度: ${percent}%`);
    });

    // 3. 通知后端完成
    await confirmFile({
      fileNo,
      fileSize: file.size,
      md5: '',
    });
    message.success(`文件 ${file.name} 上传成功`);
    return cred.downloadUrl;
  } catch (e: any) {
    message.error(e?.message ?? '上传失败');
  }
};

const handleRemove = (file: any, uploadType: 'OSS' | 'MINIO') => {
  const targetList = uploadType === 'OSS' ? ossFileList : minioFileList;
  const name = file?.name ?? file?.originFileObj?.name;
  if (!name) return;
  const index = targetList.value.findIndex((f: File) => f.name === name);
  if (index > -1) {
    const newFileList = targetList.value.slice();
    newFileList.splice(index, 1);
    targetList.value = newFileList;
  }
};
</script>

<template>
  <div class="p-4 space-y-4">
    <Upload
      required
      :before-upload="(file) => beforeUpload(file as File, 'OSS')"
      :file-list="ossFileList"
      name="seqFile"
      :multiple="true"
      :mask-closable="false"
      @remove="(file) => handleRemove(file, 'OSS')"
      accept=".jpg,.jpeg,.png,.gif,.bmp"
    >
      <Button type="primary" size="small">
        <IconifyIcon icon="ant-design:upload-outlined" class="mr-1" />
        选择上传oss文件
      </Button>
    </Upload>

    <Upload
      required
      :before-upload="(file) => beforeUpload(file as File, 'MINIO')"
      :file-list="minioFileList"
      name="seqFileMinio"
      :multiple="true"
      :mask-closable="false"
      @remove="(file) => handleRemove(file, 'MINIO')"
      accept=".jpg,.jpeg,.png,.gif,.bmp"
    >
      <Button type="primary" size="small">
        <IconifyIcon icon="ant-design:upload-outlined" class="mr-1" />
        选择上传MINIO文件
      </Button>
    </Upload>
  </div>
</template>

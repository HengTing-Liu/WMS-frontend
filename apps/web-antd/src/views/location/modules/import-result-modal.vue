<template>
  <Modal
    :title="$t('page.location.importResult')"
    :open="visible"
    :footer="null"
    width="600px"
    @cancel="handleClose"
  >
    <div class="import-result">
      <!-- 成功提示 -->
      <Alert
        v-if="result && result.failCount === 0"
        :message="$t('page.location.importSuccessAll', { count: result.successCount })"
        type="success"
        show-icon
        style="margin-bottom: 16px"
      />

      <!-- 部分成功 -->
      <Alert
        v-else-if="result && result.failCount > 0 && result.successCount > 0"
        :message="$t('page.location.importSuccessPartial', { success: result.successCount, fail: result.failCount })"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />

      <!-- 完全失败 -->
      <Alert
        v-else-if="result && result.successCount === 0"
        :message="$t('page.location.importFailAll')"
        type="error"
        show-icon
        style="margin-bottom: 16px"
      />

      <!-- 统计信息 -->
      <div v-if="result" class="result-summary">
        <Card size="small">
          <Statistic
            :title="$t('page.location.successCount') || '成功数量'"
            :value="result.successCount"
            :value-style="{ color: '#3f8600' }"
          />
        </Card>
        <Card size="small">
          <Statistic
            :title="$t('page.location.failCount') || '失败数量'"
            :value="result.failCount"
            :value-style="{ color: result.failCount > 0 ? '#cf1322' : '#999' }"
          />
        </Card>
      </div>

      <!-- 错误列表 -->
      <div v-if="result && result.errors && result.errors.length > 0" class="error-list">
        <div class="error-title">
          <IconifyIcon icon="material-symbols:error-outline" style="color: #cf1322" />
          <span>{{ $t('page.location.importErrors') }}</span>
          <Button type="link" size="small" @click="handleDownloadErrors">
            <IconifyIcon icon="material-symbols:download" />
            {{ $t('page.location.downloadErrorReport') }}
          </Button>
        </div>
        <Table
          :dataSource="result.errors"
          :columns="errorColumns"
          :pagination="{ pageSize: 5 }"
          size="small"
          :scroll="{ y: 200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'row'">
              <Tag color="red">{{ $t('page.location.row') || '第' }}{{ record.row }}{{ $t('page.location.line') || '行' }}</Tag>
            </template>
            <template v-else-if="column.key === 'message'">
              <span class="error-message">{{ record.message }}</span>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <template #footer>
      <Button @click="handleClose">{{ $t('page.common.close') }}</Button>
      <Button v-if="result && result.failCount > 0" type="primary" @click="handleDownloadErrors">
        <IconifyIcon icon="material-symbols:download" />
        {{ $t('page.location.downloadErrorReport') }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Modal, Alert, Card, Statistic, Table, Tag, Button, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import type { LocationImportResponse } from '#/api/wms/location';

interface Props {
  locationId?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 弹窗状态
const visible = ref(false);

// 导入结果
const result = ref<LocationImportResponse | null>(null);

// 错误列表列定义
const errorColumns = [
  {
    title: '行号',
    dataIndex: 'row',
    key: 'row',
    width: 80,
  },
  {
    title: '错误信息',
    dataIndex: 'message',
    key: 'message',
  },
];

// 打开弹窗
const open = (importResult: LocationImportResponse) => {
  result.value = importResult;
  visible.value = true;
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
  result.value = null;
  emit('success');
};

// 下载错误报告
const handleDownloadErrors = () => {
  if (!result.value || !result.value.errors || result.value.errors.length === 0) {
    message.warning('没有错误记录');
    return;
  }

  // 生成错误报告文本
  let content = '库位导入错误报告\n';
  content += '========================\n\n';
  content += `生成时间: ${new Date().toLocaleString()}\n\n`;
  content += `成功数量: ${result.value.successCount}\n`;
  content += `失败数量: ${result.value.failCount}\n\n`;
  content += '错误详情:\n';
  content += '------------------------\n';

  result.value.errors.forEach((error) => {
    content += `第${error.row}行: ${error.message}\n`;
  });

  // 创建下载
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `库位导入错误报告_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  message.success($t('page.message.downloadSuccess'));
};

defineExpose({ open });
</script>

<style scoped lang="less">
.import-result {
  .result-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    :deep(.ant-card) {
      flex: 1;
    }
  }

  .error-list {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 12px;

    .error-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .error-message {
      color: #cf1322;
    }
  }
}
</style>

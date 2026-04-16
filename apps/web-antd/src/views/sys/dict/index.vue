<template>
  <div class="sys-dict-page p-4">
    <LowcodePage
      ref="lowcodePageRef"
      table-code="sys_dict_type"
      page-title="WMS0070 字典管理"
      page-desc="管理字典类型和字典数据"
      :crud-prefix="crudPrefix"
      @form-success="handleFormSuccess"
    >


      <!-- 操作列追加「字典数据」按钮 -->
      <template #appendAction="{ record }">
        <Tooltip title="字典数据">
          <Button type="link" size="small" class="p-0" @click="handleDictData(record)">
            <IconifyIcon icon="material-symbols:format-list-bulleted" class="text-lg" />
          </Button>
        </Tooltip>
      </template>
    </LowcodePage>

    <!-- 字典数据管理弹窗 -->
    <DictDataModal
      v-model:open="dictDataModalVisible"
      :dict-type-code="currentDictType?.dictCode || ''"
      :dict-type-name="currentDictType?.dictName || ''"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button, Tooltip, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import LowcodePage from '#/lowcode/LowcodePage.vue';
import DictDataModal from './modules/dict-data-modal.vue';


const crudPrefix = '/api/wms/crud/sys_dict_type';

// LowcodePage 引用
const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

// 字典数据弹窗
const dictDataModalVisible = ref(false);
const currentDictType = ref<{ dictCode: string; dictName: string } | null>(null);

function reloadList() {
  lowcodePageRef.value?.reload();
}

function handleFormSuccess() {
  reloadList();
}

function pickString(record: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function handleDictData(record: Record<string, any>) {
  // 后端字段名是 dictType，不是 dictCode
  const dictCode = pickString(record, [
    'dictType',
    'dict_type',
    'type',
  ]);
  const dictName = pickString(record, [
    'dictName',
    'dict_name',
    'name',
  ]);
  if (!dictCode) {
    console.warn('[Dict] Missing dictType in record:', record);
    message.error('当前行缺少字典编码，无法维护字典数据');
    return;
  }
  currentDictType.value = {
    dictCode,
    dictName,
  };
  dictDataModalVisible.value = true;
}
</script>

<style scoped>
.sys-dict-page {
  min-height: 100%;
}
</style>

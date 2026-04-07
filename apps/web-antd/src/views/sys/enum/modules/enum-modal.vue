<template>
  <Modal
    :title="isEdit ? $t('page.system.enum.editTitle') : $t('page.system.enum.addTitle')"
    v-model:open="visible"
    @ok="handleSubmit"
    :confirm-loading="loading"
    :width="isEdit ? 900 : 600"
  >
    <!-- 枚举定义基本信息 -->
    <Form :model="formData" layout="vertical">
      <Row :gutter="16">
        <Col :span="isEdit ? 12 : 24">
          <FormItem :label="$t('page.system.enum.enumCode')" required>
            <Input v-model:value="formData.enumCode" :disabled="isEdit" />
          </FormItem>
        </Col>
        <Col :span="isEdit ? 12 : 24">
          <FormItem :label="$t('page.system.enum.enumName')" required>
            <Input v-model:value="formData.enumName" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.enum.categoryCode')">
            <Input v-model:value="formData.categoryCode" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.enum.categoryName')">
            <Input v-model:value="formData.categoryName" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.common.status')">
            <RadioGroup v-model:value="formData.isEnabled">
              <Radio :value="1">{{ $t('page.common.enabled') }}</Radio>
              <Radio :value="0">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.enum.sortOrder')">
            <InputNumber v-model:value="formData.sortOrder" :min="0" style="width: 100%" />
          </FormItem>
        </Col>
      </Row>

      <FormItem :label="$t('page.system.enum.enumDesc')">
        <Textarea v-model:value="formData.enumDesc" :rows="2" />
      </FormItem>

      <FormItem :label="$t('page.common.remark')">
        <Textarea v-model:value="formData.remark" :rows="2" />
      </FormItem>
    </Form>

    <!-- 编辑模式下显示枚举值管理 -->
    <div v-if="isEdit" class="enum-item-section">
      <Divider />

      <div class="flex justify-between items-center mb-4">
        <span class="font-medium">{{ $t('page.system.enum.itemConfig') }}</span>
        <Button type="primary" size="small" @click="handleAddItem">+ {{ $t('page.system.enum.addItem') }}</Button>
      </div>

      <Table :dataSource="enumItemList" :columns="itemColumns" size="small" :pagination="false" bordered>
        <template #bodyCell="{ column, record }">
          <!-- 键列 -->
          <template v-if="column.key === 'itemKey'">
            <Input
              v-if="record.isEditing"
              v-model:value="record.editData.itemKey"
              size="small"
              :placeholder="$t('page.system.enum.itemKey')"
            />
            <span v-else>{{ record.itemKey }}</span>
          </template>

          <!-- 值列 -->
          <template v-if="column.key === 'itemValue'">
            <Input
              v-if="record.isEditing"
              v-model:value="record.editData.itemValue"
              size="small"
              :placeholder="$t('page.system.enum.itemValue')"
            />
            <span v-else>{{ record.itemValue }}</span>
          </template>

          <!-- 描述列 -->
          <template v-if="column.key === 'itemDesc'">
            <Input
              v-if="record.isEditing"
              v-model:value="record.editData.itemDesc"
              size="small"
              :placeholder="$t('page.system.enum.itemDesc')"
            />
            <span v-else>{{ record.itemDesc }}</span>
          </template>

          <!-- 排序列 -->
          <template v-if="column.key === 'sortOrder'">
            <InputNumber
              v-if="record.isEditing"
              v-model:value="record.editData.sortOrder"
              size="small"
              :min="0"
              style="width: 60px"
            />
            <span v-else>{{ record.sortOrder }}</span>
          </template>

          <!-- 默认列 -->
          <template v-if="column.key === 'isDefault'">
            <RadioGroup 
              v-if="record.isEditing"
              v-model:value="record.editData.isDefault" 
              size="small"
            >
              <Radio :value="1">{{ $t('page.common.yes') }}</Radio>
              <Radio :value="0">{{ $t('page.common.no') }}</Radio>
            </RadioGroup>
            <Tag v-else :color="record.isDefault === 1 || record.isDefault === '1' ? 'blue' : 'default'">
              {{ record.isDefault === 1 || record.isDefault === '1' ? $t('page.common.yes') : $t('page.common.no') }}
            </Tag>
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'isEnabled'">
            <RadioGroup 
              v-if="record.isEditing"
              v-model:value="record.editData.isEnabled" 
              size="small"
            >
              <Radio :value="1">{{ $t('page.common.enabled') }}</Radio>
              <Radio :value="0">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
            <Tag v-else :color="record.isEnabled === 1 || record.isEnabled === '1' ? 'success' : 'default'">
              {{ record.isEnabled === 1 || record.isEnabled === '1' ? $t('page.common.enabled') : $t('page.common.disabled') }}
            </Tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <div v-if="record.isEditing" class="flex gap-2">
              <Button type="primary" size="small" @click="handleSaveItem(record)">{{ $t('page.common.save') }}</Button>
              <Button size="small" @click="handleCancelEdit(record)">{{ $t('page.common.cancel') }}</Button>
            </div>
            <div v-else class="flex gap-2">
              <Button type="link" size="small" @click="handleEditItem(record)">{{ $t('page.common.edit') }}</Button>
              <Button type="link" danger size="small" @click="handleDeleteItem(record)">{{ $t('page.common.delete') }}</Button>
            </div>
          </template>
        </template>
      </Table>

      <div v-if="enumItemList.length === 0" class="text-center text-gray-400 py-4">
        {{ $t('page.system.enum.noItemData') }}
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Modal, Form, FormItem, Input, InputNumber, RadioGroup, Radio,
  Textarea, Row, Col, Table, Button, Tag, Divider, message
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import {
  addEnumDefine, editEnumDefine,
  getEnumItemList, addEnumItem, editEnumItem, deleteEnumItem
} from '#/api';

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formData = reactive({
  id: undefined as number | undefined,
  enumCode: '',
  enumName: '',
  enumDesc: '',
  categoryCode: '',
  categoryName: '',
  isEnabled: '1',
  sortOrder: 0,
  remark: '',
});

// 枚举值列表
const enumItemList = ref<any[]>([]);

const itemColumns = computed(() => [
  { title: $t('page.system.enum.itemKey'), key: 'itemKey', width: 120 },
  { title: $t('page.system.enum.itemValue'), key: 'itemValue', width: 120 },
  { title: $t('page.system.enum.itemDesc'), key: 'itemDesc', width: 150 },
  { title: $t('page.system.enum.sortOrder'), key: 'sortOrder', width: 80, align: 'center' as const },
  { title: $t('page.system.enum.isDefault'), key: 'isDefault', width: 90, align: 'center' as const },
  { title: $t('page.common.status'), key: 'isEnabled', width: 90, align: 'center' as const },
  { title: $t('page.common.operation'), key: 'action', width: 120, align: 'center' as const },
]);

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const open = async (row?: any) => {
  visible.value = true;
  isEdit.value = !!row;
  enumItemList.value = [];

  if (row) {
    Object.assign(formData, {
      ...row,
      isEnabled: row.isEnabled === '1' || row.isEnabled === 1 ? '1' : '0'
    });
    // 加载枚举值
    await loadEnumItems(row.enumCode);
  } else {
    Object.assign(formData, {
      id: undefined, enumCode: '', enumName: '', enumDesc: '',
      categoryCode: '', categoryName: '', isEnabled: '1', sortOrder: 0, remark: ''
    });
  }
};

const loadEnumItems = async (enumCode: string) => {
  try {
    const res = await getEnumItemList({ enumCode, pageSize: 999 });
    enumItemList.value = (res.rows || []).map((item: any) => ({
      ...item,
      isEditing: false,
      editData: {},
    }));
  } catch (error) {
    console.error($t('page.base.enum.loadEnumValueFail'), error);
  }
};

// 新增枚举值行
const handleAddItem = () => {
  const newRow = {
    id: undefined,
    enumCode: formData.enumCode,
    itemKey: '',
    itemValue: '',
    itemDesc: '',
    sortOrder: enumItemList.value.length,
    isDefault: 0,
    isEnabled: '1',
    isEditing: true,
    isNew: true,
    editData: {
      itemKey: '',
      itemValue: '',
      itemDesc: '',
      sortOrder: enumItemList.value.length,
      isDefault: 0,
      isEnabled: '1',
    },
  };
  enumItemList.value.push(newRow);
};

// 编辑枚举值行
const handleEditItem = (record: any) => {
  record.isEditing = true;
  record.editData = {
    itemKey: record.itemKey,
    itemValue: record.itemValue,
    itemDesc: record.itemDesc,
    sortOrder: record.sortOrder,
    isDefault: record.isDefault,
    isEnabled: record.isEnabled,
  };
};

// 保存枚举值
const handleSaveItem = async (record: any) => {
  const { itemKey, itemValue, itemDesc, sortOrder, isDefault, isEnabled } = record.editData;

  if (!itemKey || !itemValue) {
    message.error($t('page.system.enum.itemKeyValueRequired'));
    return;
  }

  try {
    const data = {
      id: record.id,
      enumCode: formData.enumCode,
      itemKey,
      itemValue,
      itemDesc,
      sortOrder: sortOrder ?? 0,
      isDefault: isDefault ?? 0,
      isEnabled: isEnabled ?? '1',
    };

    if (record.isNew) {
      await addEnumItem(data);
      message.success($t('page.message.addSuccess'));
    } else {
      await editEnumItem(data);
      message.success($t('page.message.editSuccess'));
    }

    record.isEditing = false;
    record.isNew = false;

    // 刷新列表
    await loadEnumItems(formData.enumCode);
  } catch (error) {
    console.error($t('page.message.saveFail'), error);
  }
};

// 取消编辑
const handleCancelEdit = (record: any) => {
  if (record.isNew) {
    const index = enumItemList.value.indexOf(record);
    if (index > -1) {
      enumItemList.value.splice(index, 1);
    }
  } else {
    record.isEditing = false;
    record.editData = {};
  }
};

// 删除枚举值
const handleDeleteItem = async (record: any) => {
  if (record.id) {
    try {
      await deleteEnumItem(String(record.id));
      message.success($t('page.message.deleteSuccess'));
    } catch (error) {
      console.error($t('page.message.deleteFail'), error);
      return;
    }
  }
  const index = enumItemList.value.indexOf(record);
  if (index > -1) {
    enumItemList.value.splice(index, 1);
  }
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const api = isEdit.value ? editEnumDefine : addEnumDefine;
    await api(formData);
    message.success(isEdit.value ? $t('page.message.editSuccess') : $t('page.message.addSuccess'));
    visible.value = false;
    emit('success');
  } finally {
    loading.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped>
.enum-item-section {
  margin-top: 8px;
}
</style>

<template>
  <Modal
    :title="isEdit ? $t('page.system.dict.editTitle') : $t('page.system.dict.addTitle')"
    v-model:open="visible"
    @ok="handleSubmit"
    :confirm-loading="loading"
    :width="isEdit ? 900 : 500"
  >
    <!-- 字典类型基本信息 -->
    <Form :model="formData" layout="vertical">
      <Row :gutter="16">
        <Col :span="isEdit ? 12 : 24">
          <FormItem :label="$t('page.system.dict.dictName')" required>
            <Input v-model:value="formData.dictName" />
          </FormItem>
        </Col>
        <Col :span="isEdit ? 12 : 24">
          <FormItem :label="$t('page.system.dict.dictType')" required>
            <Input v-model:value="formData.dictType" :disabled="isEdit" />
          </FormItem>
        </Col>
      </Row>
      
      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.common.status')">
            <RadioGroup v-model:value="formData.status">
              <Radio value="0">{{ $t('page.common.enabled') }}</Radio>
              <Radio value="1">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.common.remark')">
            <Input v-model:value="formData.remarks" />
          </FormItem>
        </Col>
      </Row>
    </Form>

    <!-- 编辑模式下显示字典数据管理 -->
    <div v-if="isEdit" class="dict-data-section">
      <Divider />
      
      <div class="flex justify-between items-center mb-4">
        <span class="font-medium">{{ $t('page.system.dict.dictDataConfig') }}</span>
        <Button type="primary" size="small" @click="handleAddData">+ {{ $t('page.system.dict.addData') }}</Button>
      </div>

      <Table :dataSource="dictDataList" :columns="dataColumns" size="small" :pagination="false" bordered>
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'dictLabel'">
            <Input
              v-if="record.isEditing"
              v-model:value="record.editData.dictLabel"
              size="small"
              :placeholder="$t('page.system.dict.tagPlaceholder')"
            />
            <span v-else>{{ record.dictLabel }}</span>
          </template>

          <template v-if="column.key === 'dictValue'">
            <Input
              v-if="record.isEditing"
              v-model:value="record.editData.dictValue"
              size="small"
              :placeholder="$t('page.system.dict.valuePlaceholder')"
            />
            <span v-else>{{ record.dictValue }}</span>
          </template>

          <!-- 排序列 -->
          <template v-if="column.key === 'dictSort'">
            <InputNumber 
              v-if="record.isEditing"
              v-model:value="record.editData.dictSort" 
              size="small"
              :min="0"
              style="width: 60px"
            />
            <span v-else>{{ record.dictSort }}</span>
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <Select 
              v-if="record.isEditing"
              v-model:value="record.editData.status" 
              size="small"
              style="width: 70px"
            >
              <SelectOption value="0">{{ $t('page.common.enabled') }}</SelectOption>
              <SelectOption value="1">{{ $t('page.common.disabled') }}</SelectOption>
            </Select>
            <Tag v-else :color="record.status === '0' ? 'success' : 'default'">
              {{ record.status === '0' ? $t('page.common.enabled') : $t('page.common.disabled') }}
            </Tag>
          </template>

          <template v-if="column.key === 'action'">
            <div v-if="record.isEditing" class="flex gap-2">
              <Button type="primary" size="small" @click="handleSaveData(record)">{{ $t('page.common.save') }}</Button>
              <Button size="small" @click="handleCancelEdit(record)">{{ $t('page.common.cancel') }}</Button>
            </div>
            <div v-else class="flex gap-2">
              <Button type="link" size="small" @click="handleEditData(record)">{{ $t('page.common.edit') }}</Button>
              <Button type="link" danger size="small" @click="handleDeleteData(record, index)">{{ $t('page.common.delete') }}</Button>
            </div>
          </template>
        </template>
      </Table>

      <div v-if="dictDataList.length === 0" class="text-center text-gray-400 py-4">
        {{ $t('page.system.dict.noDataClickAdd') }}
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  Modal, Form, FormItem, Input, RadioGroup, Radio, Row, Col, 
  Table, Button, Tag, InputNumber, Select, SelectOption, Divider, message 
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { 
  addDictType, editDictType, 
  getDictDataList, addDictData, editDictData, deleteDictData 
} from '#/api';

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formData = reactive({
  dictId: undefined as number | undefined,
  dictName: '',
  dictType: '',
  status: '0',
  remark: '',
});

// 字典数据列表
const dictDataList = ref<any[]>([]);

const dataColumns = [
  { title: () => $t('page.common.dictLabel'), key: 'dictLabel', width: 150 },
  { title: () => $t('page.common.dictValue'), key: 'dictValue', width: 150 },
  { title: () => $t('page.system.dict.sortOrder'), key: 'dictSort', width: 80, align: 'center' as const },
  { title: () => $t('page.common.status'), key: 'status', width: 90, align: 'center' as const },
  { title: () => $t('page.common.operation'), key: 'action', width: 120, align: 'center' as const },
];

const emit = defineEmits(['success']);

const open = async (row?: any) => {
  visible.value = true;
  isEdit.value = !!row;
  dictDataList.value = [];
  
  if (row) {
    Object.assign(formData, row);
    // 加载字典数据
    await loadDictData(row.dictType);
  } else {
    Object.assign(formData, { dictId: undefined, dictName: '', dictType: '', status: '0', remark: '' });
  }
};

const loadDictData = async (dictType: string) => {
  try {
    const res = await getDictDataList({ dictType, pageSize: 999 });
    dictDataList.value = (res.rows || []).map((item: any) => ({
      ...item,
      isEditing: false,
      editData: {},
    }));
  } catch (error) {
    console.error($t('page.system.dict.loadDataFail'), error);
  }
};

// 新增数据行
const handleAddData = () => {
  const newRow = {
    dictCode: undefined,
    dictType: formData.dictType,
    dictLabel: '',
    dictValue: '',
    dictSort: dictDataList.value.length,
    status: '0',
    isEditing: true,
    isNew: true,
    editData: {
      dictLabel: '',
      dictValue: '',
      dictSort: dictDataList.value.length,
      status: '0',
    },
  };
  dictDataList.value.push(newRow);
};

// 编辑数据行
const handleEditData = (record: any) => {
  record.isEditing = true;
  record.editData = {
    dictLabel: record.dictLabel,
    dictValue: record.dictValue,
    dictSort: record.dictSort,
    status: record.status,
  };
};

// 保存数据行
const handleSaveData = async (record: any) => {
  const { dictLabel, dictValue, dictSort, status } = record.editData;
  
  if (!dictLabel || !dictValue) {
    message.error($t('page.system.dict.tagValueEmpty'));
    return;
  }

  try {
    const data = {
      dictCode: record.dictCode,
      dictType: formData.dictType,
      dictLabel,
      dictValue,
      dictSort: dictSort || 0,
      status: status || '0',
    };

    if (record.isNew) {
      await addDictData(data);
      message.success($t('page.message.addSuccess'));
    } else {
      await editDictData(data);
      message.success($t('page.message.editSuccess'));
    }

    record.isEditing = false;
    record.isNew = false;

    await loadDictData(formData.dictType);
  } catch (error) {
    console.error($t('page.message.saveFail'), error);
  }
};

// 取消编辑
const handleCancelEdit = (record: any) => {
  if (record.isNew) {
    // 如果是新增的行，直接删除
    const index = dictDataList.value.indexOf(record);
    if (index > -1) {
      dictDataList.value.splice(index, 1);
    }
  } else {
    record.isEditing = false;
    record.editData = {};
  }
};

// 删除数据行
const handleDeleteData = async (record: any, index: number) => {
  if (record.dictCode) {
    try {
      await deleteDictData(String(record.dictCode));
      message.success($t('page.message.deleteSuccess'));
    } catch (error) {
      console.error($t('page.message.deleteFail'), error);
      return;
    }
  }
  dictDataList.value.splice(index, 1);
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const api = isEdit.value ? editDictType : addDictType;
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
.dict-data-section {
  margin-top: 8px;
}
</style>

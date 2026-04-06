<template>
  <Modal
    v-model:open="visible"
    title="批量新增字段"
    :confirm-loading="loading"
    width="800px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Alert type="info" show-icon class="mb-4">
      <template #message>
        支持快速添加多个字段，点击"添加一行"可增加字段配置
      </template>
    </Alert>

    <div class="batch-list">
      <div v-for="(item, index) in fieldList" :key="index" class="batch-item">
        <div class="batch-item-header">
          <span class="batch-item-title">字段 {{ index + 1 }}</span>
          <Button type="link" danger size="small" @click="removeField(index)">
            <template #icon><IconifyIcon icon="material-symbols:delete" /></template>
            删除
          </Button>
        </div>

        <Row :gutter="16">
          <Col :span="6">
            <FormItem label="字段编码" required :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Input
                v-model:value="item.columnCode"
                placeholder="字段编码"
                size="small"
              />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="字段名称" required :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Input
                v-model:value="item.columnName"
                placeholder="字段名称"
                size="small"
              />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="字段类型" required :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Select v-model:value="item.fieldType" size="small" placeholder="选择类型">
                <SelectOption value="text">文本</SelectOption>
                <SelectOption value="textarea">多行文本</SelectOption>
                <SelectOption value="number">数字</SelectOption>
                <SelectOption value="select">下拉选择</SelectOption>
                <SelectOption value="switch">开关</SelectOption>
                <SelectOption value="date">日期</SelectOption>
                <SelectOption value="datetime">日期时间</SelectOption>
                <SelectOption value="radio">单选</SelectOption>
                <SelectOption value="checkbox">多选</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="数据类型" required :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Select v-model:value="item.dataType" size="small" placeholder="选择类型">
                <SelectOption value="string">字符串</SelectOption>
                <SelectOption value="int">整数</SelectOption>
                <SelectOption value="decimal">小数</SelectOption>
                <SelectOption value="datetime">日期时间</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="6">
            <FormItem label="必填" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Switch v-model:checked="item.isRequired" :checked-value="1" :un-checked-value="0" size="small" />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="列表显示" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Switch v-model:checked="item.isShowInList" :checked-value="1" :un-checked-value="0" size="small" />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="表单显示" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Switch v-model:checked="item.isShowInForm" :checked-value="1" :un-checked-value="0" size="small" />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="排序" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <InputNumber v-model:value="item.sortOrder" :min="1" size="small" style="width: 100%" />
            </FormItem>
          </Col>
        </Row>
      </div>
    </div>

    <Button type="dashed" block class="add-btn" @click="addField">
      <template #icon><Plus /></template>
      添加一行
    </Button>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Alert,
  Button,
  Col,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  SelectOption,
  Switch,
  message,
} from 'ant-design-vue';
import { Plus } from 'lucide-vue-next';
import { IconifyIcon } from '@vben/icons';
import { batchAddColumnMeta } from '#/api/system/columnMeta';

const props = defineProps<{
  tableId?: number;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const loading = ref(false);

// 单条字段模板
const fieldTemplate = {
  columnCode: '',
  columnName: '',
  fieldType: 'text',
  dataType: 'string',
  isRequired: 0,
  isShowInList: 1,
  isShowInForm: 1,
  sortOrder: 1,
  isEnabled: 1,
};

const fieldList = ref<Record<string, any>[]>([{ ...fieldTemplate, sortOrder: 1 }]);

function addField() {
  fieldList.value.push({
    ...fieldTemplate,
    sortOrder: fieldList.value.length + 1,
  });
}

function removeField(index: number) {
  if (fieldList.value.length <= 1) {
    message.warning('至少保留一个字段');
    return;
  }
  fieldList.value.splice(index, 1);
  // 重新计算排序号
  fieldList.value.forEach((item, idx) => {
    item.sortOrder = idx + 1;
  });
}

async function handleSubmit() {
  if (!props.tableId) {
    message.error('请先选择表');
    return;
  }

  // 校验数据
  for (let i = 0; i < fieldList.value.length; i++) {
    const item = fieldList.value[i];
    if (!item.columnCode?.trim()) {
      message.error(`第 ${i + 1} 行字段编码不能为空`);
      return;
    }
    if (!item.columnName?.trim()) {
      message.error(`第 ${i + 1} 行字段名称不能为空`);
      return;
    }
    // 校验字段编码格式
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.columnCode)) {
      message.error(`第 ${i + 1} 行字段编码格式不正确，必须以字母开头，只能包含字母、数字和下划线`);
      return;
    }
  }

  try {
    loading.value = true;

    const data = fieldList.value.map(item => ({
      ...item,
      tableId: props.tableId,
      columnCode: item.columnCode.trim(),
      columnName: item.columnName.trim(),
    }));

    await batchAddColumnMeta(data);
    message.success('批量新增成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '批量新增失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

// 重置表单
function resetForm() {
  fieldList.value = [{ ...fieldTemplate, sortOrder: 1 }];
}

// 监听 visible 变化
watch(visible, (val) => {
  if (val) {
    resetForm();
  }
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.batch-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.batch-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fafafa;
}

.batch-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.batch-item-title {
  font-weight: 500;
  color: #374151;
}

.add-btn {
  margin-top: 8px;
}

:deep(.ant-form-item) {
  margin-bottom: 8px;
}

:deep(.ant-form-item-label) {
  font-size: 12px;
}
</style>

<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="720px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <FormItem label="字段编码" name="columnCode">
          <Input
            v-model:value="formData.columnCode"
            placeholder="请输入字段编码"
            :disabled="isEdit"
            :maxlength="50"
          />
        </FormItem>
        <FormItem label="字段名称" name="columnName">
          <Input
            v-model:value="formData.columnName"
            placeholder="请输入字段名称"
            :maxlength="100"
          />
        </FormItem>
        <FormItem label="字段类型" name="fieldType">
          <Select v-model:value="formData.fieldType" placeholder="请选择字段类型">
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
        <FormItem label="数据类型" name="dataType">
          <Select v-model:value="formData.dataType" placeholder="请选择数据类型">
            <SelectOption value="string">字符串</SelectOption>
            <SelectOption value="int">整数</SelectOption>
            <SelectOption value="decimal">小数</SelectOption>
            <SelectOption value="datetime">日期时间</SelectOption>
          </Select>
        </FormItem>
      </div>

      <!-- 字典类型（仅select/radio/checkbox时显示） -->
      <FormItem
        v-if="['select', 'radio', 'checkbox'].includes(formData.fieldType)"
        label="字典类型"
      >
        <Input
          v-model:value="formData.dictType"
          placeholder="请输入字典类型编码"
          :maxlength="50"
        />
      </FormItem>

      <!-- 显示设置 -->
      <div class="form-section">
        <div class="section-title">显示设置</div>
        <Row :gutter="16">
          <Col :span="8">
            <FormItem :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" label="必填">
              <Switch v-model:checked="formData.isRequired" :checked-value="1" :un-checked-value="0" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" label="唯一">
              <Switch v-model:checked="formData.isUnique" :checked-value="1" :un-checked-value="0" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" label="状态">
              <Switch v-model:checked="formData.isEnabled" :checked-value="1" :un-checked-value="0" />
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="8">
            <FormItem :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" label="列表显示">
              <Switch v-model:checked="formData.isShowInList" :checked-value="1" :un-checked-value="0" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" label="表单显示">
              <Switch v-model:checked="formData.isShowInForm" :checked-value="1" :un-checked-value="0" />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" label="可排序">
              <Switch v-model:checked="formData.isSortable" :checked-value="1" :un-checked-value="0" />
            </FormItem>
          </Col>
        </Row>
      </div>

      <!-- 布局设置 -->
      <div class="form-section">
        <div class="section-title">布局设置</div>
        <FormItem label="列表列宽">
          <InputNumber
            v-model:value="formData.listWidth"
            :min="50"
            :max="500"
            style="width: 100%"
            placeholder="请输入列表列宽"
          />
        </FormItem>
        <FormItem label="表单列宽">
          <Select v-model:value="formData.formColSpan" placeholder="请选择表单列宽">
            <SelectOption :value="24">整行（24栅格）</SelectOption>
            <SelectOption :value="12">半行（12栅格）</SelectOption>
            <SelectOption :value="8">三分之一（8栅格）</SelectOption>
            <SelectOption :value="6">四分之一（6栅格）</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="排序号" name="sortOrder">
          <InputNumber
            v-model:value="formData.sortOrder"
            :min="1"
            :max="9999"
            style="width: 100%"
            placeholder="请输入排序号"
          />
        </FormItem>
      </div>

      <!-- 默认值与提示 -->
      <div class="form-section">
        <div class="section-title">默认值与提示</div>
        <FormItem label="默认值">
          <Input
            v-model:value="formData.defaultValue"
            placeholder="请输入默认值"
            :maxlength="100"
          />
        </FormItem>
        <FormItem label="占位符">
          <Input
            v-model:value="formData.placeholder"
            placeholder="请输入占位符提示"
            :maxlength="100"
          />
        </FormItem>
      </div>

      <!-- 校验规则 -->
      <div class="form-section">
        <div class="section-title">校验规则（JSON格式）</div>
        <FormItem label="校验规则" :wrapper-col="{ span: 18 }">
          <Textarea
            v-model:value="formData.validRules"
            placeholder='{"pattern": "", "min": 0, "max": 100}'
            :rows="3"
            :maxlength="500"
          />
          <div class="form-hint">
            示例：{"pattern": "^[a-zA-Z0-9]+$", "min": 1, "max": 50}
          </div>
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  SelectOption,
  Switch,
  Textarea,
  Row,
  Col,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';
import {
  addColumnMeta,
  updateColumnMeta,
  getColumnMetaById,
  type ColumnMetaApi,
} from '#/api/system/columnMeta';

const props = defineProps<{
  mode: 'add' | 'edit';
  data?: ColumnMetaApi.ColumnMeta | null;
  tableId?: number;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => props.mode === 'edit');

const modalTitle = computed(() => (isEdit.value ? '编辑字段' : '新增字段'));

const formData = reactive<Record<string, any>>({
  id: undefined,
  tableId: undefined,
  columnCode: '',
  columnName: '',
  fieldType: 'text',
  dataType: 'string',
  dictType: '',
  isRequired: 0,
  isUnique: 0,
  isShowInList: 1,
  isShowInForm: 1,
  isSortable: 0,
  listWidth: 120,
  formColSpan: 24,
  defaultValue: '',
  placeholder: '',
  validRules: '',
  sortOrder: 1,
  isEnabled: 1,
});

const formRules = {
  columnCode: [
    { required: true, message: '请输入字段编码', trigger: 'blur' },
    { max: 50, message: '字段编码最多50个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字段编码必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  columnName: [
    { required: true, message: '请输入字段名称', trigger: 'blur' },
    { max: 100, message: '字段名称最多100个字符', trigger: 'blur' },
  ],
  fieldType: [
    { required: true, message: '请选择字段类型', trigger: 'change' },
  ],
  dataType: [
    { required: true, message: '请选择数据类型', trigger: 'change' },
  ],
  sortOrder: [
    { required: true, message: '请输入排序号', trigger: 'blur' },
  ],
};

async function loadDetail(id: number) {
  try {
    loading.value = true;
    const detail = await getColumnMetaById(id);
    Object.assign(formData, detail);
  } catch (error: any) {
    message.error(error?.message || '加载详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) return;

    // 校验JSON格式
    if (formData.validRules) {
      try {
        JSON.parse(formData.validRules);
      } catch {
        message.error('校验规则JSON格式不正确');
        return;
      }
    }

    loading.value = true;

    const data = {
      ...formData,
      tableId: props.tableId,
    };

    if (isEdit.value) {
      await updateColumnMeta(data);
      message.success('更新成功');
    } else {
      await addColumnMeta(data);
      message.success('新增成功');
    }
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || (isEdit.value ? '更新失败' : '新增失败'));
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: undefined,
    tableId: props.tableId,
    columnCode: '',
    columnName: '',
    fieldType: 'text',
    dataType: 'string',
    dictType: '',
    isRequired: 0,
    isUnique: 0,
    isShowInList: 1,
    isShowInForm: 1,
    isSortable: 0,
    listWidth: 120,
    formColSpan: 24,
    defaultValue: '',
    placeholder: '',
    validRules: '',
    sortOrder: 1,
    isEnabled: 1,
  });
}

// 监听 visible 变化
watch(visible, (val) => {
  if (val) {
    if (isEdit.value && props.data?.id) {
      loadDetail(props.data.id);
    } else {
      resetForm();
    }
  }
});
</script>

<style scoped>
.form-section {
  margin-bottom: 16px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>

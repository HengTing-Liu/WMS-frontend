<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="860px"
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
      <div class="section-title">基础信息</div>
      <FormItem label="表编码" name="tableCode">
        <Input v-model:value="formData.tableCode" disabled />
      </FormItem>
      <FormItem label="字段编码" name="field">
        <Input v-model:value="formData.field" :disabled="isEdit" :maxlength="50" placeholder="如 warehouseCode" />
      </FormItem>
      <FormItem label="字段名称" name="columnName">
        <Input v-model:value="formData.columnName" :disabled="isEdit" :maxlength="100" placeholder="数据库列名，如 warehouse_code（必须小写+下划线）" />
      </FormItem>
      <FormItem label="显示名称" name="title">
        <Input v-model:value="formData.title" :maxlength="100" />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="表单类型" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" name="formType">
            <Select v-model:value="formData.formType">
              <SelectOption value="text">text</SelectOption>
              <SelectOption value="textarea">textarea</SelectOption>
              <SelectOption value="number">number</SelectOption>
              <SelectOption value="select">select</SelectOption>
              <SelectOption value="switch">switch</SelectOption>
              <SelectOption value="date">date</SelectOption>
              <SelectOption value="datetime">datetime</SelectOption>
              <SelectOption value="radio">radio</SelectOption>
              <SelectOption value="checkbox">checkbox</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="数据类型" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" name="dataType">
            <Select v-model:value="formData.dataType">
              <SelectOption value="string">string</SelectOption>
              <SelectOption value="int">int</SelectOption>
              <SelectOption value="decimal">decimal</SelectOption>
              <SelectOption value="date">date</SelectOption>
              <SelectOption value="datetime">datetime</SelectOption>
              <SelectOption value="boolean">boolean</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <FormItem
        v-if="['select', 'radio', 'checkbox'].includes(formData.formType)"
        label="字典类型"
      >
        <Input v-model:value="formData.dictType" :maxlength="100" placeholder="如 sys_yes_no" />
      </FormItem>

      <div class="section-title">显示与布局</div>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="必填" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.required" /></FormItem></Col>
        <Col :span="8"><FormItem label="唯一" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.isUnique" /></FormItem></Col>
        <Col :span="8"><FormItem label="可搜索" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.searchable" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="列表显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInList" /></FormItem></Col>
        <Col :span="8"><FormItem label="表单显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInForm" /></FormItem></Col>
        <Col :span="8"><FormItem label="导出显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInExport" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="可排序" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.sortable" /></FormItem></Col>
        <Col :span="8"><FormItem label="状态" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.status" /></FormItem></Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="列表列宽" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <InputNumber v-model:value="formData.width" :min="50" :max="600" style="width: 100%" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="表单栅格" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Select v-model:value="formData.colSpan">
              <SelectOption :value="24">24</SelectOption>
              <SelectOption :value="12">12</SelectOption>
              <SelectOption :value="8">8</SelectOption>
              <SelectOption :value="6">6</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="排序号" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" name="sortOrder"><InputNumber v-model:value="formData.sortOrder" :min="1" :max="9999" style="width: 100%" /></FormItem></Col>
        <Col :span="12"><FormItem label="分组 Key" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><Input v-model:value="formData.sectionKey" /></FormItem></Col>
      </Row>
      <FormItem label="i18n Key"><Input v-model:value="formData.i18nKey" /></FormItem>

      <div class="section-title">默认值与来源</div>
      <FormItem label="默认值"><Input v-model:value="formData.defaultValue" /></FormItem>
      <FormItem label="占位提示"><Input v-model:value="formData.placeholder" /></FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="数据来源" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Select v-model:value="formData.dataSource">
              <SelectOption value="">(empty)</SelectOption>
              <SelectOption value="dict">dict</SelectOption>
              <SelectOption value="api">api</SelectOption>
              <SelectOption value="static">static</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="API 地址" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Input v-model:value="formData.apiUrl" placeholder="/api/xxx" />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="label 字段" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Input v-model:value="formData.labelField" /></FormItem></Col>
        <Col :span="12"><FormItem label="value 字段" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><Input v-model:value="formData.valueField" /></FormItem></Col>
      </Row>

      <div class="section-title">可视化规则配置</div>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="规则-最小" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><InputNumber v-model:value="ruleBuilder.min" :min="0" style="width: 100%" /></FormItem></Col>
        <Col :span="12"><FormItem label="规则-最大" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><InputNumber v-model:value="ruleBuilder.max" :min="0" style="width: 100%" /></FormItem></Col>
      </Row>
      <FormItem label="规则-正则"><Input v-model:value="ruleBuilder.pattern" placeholder="例如 ^[A-Za-z0-9_]+$" /></FormItem>
      <FormItem label="规则-提示"><Input v-model:value="ruleBuilder.message" /></FormItem>

      <FormItem label="显示条件字段"><Input v-model:value="visibleBuilder.field" placeholder="如 status" /></FormItem>
      <Row :gutter="16">
        <Col :span="8">
          <FormItem label="显示条件操作符" :label-col="{ span: 14 }" :wrapper-col="{ span: 10 }">
            <Select v-model:value="visibleBuilder.operator">
              <SelectOption value="==">==</SelectOption>
              <SelectOption value="!=">!=</SelectOption>
              <SelectOption value=">">&gt;</SelectOption>
              <SelectOption value=">=">&gt;=</SelectOption>
              <SelectOption value="<">&lt;</SelectOption>
              <SelectOption value="<=">&lt;=</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="16">
          <FormItem label="显示条件值" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <Input v-model:value="visibleBuilder.value" />
          </FormItem>
        </Col>
      </Row>

      <FormItem label="联动源字段"><Input v-model:value="linkageBuilder.sourceField" placeholder="如 province" /></FormItem>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="联动目标字段" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Input v-model:value="linkageBuilder.targetField" /></FormItem></Col>
        <Col :span="12"><FormItem label="联动动作" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><Select v-model:value="linkageBuilder.action"><SelectOption value="set">set</SelectOption><SelectOption value="clear">clear</SelectOption><SelectOption value="disable">disable</SelectOption><SelectOption value="enable">enable</SelectOption></Select></FormItem></Col>
      </Row>
      <FormItem label="联动值"><Input v-model:value="linkageBuilder.value" /></FormItem>

      <FormItem label="组件扩展">
        <Row :gutter="16">
          <Col :span="8"><Switch v-model:checked="componentBuilder.allowClear" /> <span class="switch-label">allowClear</span></Col>
          <Col :span="8"><Switch v-model:checked="componentBuilder.multiple" /> <span class="switch-label">multiple</span></Col>
          <Col :span="8"><Switch v-model:checked="componentBuilder.showCount" /> <span class="switch-label">showCount</span></Col>
        </Row>
      </FormItem>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="maxLength" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><InputNumber v-model:value="componentBuilder.maxLength" :min="0" style="width: 100%" /></FormItem></Col>
        <Col :span="12"><FormItem label="rows" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><InputNumber v-model:value="componentBuilder.rows" :min="1" style="width: 100%" /></FormItem></Col>
      </Row>

      <FormItem label="备注"><Input.TextArea v-model:value="formData.remark" :rows="2" /></FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Col,
  Form,
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
import type { FormInstance } from 'ant-design-vue/es/form';

import {
  addColumnMeta,
  getColumnMetaById,
  updateColumnMeta,
  type ColumnMetaApi,
} from '#/api/system/columnMeta';

const props = defineProps<{
  mode: 'add' | 'edit';
  data?: ColumnMetaApi.ColumnMeta | null;
  tableCode?: string;
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
  tableCode: '',
  field: '',
  columnName: '',
  title: '',
  formType: 'text',
  dataType: 'string',
  dictType: '',
  required: 0,
  isUnique: 0,
  searchable: 0,
  showInList: 1,
  showInForm: 1,
  showInExport: 0,
  sortable: 0,
  width: 120,
  colSpan: 24,
  defaultValue: '',
  placeholder: '',
  sortOrder: 1,
  status: 1,
  sectionKey: '',
  i18nKey: '',
  dataSource: '',
  apiUrl: '',
  labelField: '',
  valueField: '',
  rulesJson: '',
  visibleCondition: '',
  linkageJson: '',
  componentProps: '',
  remark: '',
});

const switches = reactive({
  required: false,
  isUnique: false,
  searchable: false,
  showInList: true,
  showInForm: true,
  showInExport: false,
  sortable: false,
  status: true,
});

const ruleBuilder = reactive<{ min?: number; max?: number; pattern?: string; message?: string }>({});
const visibleBuilder = reactive<{ field?: string; operator?: string; value?: string }>({
  operator: '==',
});
const linkageBuilder = reactive<{ sourceField?: string; targetField?: string; action?: string; value?: string }>({
  action: 'set',
});
const componentBuilder = reactive<{ allowClear?: boolean; multiple?: boolean; showCount?: boolean; maxLength?: number; rows?: number }>({
  allowClear: true,
  multiple: false,
  showCount: false,
});

const formRules = {
  field: [
    { required: true, message: '请输入字段编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字段编码格式不正确', trigger: 'blur' },
  ],
  columnName: [
    { required: true, message: '请输入字段名称', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '字段名称必须为小写下划线格式，如 warehouse_code', trigger: 'blur' },
  ],
  title: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  formType: [{ required: true, message: '请选择表单类型', trigger: 'change' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  sortOrder: [{ required: true, message: '请输入排序号', trigger: 'blur' }],
};

function resetBuilders() {
  Object.assign(ruleBuilder, { min: undefined, max: undefined, pattern: '', message: '' });
  Object.assign(visibleBuilder, { field: '', operator: '==', value: '' });
  Object.assign(linkageBuilder, { sourceField: '', targetField: '', action: 'set', value: '' });
  Object.assign(componentBuilder, {
    allowClear: true,
    multiple: false,
    showCount: false,
    maxLength: undefined,
    rows: undefined,
  });
}

function syncSwitchFromForm() {
  switches.required = Number(formData.required || 0) === 1;
  switches.isUnique = Number(formData.isUnique || 0) === 1;
  switches.searchable = Number(formData.searchable || 0) === 1;
  switches.showInList = Number(formData.showInList || 0) === 1;
  switches.showInForm = Number(formData.showInForm || 0) === 1;
  switches.showInExport = Number(formData.showInExport || 0) === 1;
  switches.sortable = Number(formData.sortable || 0) === 1;
  switches.status = Number(formData.status || 0) === 1;
}

function syncFormFromSwitch() {
  formData.required = switches.required ? 1 : 0;
  formData.isUnique = switches.isUnique ? 1 : 0;
  formData.searchable = switches.searchable ? 1 : 0;
  formData.showInList = switches.showInList ? 1 : 0;
  formData.showInForm = switches.showInForm ? 1 : 0;
  formData.showInExport = switches.showInExport ? 1 : 0;
  formData.sortable = switches.sortable ? 1 : 0;
  formData.status = switches.status ? 1 : 0;
}

function parseJsonObject(raw: string | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hydrateBuildersFromForm() {
  resetBuilders();

  const rules = parseJsonObject(formData.rulesJson);
  if (rules && typeof rules === 'object') {
    ruleBuilder.min = rules.min;
    ruleBuilder.max = rules.max;
    ruleBuilder.pattern = rules.pattern;
    ruleBuilder.message = rules.message;
  }

  const visible = parseJsonObject(formData.visibleCondition);
  if (visible && typeof visible === 'object') {
    visibleBuilder.field = visible.field;
    visibleBuilder.operator = visible.operator || '==';
    visibleBuilder.value = visible.value != null ? String(visible.value) : '';
  }

  const linkage = parseJsonObject(formData.linkageJson);
  if (linkage && typeof linkage === 'object') {
    linkageBuilder.sourceField = linkage.sourceField;
    linkageBuilder.targetField = linkage.targetField;
    linkageBuilder.action = linkage.action || 'set';
    linkageBuilder.value = linkage.value != null ? String(linkage.value) : '';
  }

  const comp = parseJsonObject(formData.componentProps);
  if (comp && typeof comp === 'object') {
    componentBuilder.allowClear = !!comp.allowClear;
    componentBuilder.multiple = !!comp.multiple;
    componentBuilder.showCount = !!comp.showCount;
    componentBuilder.maxLength = comp.maxLength;
    componentBuilder.rows = comp.rows;
  }
}

function buildRulesJson() {
  const payload: Record<string, any> = {};
  if (ruleBuilder.min != null) payload.min = ruleBuilder.min;
  if (ruleBuilder.max != null) payload.max = ruleBuilder.max;
  if (ruleBuilder.pattern) payload.pattern = ruleBuilder.pattern;
  if (ruleBuilder.message) payload.message = ruleBuilder.message;
  return Object.keys(payload).length ? JSON.stringify(payload) : '';
}

function buildVisibleConditionJson() {
  if (!visibleBuilder.field) return '';
  return JSON.stringify({
    field: visibleBuilder.field,
    operator: visibleBuilder.operator || '==',
    value: visibleBuilder.value ?? '',
  });
}

function buildLinkageJson() {
  if (!linkageBuilder.sourceField || !linkageBuilder.targetField) return '';
  return JSON.stringify({
    sourceField: linkageBuilder.sourceField,
    targetField: linkageBuilder.targetField,
    action: linkageBuilder.action || 'set',
    value: linkageBuilder.value ?? '',
  });
}

function buildComponentPropsJson() {
  const payload: Record<string, any> = {
    allowClear: !!componentBuilder.allowClear,
    multiple: !!componentBuilder.multiple,
    showCount: !!componentBuilder.showCount,
  };
  if (componentBuilder.maxLength != null) payload.maxLength = componentBuilder.maxLength;
  if (componentBuilder.rows != null) payload.rows = componentBuilder.rows;
  return JSON.stringify(payload);
}

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: undefined,
    tableCode: props.tableCode || '',
    field: '',
    columnName: '',
    title: '',
    formType: 'text',
    dataType: 'string',
    dictType: '',
    required: 0,
    isUnique: 0,
    searchable: 0,
    showInList: 1,
    showInForm: 1,
    showInExport: 0,
    sortable: 0,
    width: 120,
    colSpan: 24,
    defaultValue: '',
    placeholder: '',
    sortOrder: 1,
    status: 1,
    sectionKey: '',
    i18nKey: '',
    dataSource: '',
    apiUrl: '',
    labelField: '',
    valueField: '',
    rulesJson: '',
    visibleCondition: '',
    linkageJson: '',
    componentProps: '',
    remark: '',
  });
  syncSwitchFromForm();
  resetBuilders();
}

async function loadDetail(id: number) {
  try {
    loading.value = true;
    const detail = await getColumnMetaById(id);
    if (!detail) return;
    Object.assign(formData, detail, {
      tableCode: props.tableCode || detail.tableCode,
      colSpan: detail.colSpan ?? detail.formColSpan ?? 24,
    });
    syncSwitchFromForm();
    hydrateBuildersFromForm();
  } catch (error: any) {
    message.error(error?.message || '加载详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    syncFormFromSwitch();
    formData.rulesJson = buildRulesJson();
    formData.visibleCondition = buildVisibleConditionJson();
    formData.linkageJson = buildLinkageJson();
    formData.componentProps = buildComponentPropsJson();

    const payload = {
      ...formData,
      tableCode: props.tableCode || formData.tableCode,
      field: formData.field?.trim(),
      title: formData.title?.trim(),
      dictType: formData.dictType?.trim() || '',
      defaultValue: formData.defaultValue ?? '',
      placeholder: formData.placeholder ?? '',
      sectionKey: formData.sectionKey ?? '',
      i18nKey: formData.i18nKey ?? '',
      dataSource: formData.dataSource ?? '',
      apiUrl: formData.apiUrl ?? '',
      labelField: formData.labelField ?? '',
      valueField: formData.valueField ?? '',
      remark: formData.remark ?? '',
    };

    if (isEdit.value) {
      await updateColumnMeta(payload);
      message.success('更新成功');
    } else {
      await addColumnMeta(payload);
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

watch(visible, (val) => {
  if (!val) return;
  if (isEdit.value && props.data?.id) {
    loadDetail(props.data.id);
  } else {
    resetForm();
  }
});

watch(
  () => props.tableCode,
  (code) => {
    if (!visible.value) {
      formData.tableCode = code || '';
    }
  },
);
</script>

<style scoped>
.section-title {
  font-weight: 600;
  color: #1f2937;
  margin: 8px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}

.switch-label {
  margin-left: 8px;
  color: #4b5563;
  font-size: 12px;
}
</style>

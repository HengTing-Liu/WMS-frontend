<template>
  <Page auto-content-height>
    <div class="lowcode-form-page">
      <Card :bordered="false" class="lowcode-page-hero">
        <div class="hero-row">
          <div class="hero-main">
            <div class="hero-kicker">Lowcode Editor</div>
            <div class="hero-title-row">
              <h1 class="hero-title">{{ pageHeading }}</h1>
              <Tag :color="isEdit ? 'blue' : 'green'">{{ isEdit ? '编辑模式' : '新建模式' }}</Tag>
            </div>
            <p v-if="pageDescription" class="hero-desc">{{ pageDescription }}</p>
            <div class="hero-meta">
              <Tag>表编码: {{ tableCode }}</Tag>
              <Tag>分组: {{ groupCount }}</Tag>
              <Tag>字段: {{ fieldCount }}</Tag>
              <Tag>布局: {{ layoutSummary }}</Tag>
            </div>
          </div>
          <div class="hero-actions">
            <Button @click="handleCancel">取消</Button>
            <Button type="primary" :loading="saving" @click="handleSubmit">保存</Button>
          </div>
        </div>
      </Card>

      <Card v-if="formGroups.length > 0" :bordered="false" class="lowcode-page-nav">
        <div class="nav-header">
          <div class="nav-title">分组导航</div>
          <div class="nav-desc">点击可快速跳到对应分组</div>
        </div>
        <div class="nav-list">
          <Button
            v-for="group in formGroups"
            :key="group.key"
            size="small"
            class="nav-chip"
            @click="scrollToGroup(group.key)"
          >
            {{ group.title }}
          </Button>
        </div>
      </Card>

      <Spin :spinning="loading">
        <div v-if="formGroups.length > 0" class="lowcode-page-content">
          <LowcodeFormSection
            v-for="(group, index) in formGroups"
            :key="group.key"
            :ref="(el: any) => setSectionRef(group.key, el)"
            :section-key="group.key"
            :index="index + 1"
            :title="group.title"
            :type="group.type"
            :field-count="group.fields.length"
            :default-open="group.defaultOpen"
            :schema="groupSchemas[group.key] ?? []"
            :initial-values="formValues"
          />
        </div>
        <Empty v-else description="未配置表单字段" />
      </Spin>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import dayjs from 'dayjs';

import { Page } from '@vben/common-ui';
import { Button, Card, Empty, Spin, Tag, message } from 'ant-design-vue';

import type { VbenFormSchema } from '#/adapter/form';

import {
  createRecord,
  fetchColumnSchema,
  fetchDetail,
  fetchFormGroups,
  fetchTableMeta,
  inferCrudPrefix,
  updateRecord,
} from './api';
import LowcodeFormSection from './LowcodeFormSection.vue';

import type { ColumnMeta, FormGroupMeta, LowcodeFormGroup } from './types';

type LowcodeFormSectionInstance = InstanceType<typeof LowcodeFormSection>;
type VisibleOperator = '!=' | '<' | '<=' | '==' | '>' | '>=';
type VisibleConditionRule = {
  field?: string;
  operator?: VisibleOperator;
  value?: any;
};
type LegacyLinkageRule = {
  action?: 'clear' | 'disable' | 'enable' | 'set';
  sourceField?: string;
  targetField?: string;
  operator?: VisibleOperator;
  conditionValue?: any;
  value?: any;
};
type LinkageActionRule = {
  action?: 'clear' | 'disable' | 'enable' | 'set';
  targetField?: string;
  value?: any;
};
type StructuredLinkageRule = {
  trigger?: {
    field?: string;
    operator?: VisibleOperator;
    value?: any;
  };
  actions?: LinkageActionRule[];
};
type RuntimeLinkageRule = {
  action: 'clear' | 'disable' | 'enable' | 'set';
  targetField: string;
  triggerField: string;
  triggerOperator?: VisibleOperator;
  triggerValue?: any;
  value?: any;
};

type LowcodeFormSchemaPatch = {
  fieldName: string;
  hidden?: boolean;
  disabled?: boolean;
};

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const formGroups = ref<LowcodeFormGroup[]>([]);
const groupSchemas = ref<Record<string, VbenFormSchema[]>>({});
const formValues = ref<Record<string, any>>({});
const currentValues = ref<Record<string, any>>({});
const sectionRefs = ref<Record<string, LowcodeFormSectionInstance | null>>({});
const allFields = ref<ColumnMeta[]>([]);

const tableCode = computed(() => String(route.params.tableCode ?? ''));
const mode = computed(() => String(route.params.mode ?? 'create'));
const recordId = computed(() => route.params.id as string | undefined);
const crudPrefix = computed(() => {
  const fromQuery = route.query.crudPrefix;
  return typeof fromQuery === 'string' && fromQuery ? fromQuery : inferCrudPrefix(tableCode.value);
});
const pageTitle = computed(() => {
  const fromQuery = route.query.title;
  return typeof fromQuery === 'string' && fromQuery ? fromQuery : tableCode.value;
});
const pageDescription = computed(() => {
  const fromQuery = route.query.desc;
  return typeof fromQuery === 'string' ? fromQuery : '';
});
const isEdit = computed(() => mode.value === 'edit' && !!recordId.value);
const pageHeading = computed(() => `${isEdit.value ? '编辑' : '新建'}${pageTitle.value}`);
const groupCount = computed(() => formGroups.value.length);
const fieldCount = computed(() => formGroups.value.reduce((total, group) => total + group.fields.length, 0));
const layoutSummary = computed(() => {
  const types = new Set(formGroups.value.map((group) => group.type));
  return [...types].map((item) => (item === 'collapse' ? 'Collapse' : 'Card')).join(' / ') || 'Card';
});
const runtimeLinkages = computed(() => {
  return allFields.value
    .flatMap((field) => parseLinkageRules(field));
});

function getFieldKey(field: ColumnMeta) {
  return field.code ?? field.field;
}

function isFieldVisibleInForm(field: ColumnMeta) {
  return field.isShowInForm !== 0 && field.isShowInForm !== false;
}

function normalizeGroupTitle(field: ColumnMeta, key: string, groupMeta?: FormGroupMeta) {
  if (groupMeta?.groupTitle) return groupMeta.groupTitle;
  if (field.sectionTitle) return field.sectionTitle;
  const titleMap: Record<string, string> = {
    application: '应用信息',
    basic: '基本信息',
    basicInfo: '基本信息',
    category: '分类信息',
    other: '其他信息',
  };
  return titleMap[key] ?? key;
}

function normalizeGroupType(field: ColumnMeta, groupMeta?: FormGroupMeta): 'card' | 'collapse' {
  const value = String(groupMeta?.groupType ?? field.sectionType ?? 'card').toLowerCase();
  return value === 'collapse' ? 'collapse' : 'card';
}

function normalizeGroupOpen(field: ColumnMeta, groupMeta?: FormGroupMeta) {
  const value = groupMeta?.defaultOpen ?? field.sectionOpen;
  if (typeof value === 'boolean') return value;
  if (Number(value ?? 1) === 0) return false;
  return true;
}

function normalizeGroupOrder(field: ColumnMeta, groupMeta?: FormGroupMeta) {
  return Number(groupMeta?.sortOrder ?? field.sectionOrder ?? field.sortOrder ?? 0);
}

function buildGroups(fields: ColumnMeta[], groupMetas: FormGroupMeta[] = []) {
  const groupMap = new Map<string, LowcodeFormGroup>();
  const groupMetaMap = new Map(
    groupMetas
      .filter((item) => item.groupCode && Number(item.status ?? 1) === 1)
      .map((item) => [item.groupCode, item] as const),
  );
  const sortedFields = [...fields]
    .filter((field) => isFieldVisibleInForm(field))
    .sort((left, right) => Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0));

  for (const field of sortedFields) {
    const groupKey = field.sectionKey || 'basic';
    const groupMeta = groupMetaMap.get(groupKey);
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        key: groupKey,
        title: normalizeGroupTitle(field, groupKey, groupMeta),
        order: normalizeGroupOrder(field, groupMeta),
        type: normalizeGroupType(field, groupMeta),
        defaultOpen: normalizeGroupOpen(field, groupMeta),
        fields: [],
      });
    }
    groupMap.get(groupKey)?.fields.push(field);
  }

  return [...groupMap.values()].sort((left, right) => left.order - right.order);
}

function normalizeOptions(field: ColumnMeta) {
  const options = field.options ?? field.dataSource ?? [];
  if (!Array.isArray(options)) return [];
  return options.map((option: any) => ({
    label: option?.label ?? option?.name ?? String(option?.value ?? option?.id ?? ''),
    value: option?.value ?? option?.id ?? option?.code ?? option?.label,
  }));
}

function isNumberField(field: ColumnMeta) {
  const formType = String(field.formType ?? '').toLowerCase();
  const dataType = String(field.dataType ?? '').toLowerCase();
  return ['inputnumber', 'number'].includes(formType)
    || ['bigdecimal', 'double', 'float', 'int', 'integer', 'long', 'number'].includes(dataType);
}

function isDateField(field: ColumnMeta) {
  const formType = String(field.formType ?? '').toLowerCase();
  const dataType = String(field.dataType ?? '').toLowerCase();
  return ['date', 'datetime'].includes(formType) || ['date', 'datetime', 'timestamp'].includes(dataType);
}

function isSwitchField(field: ColumnMeta) {
  const formType = String(field.formType ?? '').toLowerCase();
  const code = String(field.code ?? field.field ?? '').toLowerCase();
  return formType === 'switch' || formType === 'boolean' || code === 'isenabled' || code === 'is_enabled';
}

function normalizeChangeValue(raw: any) {
  if (raw && typeof raw === 'object' && 'target' in raw) {
    return raw.target?.checked ?? raw.target?.value;
  }
  return raw;
}

function parseJsonObject<T = Record<string, any>>(raw?: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseVisibleCondition(field: ColumnMeta) {
  return parseJsonObject<VisibleConditionRule>(field.visibleCondition);
}

function parseLinkageRules(field: ColumnMeta): RuntimeLinkageRule[] {
  const raw = parseJsonObject<LegacyLinkageRule | StructuredLinkageRule>(field.linkageJson);
  if (!raw || typeof raw !== 'object') return [];

  const normalizeRule = (
    triggerField?: string,
    action?: LinkageActionRule['action'],
    targetField?: string,
    value?: any,
    triggerOperator?: VisibleOperator,
    triggerValue?: any,
  ): RuntimeLinkageRule | null => {
    if (!triggerField || !action || !targetField) return null;
    return {
      action,
      targetField,
      triggerField,
      triggerOperator,
      triggerValue,
      value,
    };
  };

  if ('trigger' in raw || 'actions' in raw) {
    const triggerField = raw.trigger?.field;
    const triggerOperator = raw.trigger?.operator;
    const triggerValue = raw.trigger?.value;
    return (raw.actions ?? [])
      .map((actionItem) =>
        normalizeRule(
          triggerField,
          actionItem.action,
          actionItem.targetField,
          actionItem.value,
          triggerOperator,
          triggerValue,
        ),
      )
      .filter((item): item is RuntimeLinkageRule => !!item);
  }

  const legacy = raw as LegacyLinkageRule;
  const rule = normalizeRule(
    legacy.sourceField,
    legacy.action,
    legacy.targetField || getFieldKey(field),
    legacy.value,
    legacy.operator,
    legacy.conditionValue,
  );
  return rule ? [rule] : [];
}

function normalizeCompareValue(value: any) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '1') return 1;
  if (value === '0') return 0;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

function compareValues(left: any, operator: VisibleOperator, right: any) {
  const normalizedLeft = normalizeCompareValue(left);
  const normalizedRight = normalizeCompareValue(right);
  switch (operator) {
    case '!=':
      return normalizedLeft !== normalizedRight;
    case '<':
      return normalizedLeft < normalizedRight;
    case '<=':
      return normalizedLeft <= normalizedRight;
    case '>':
      return normalizedLeft > normalizedRight;
    case '>=':
      return normalizedLeft >= normalizedRight;
    case '==':
    default:
      return normalizedLeft === normalizedRight;
  }
}

function hasMeaningfulValue(value: any) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function isLinkageRuleActive(rule: RuntimeLinkageRule, values: Record<string, any>) {
  const triggerValue = values[rule.triggerField];
  if (rule.triggerOperator) {
    return compareValues(triggerValue, rule.triggerOperator, rule.triggerValue);
  }
  return hasMeaningfulValue(triggerValue);
}

function evaluateFieldVisibility(field: ColumnMeta, values: Record<string, any>) {
  const rule = parseVisibleCondition(field);
  if (!rule?.field) return true;
  return compareValues(values[rule.field], rule.operator ?? '==', rule.value);
}

function computeFieldDisabled(fieldName: string, values: Record<string, any>) {
  let disabled = false;
  for (const rule of runtimeLinkages.value) {
    if (rule.targetField !== fieldName) continue;
    const active = isLinkageRuleActive(rule, values);
    if (rule.action === 'disable') {
      disabled = active;
    }
    if (rule.action === 'enable') {
      disabled = !active;
    }
  }
  return disabled;
}

function applyLinkageValues(values: Record<string, any>) {
  const nextValues = { ...values };
  const maxLoop = Math.max(runtimeLinkages.value.length, 1);
  for (let index = 0; index < maxLoop; index += 1) {
    let changed = false;
    for (const rule of runtimeLinkages.value) {
      const active = isLinkageRuleActive(rule, nextValues);
      if (!active) continue;
      if (rule.action === 'set' && nextValues[rule.targetField] !== rule.value) {
        nextValues[rule.targetField] = rule.value;
        changed = true;
      }
      if (rule.action === 'clear' && hasMeaningfulValue(nextValues[rule.targetField])) {
        nextValues[rule.targetField] = undefined;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return nextValues;
}

async function syncRuntimeState(values: Record<string, any>) {
  let resolvedValues = applyLinkageValues(values);

  for (const field of allFields.value) {
    const fieldKey = getFieldKey(field);
    if (!evaluateFieldVisibility(field, resolvedValues) && hasMeaningfulValue(resolvedValues[fieldKey])) {
      resolvedValues[fieldKey] = undefined;
    }
  }

  resolvedValues = applyLinkageValues(resolvedValues);

  currentValues.value = { ...resolvedValues };

  for (const group of formGroups.value) {
    const groupKey = group.key;
    const sectionRef = sectionRefs.value[groupKey];
    if (!sectionRef) continue;

    const schemaPatches: LowcodeFormSchemaPatch[] = group.fields.map((field) => ({
      fieldName: getFieldKey(field),
      hidden: !evaluateFieldVisibility(field, resolvedValues),
      disabled: computeFieldDisabled(getFieldKey(field), resolvedValues),
    }));

    await sectionRef.updateSchema(schemaPatches as Partial<VbenFormSchema>[]);

    const groupValuePayload = group.fields.reduce<Record<string, any>>((result, field) => {
      const fieldKey = getFieldKey(field);
      if (Object.prototype.hasOwnProperty.call(resolvedValues, fieldKey)) {
        result[fieldKey] = resolvedValues[fieldKey];
      }
      return result;
    }, {});

    if (Object.keys(groupValuePayload).length > 0) {
      await sectionRef.setValues(groupValuePayload);
    }
  }
}

async function handleFieldValueChange(field: ColumnMeta, rawValue: any) {
  const fieldKey = getFieldKey(field);
  const nextValues = {
    ...currentValues.value,
    [fieldKey]: normalizeChangeValue(rawValue),
  };
  await syncRuntimeState(nextValues);
}

function resolveComponent(field: ColumnMeta): VbenFormSchema['component'] {
  const formType = String(field.formType ?? '').toLowerCase();
  if (isSwitchField(field)) return 'Switch';
  if (formType === 'select') return 'Select';
  if (formType === 'treeselect') return 'TreeSelect';
  if (formType === 'textarea') return 'Textarea';
  if (isDateField(field)) return 'DatePicker';
  if (isNumberField(field)) return 'InputNumber';
  return 'Input';
}

function resolvePlaceholder(field: ColumnMeta, component: string) {
  if (field.placeholder) return field.placeholder;
  if (component === 'Select' || component === 'TreeSelect') return `请选择${field.title ?? field.label ?? field.field}`;
  return `请输入${field.title ?? field.label ?? field.field}`;
}

function resolveSpanClass(field: ColumnMeta) {
  const span = Number(field.colSpan ?? 24);
  if (span >= 24) return 'col-span-1 md:col-span-2 xl:col-span-4';
  if (span >= 12) return 'col-span-1 md:col-span-2 xl:col-span-2';
  return 'col-span-1';
}

function buildFieldSchema(field: ColumnMeta, values: Record<string, any>): VbenFormSchema {
  const component = resolveComponent(field);
  const options = normalizeOptions(field);
  const fieldKey = getFieldKey(field);
  const schema: VbenFormSchema = {
    component,
    componentProps: {
      allowClear: true,
      class: 'w-full',
      onChange: async (value: any) => {
        await handleFieldValueChange(field, value);
      },
      placeholder: resolvePlaceholder(field, String(component)),
    },
    defaultValue: parseDefaultValue(field),
    disabled: computeFieldDisabled(fieldKey, values),
    fieldName: fieldKey,
    formItemClass: resolveSpanClass(field),
    hidden: !evaluateFieldVisibility(field, values),
    label: field.title ?? field.label ?? field.field,
    rules: field.isRequired
      ? component === 'Select' || component === 'TreeSelect'
        ? 'selectRequired'
        : 'required'
      : undefined,
  } as VbenFormSchema & { hidden?: boolean };

  if (component === 'Select') {
    schema.componentProps = {
      ...schema.componentProps,
      filterOption: true,
      options,
      showSearch: true,
    };
  }

  if (component === 'TreeSelect') {
    schema.componentProps = {
      ...schema.componentProps,
      allowClear: true,
      showSearch: true,
      treeData: options.map((option) => ({
        title: option.label,
        value: option.value,
      })),
      treeNodeFilterProp: 'title',
    };
  }

  if (component === 'Textarea') {
    schema.componentProps = {
      ...schema.componentProps,
      rows: 3,
    };
  }

  if (component === 'InputNumber') {
    schema.componentProps = {
      ...schema.componentProps,
      precision: String(field.dataType ?? '').toLowerCase().includes('decimal') ? 2 : 0,
    };
  }

  if (component === 'Switch') {
    schema.componentProps = {
      ...schema.componentProps,
      checkedChildren: '启用',
      checkedValue: 1,
      unCheckedChildren: '停用',
      unCheckedValue: 0,
    };
  }

  if (component === 'DatePicker') {
    schema.componentProps = {
      ...schema.componentProps,
      format: String(field.formType ?? '').toLowerCase() === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD',
      showTime: String(field.formType ?? '').toLowerCase() === 'datetime',
      valueFormat: undefined,
    };
  }

  return schema;
}

function parseDefaultValue(field: ColumnMeta) {
  const raw = field.defaultValue;
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (isSwitchField(field)) {
    if (raw === 'true') return 1;
    if (raw === 'false') return 0;
  }
  if (isNumberField(field)) {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? raw : parsed;
  }
  if (isDateField(field)) {
    const parsed = dayjs(raw);
    return parsed.isValid() ? parsed : raw;
  }
  return raw;
}

function buildSchemas(groups: LowcodeFormGroup[], values: Record<string, any>) {
  return groups.reduce<Record<string, VbenFormSchema[]>>((result, group) => {
    result[group.key] = group.fields.map((field) => buildFieldSchema(field, values));
    return result;
  }, {});
}

function pickRecordField(record: Record<string, any>, key: string) {
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  const snakeKey = key.replace(/[A-Z]/g, (matched) => `_${matched.toLowerCase()}`);
  if (Object.prototype.hasOwnProperty.call(record, snakeKey)) return record[snakeKey];
  const camelKey = key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
  if (Object.prototype.hasOwnProperty.call(record, camelKey)) return record[camelKey];
  return undefined;
}

function normalizeRecordValue(field: ColumnMeta, value: any) {
  if (value === undefined || value === null || value === '') return value;
  if (isSwitchField(field) && typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (isNumberField(field) && typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (isDateField(field) && typeof value === 'string') {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : value;
  }
  return value;
}

function buildInitialValues(fields: ColumnMeta[], record: Record<string, any>) {
  const values: Record<string, any> = {};
  for (const field of fields) {
    const key = getFieldKey(field);
    const raw = pickRecordField(record, key);
    if (raw !== undefined) {
      values[key] = normalizeRecordValue(field, raw);
    } else {
      const defaultValue = parseDefaultValue(field);
      if (defaultValue !== undefined) {
        values[key] = defaultValue;
      }
    }
  }
  return values;
}

function serializeFieldValue(field: ColumnMeta, value: any) {
  if (value === undefined) return value;
  if (dayjs.isDayjs(value)) {
    return isDateField(field) && String(field.formType ?? '').toLowerCase() === 'datetime'
      ? value.format('YYYY-MM-DD HH:mm:ss')
      : value.format('YYYY-MM-DD');
  }
  if (isSwitchField(field) && typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
}

function buildSubmitPayload(fields: ColumnMeta[], values: Record<string, any>) {
  const payload: Record<string, any> = {};
  for (const field of fields) {
    const key = getFieldKey(field);
    payload[key] = serializeFieldValue(field, values[key]);
  }
  return payload;
}

function setSectionRef(key: string, instance: LowcodeFormSectionInstance | null) {
  if (instance) {
    sectionRefs.value[key] = instance;
  } else {
    delete sectionRefs.value[key];
  }
}

function scrollToGroup(key: string) {
  const element = document.getElementById(`lowcode-group-${key}`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function appendRefreshFlag(path: string) {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  params.set('_lcRefresh', String(Date.now()));
  const queryString = params.toString();
  const resolvedPath = pathname || '/';
  return queryString ? `${resolvedPath}?${queryString}` : resolvedPath;
}

async function goBack() {
  const from = route.query.from;
  if (typeof from === 'string' && from) {
    await router.push(appendRefreshFlag(from));
    return;
  }
  router.back();
}

async function loadPage() {
  if (!tableCode.value) return;
  loading.value = true;
  try {
    const [columns, tableMeta, groupMetas] = await Promise.all([
      fetchColumnSchema(tableCode.value),
      fetchTableMeta(tableCode.value),
      fetchFormGroups(tableCode.value),
    ]);

    if (!pageDescription.value && tableMeta?.tableName) {
      // 预留描述扩展位，后续可接 remark 等信息
    }

    const groups = buildGroups(columns, groupMetas);
    formGroups.value = groups;
    allFields.value = groups.flatMap((group) => group.fields);

    const detail = isEdit.value && recordId.value
      ? await fetchDetail({
        id: recordId.value,
        prefix: crudPrefix.value,
        tableCode: tableCode.value,
      })
      : {};

    const initialValues = buildInitialValues(allFields.value, detail);
    formValues.value = initialValues;
    currentValues.value = applyLinkageValues(initialValues);
    groupSchemas.value = buildSchemas(groups, currentValues.value);

    await nextTick();
    await syncRuntimeState(currentValues.value);
  } catch (error: any) {
    message.error(error?.message ?? '加载低代码表单失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (saving.value) return;
  saving.value = true;
  try {
    const mergedValues: Record<string, any> = {};
    for (const group of formGroups.value) {
      const formRef = sectionRefs.value[group.key];
      if (!formRef) continue;
      const result = await formRef.validate();
      Object.assign(mergedValues, result?.values ?? result ?? {});
    }

    const resolvedValues = applyLinkageValues({
      ...currentValues.value,
      ...mergedValues,
    });

    const payload = buildSubmitPayload(allFields.value, resolvedValues);

    if (isEdit.value && recordId.value) {
      await updateRecord({
        data: payload,
        id: recordId.value,
        prefix: crudPrefix.value,
        tableCode: tableCode.value,
      });
      message.success('保存成功');
    } else {
      await createRecord({
        data: payload,
        prefix: crudPrefix.value,
        tableCode: tableCode.value,
      });
      message.success('新建成功');
    }

    await goBack();
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error(error?.message ?? '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  void goBack();
}

void loadPage();
</script>

<style scoped>
.lowcode-form-page {
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgb(239 246 255 / 0.9), transparent 30%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  min-height: calc(100vh - 120px);
}

.lowcode-page-hero,
.lowcode-page-nav {
  margin-bottom: 16px;
  border-radius: 20px;
}

.lowcode-page-hero :deep(.ant-card-body),
.lowcode-page-nav :deep(.ant-card-body) {
  padding: 20px 24px;
}

.hero-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.hero-main {
  min-width: 0;
}

.hero-kicker {
  margin-bottom: 8px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.hero-title {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}

.hero-desc {
  margin: 10px 0 0;
  max-width: 780px;
  color: #475569;
  font-size: 14px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.hero-actions {
  position: sticky;
  top: 16px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nav-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 12px;
}

.nav-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
}

.nav-desc {
  color: #64748b;
  font-size: 13px;
}

.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nav-chip {
  border-radius: 999px;
}

.lowcode-page-content {
  display: grid;
  gap: 16px;
}

@media (max-width: 768px) {
  .lowcode-form-page {
    padding: 12px;
  }

  .lowcode-page-hero :deep(.ant-card-body),
  .lowcode-page-nav :deep(.ant-card-body) {
    padding: 16px;
  }

  .hero-row {
    flex-direction: column;
  }

  .hero-actions {
    position: static;
    width: 100%;
  }

  .hero-actions :deep(.ant-btn) {
    flex: 1;
  }

  .hero-title {
    font-size: 24px;
  }
}
</style>






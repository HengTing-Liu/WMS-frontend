<!--
  通用「后端 schema 驱动」表单容器：传入 fetchDefinition（拉取表单定义）即可渲染。
  用法示例见：views/basicArchive/productCategory/index.vue（Drawer 内嵌）或 formDefinition.vue（整页）。
-->
<template>
  <div class="df-page bg-white">
    <div class="df-header">
      <div class="df-lang">
        <span class="df-lang__label">语言：</span>
        <Select v-model:value="currentLang" class="df-lang__select" :options="langOptions" @change="reload" />
      </div>
      <slot name="header-extra" />
    </div>
    <Spin :spinning="loading">
      <Form
        ref="formRef"
        :model="formModel"
        :disabled="readonly"
        layout="vertical"
        class="df-form"
      >
        <template v-for="section in sections" :key="section.key">
          <div class="df-section">
            <div class="df-section__title">{{ section.title }}</div>
            <Row :gutter="16">
              <template v-for="field in section.fields" :key="field.path">
                <!-- 表格：不能放在带 name 的 Form.Item 里（内部多个 Input 会触发 ant-design-vue 警告与异常） -->
                <Col
                  v-if="field.type === 'table'"
                  :xs="getColProps(field).xs"
                  :sm="getColProps(field).sm"
                  :md="getColProps(field).md"
                  :lg="getColProps(field).lg"
                  :xl="getColProps(field).xl"
                  :xxl="getColProps(field).xxl"
                >
                  <Form.Item :label="field.label" class="df-item">
                    <div class="df-table">
                      <div class="df-table__rows">
                        <div v-if="!readonly" class="df-table__add">
                          <Button type="link" @click="addTableRow(field)">
                            + 添加
                          </Button>
                        </div>
                        <div v-for="row in getTableRows(field.path)" :key="row._rowKey" class="df-table__row">
                          <div v-for="col in field.tableColumns || []" :key="col.key" class="df-table__cell">
                            <div class="df-table__cell-label">{{ col.title }}</div>
                            <Input v-if="col.__type === 'text'" :value="row[col.key]" :disabled="readonly"
                              @update:value="(val) => updateTableCell(field.path, row._rowKey, col.key, val)" />
                            <Input.TextArea v-else-if="col.__type === 'textarea'" :value="row[col.key]"
                              :auto-size="{ minRows: 1, maxRows: 3 }" :disabled="readonly"
                              @update:value="(val) => updateTableCell(field.path, row._rowKey, col.key, val)" />
                            <div v-else-if="col.__type === 'select'">
                              <Select :value="row[col.key] != null ? String(row[col.key]) : undefined"
                                :disabled="readonly"
                                :options="toVbenOptions(getTableSelectOptions(field.path, col), row[col.key])"
                                placeholder="请选择" showSearch
                                @dropdownVisibleChange="(open: boolean) => open && !readonly && ensureTableColumnOptions(field.path, col)"
                                option-filter-prop="label" :filter-option="(input: string, option: any) => {
                                  const label = option?.label != null ? String(option.label) : '';
                                  return label.toLowerCase().includes(input.toLowerCase());
                                }"
                                @change="(val: any) => updateTableCell(field.path, row._rowKey, col.key, val === EMPTY_SELECT_VALUE ? undefined : val)" />
                            </div>
                            <InputNumber v-else-if="col.__type === 'number'" :value="row[col.key]" class="w-full"
                              :disabled="readonly"
                              @update:value="(val) => updateTableCell(field.path, row._rowKey, col.key, val)" />
                            <Input v-else :value="row[col.key]" :disabled="readonly"
                              @update:value="(val) => updateTableCell(field.path, row._rowKey, col.key, val)" />
                          </div>
                          <Button v-if="!readonly" class="df-table__remove" type="link" danger
                            @click="removeTableRow(field.path, row._rowKey)">
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Form.Item>
                </Col>
                <Col
                  v-else
                  :xs="getColProps(field).xs"
                  :sm="getColProps(field).sm"
                  :md="getColProps(field).md"
                  :lg="getColProps(field).lg"
                  :xl="getColProps(field).xl"
                  :xxl="getColProps(field).xxl"
                >
                  <Form.Item :label="field.label" :name="formItemName(field.path)" :rules="getFieldRules(field)"
                    class="df-item">
                    <Input v-if="field.type === 'text'" :value="getValue(field.path)" :disabled="readonly"
                      placeholder="请输入" @update:value="setValue(field.path, $event)" />
                    <InputNumber v-else-if="field.type === 'number'" :value="getValue(field.path)" class="w-full"
                      :disabled="readonly" @update:value="setValue(field.path, $event)" />
                    <div v-else-if="field.type === 'select'">
                      <Select :key="selectControlKey(field)"
                        :value="getValue(field.path) != null ? String(getValue(field.path)) : undefined"
                        :open="sbuSelectOpenBinding(field)" :disabled="readonly || isSbuDisabled(field)"
                        :loading="isSbuSelectLoading(field)"
                        :not-found-content="isSbuSelectLoading(field) ? '加载中…' : undefined"
                        :options="selectOptionsForTemplate(field, getValue(field.path))" placeholder="请选择" showSearch
                        @dropdown-visible-change="onSelectDropdownVisibleChange(field, $event)"
                        option-filter-prop="label" :filter-option="(input: string, option: any) => {
                          const label = option?.label != null ? String(option.label) : '';
                          return label.toLowerCase().includes(input.toLowerCase());
                        }"
                        @change="(val: any) => setValue(field.path, val === EMPTY_SELECT_VALUE ? undefined : val)" />
                    </div>
                    <TreeSelect v-else-if="field.type === 'treeSelect'" class="df-tree-select w-full"
                      :value="getTreeSelectDisplayValue(field.path)" :tree-data="getTreeSelectTreeData(field.path)"
                      :loading="isTreeSelectLoading(field.path)" :disabled="readonly" multiple tree-checkable
                      allow-clear show-search tree-node-filter-prop="title" placeholder="请选择（可多选）" :max-tag-count="3"
                      :dropdown-match-select-width="false" popup-class-name="df-tree-select-dropdown"
                      :dropdown-style="{ minWidth: '420px', maxHeight: '360px', overflow: 'auto' }"
                      :get-popup-container="treeSelectGetPopupContainer"
                      @dropdown-visible-change="(open: boolean) => open && !readonly && ensureTreeSelectOptions(field)"
                      @update:value="(val: any) => setTreeSelectModelValue(field.path, val)" />
                    <Input.TextArea v-else-if="field.type === 'textarea'" :value="getValue(field.path)"
                      :disabled="readonly" :rows="3" @update:value="setValue(field.path, $event)" />
                    <Input v-else :value="getValue(field.path)" :disabled="readonly"
                      @update:value="setValue(field.path, $event)" />
                  </Form.Item>
                </Col>
              </template>
            </Row>
          </div>
        </template>
      </Form>
    </Spin>
    <div class="df-footer">
      <template v-if="!readonly">
        <Button class="df-footer__save" type="primary" :loading="saving" :disabled="saving" @click="handleSave">
          保存
        </Button>
        <Button class="df-footer__cancel" :disabled="saving" @click="handleCancel">
          取消
        </Button>
      </template>
      <Button v-else class="df-footer__cancel" @click="handleCancel">
        关闭
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  TreeSelect,
  message,
} from 'ant-design-vue';
import { requestClient } from '../api/request';
type Option = { label: string; value: string | number };
const EMPTY_SELECT_VALUE = '__EMPTY_SELECT__';

/**
 * 与通用下拉接口约定一致：接口返回 value=后端要的提交值、label=展示文案。
 * 映射为组件内 Option：label 展示、value 提交（即 label: 接口.label，value: 接口.value）。
 */
function mapCatalogApiOptionPair(o: any): Option | null {
  if (!o || typeof o !== 'object') return null;
  const hasV = o.value !== undefined && o.value !== null;
  const hasL = o.label !== undefined && o.label !== null;
  if (hasV && hasL) {
    return { label: String(o.label), value: String(o.value) };
  }
  return null;
}

function mapSchemaOptionsList(raw: any[] | undefined): Option[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((o: any) => {
    const paired = mapCatalogApiOptionPair(o);
    if (paired) return paired;
    const value = o?.value ?? o?.id ?? o?.code ?? o?.key ?? o?.name;
    const label = o?.label ?? o?.name ?? o?.title ?? String(value ?? '');
    return { label: String(label), value: String(value ?? '') };
  });
}

function toNamePath(path: string): (string | number)[] {
  return String(path)
    .split('.')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

/** antd Form.Item：name 不能为空数组，否则报错 please transfer a valid name path */
function formItemName(path: string): (string | number)[] | undefined {
  const p = toNamePath(path);
  return p.length ? p : undefined;
}

type Definition = Record<string, any>;

/** 是否为「表单区块」：含 fields / items / fieldList 等之一且为数组 */
function isFormSection(sec: any): boolean {
  if (!sec || typeof sec !== 'object' || Array.isArray(sec)) return false;
  const list = sec.fields ?? sec.items ?? sec.fieldList ?? sec.list ?? sec.children;
  return Array.isArray(list);
}

function getSectionRows(section: any): any[] {
  if (!section || typeof section !== 'object') return [];
  const list = section.fields ?? section.items ?? section.fieldList ?? section.list ?? section.children;
  return Array.isArray(list) ? list : [];
}

/**
 * 剥掉 axios / 网关多层 { data }，直到出现 languageList 或带 fields 的区块。
 */
function unwrapDefinitionRoot(raw: any): any {
  let cur = raw;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const looks =
      Array.isArray((cur as any).languageList) ||
      Object.keys(cur).some((k) => k !== 'languageList' && isFormSection((cur as any)[k]));
    if (looks) return cur;
    const inner = (cur as any).data;
    if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
      cur = inner;
      continue;
    }
    break;
  }
  return cur;
}

/** 表格：接口可能是 [] 或 { applicationList: [...] } */
function coerceToRowsArray(val: any): any[] | null {
  if (val == null) return null;
  // 兼容：后端可能把表格的行数据以 JSON 字符串返回，例如 "[{\"application\":\"WB\"}]"
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed = JSON.parse(s);
        return coerceToRowsArray(parsed);
      } catch {
        // 忽略 JSON.parse 失败，回落到后续处理
      }
    }
  }
  if (Array.isArray(val)) return val;
  if (typeof val === 'object' && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.length === 1 && Array.isArray((val as Record<string, any>)[keys[0]!])) {
      return (val as Record<string, any>)[keys[0]!];
    }
  }
  return null;
}

/**
 * 详情/编辑：各区块对象上除 fields 外同级 key 为实际值（如 basicInfo.productNo），先写入 formModel。
 */
function mergeSectionPayloadIntoFormModel(root: any) {
  if (!root || typeof root !== 'object') return;
  for (const sectionKey of Object.keys(root)) {
    if (!isFormSection(root[sectionKey])) continue;
    const sec = root[sectionKey] as Record<string, any>;
    const schemaRows = getSectionRows(sec);
    for (let idx = 0; idx < schemaRows.length; idx++) {
      const fr = schemaRows[idx];
      const labelSrc = fr?.fieldName ?? fr?.fieldCode ?? fr?.label;
      const codeSafe = sanitizeFieldCode(
        fr?.fieldCode ?? fr?.code ?? fr?.key ?? fr?.name,
        typeof labelSrc === 'string' && labelSrc ? String(labelSrc) : `missing_${idx}`,
      );
      const rawCode = fr?.fieldCode ?? fr?.code;
      const inferredType =
        Array.isArray(fr?.columns) && fr.columns.length ? 'table' : fr?.fieldType;
      const ftype = mapType(inferredType);

      if (ftype === 'table') {
        let v =
          rawCode != null && rawCode !== '' && Object.prototype.hasOwnProperty.call(sec, rawCode)
            ? sec[rawCode as string]
            : sec[codeSafe];
        const rows = coerceToRowsArray(v);
        if (rows) {
          setValue(`${sectionKey}.${codeSafe}`, rows);
        }
      } else {
        const v =
          rawCode != null &&
            rawCode !== '' &&
            Object.prototype.hasOwnProperty.call(sec, String(rawCode))
            ? sec[String(rawCode)]
            : Object.prototype.hasOwnProperty.call(sec, codeSafe)
              ? sec[codeSafe]
              : undefined;
        if (v !== undefined) {
          setValue(`${sectionKey}.${codeSafe}`, v);
        }
      }
    }
  }
}

const props = withDefaults(
  defineProps<{
    /** 获取表单定义：换成任意接口即可复用整页渲染（需与 /api/product/catalog/formDefinition 结构一致或可 unwrap 的 { data }） */
    fetchDefinition: (params: Record<string, any>) => Promise<Record<string, any>>;
    /** 请求参数（如 categoryName、id 等）；lang 会由组件内语言选择与 reload 合并进请求 */
    params?: Record<string, any>;
    /** 详情只读：禁用表单，仅显示「关闭」 */
    readonly?: boolean;
    onCancel?: () => void;
    onSave?: (model: Record<string, any>) => Promise<void> | void;
  }>(),
  {
    params: () => ({}),
    readonly: false,
  },
);
const loading = ref(false);
const saving = ref(false);
const definition = ref<Definition | null>(null);
const langOptions = computed(() => {
  const raw = (definition.value as any)?.languageList;
  const list = Array.isArray(raw) ? raw : [];
  return list.length
    ? list.map((l: any) => ({
      label: l.name ?? l.label ?? l.title ?? String(l.code ?? l.value ?? ''),
      value: l.code ?? l.value ?? l.key ?? '',
    }))
    : [{ label: '简体中文', value: 'zh_cn' }];
});
const currentLang = ref<string>('zh_cn');
watch(
  () => langOptions.value,
  (opts) => {
    if (!opts.length) return;
    if (!opts.some((o: { value: string }) => o.value === currentLang.value)) {
      currentLang.value = String(opts[0]!.value);
    }
  },
  { immediate: true },
);
type NormalizedField = {
  path: string;
  fieldCode: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'table' | 'treeSelect' | 'unknown';
  isRequired: boolean;
  span: number;
  col?: Partial<ColResponsive>;
  defaultValue?: any;
  options?: Option[];
  apiUrl?: string | null;
  tableColumns?: Array<{ title: string; key: string; fieldCode: string; __type: string; __options?: Option[] }>;
};
type Section = { key: string; title: string; fields: NormalizedField[] };
type ColResponsive = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

function parseAttrWrapperCss(attrWrapperCss: unknown): Partial<ColResponsive> | undefined {
  if (attrWrapperCss == null) return undefined;
  if (typeof attrWrapperCss === 'object') {
    const obj = attrWrapperCss as Record<string, any>;
    const out: Partial<ColResponsive> = {};
    (['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const).forEach((k) => {
      const v = Number(obj[k]);
      if (Number.isFinite(v) && v > 0 && v <= 24) out[k] = v;
    });
    return Object.keys(out).length ? out : undefined;
  }
  const raw = String(attrWrapperCss).trim();
  if (!raw) return undefined;
  const out: Partial<ColResponsive> = {};
  raw.split(',').forEach((seg) => {
    const [kRaw, vRaw] = seg.split(':');
    const k = String(kRaw ?? '').trim().toLowerCase() as keyof ColResponsive;
    const v = Number(String(vRaw ?? '').trim());
    if (['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(k) && Number.isFinite(v) && v > 0 && v <= 24) {
      (out as any)[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
}

function getColProps(field: NormalizedField): ColResponsive {
  // 后端直接下发响应式列配置时优先使用
  if (field.col && Object.keys(field.col).length) {
    const d: ColResponsive = { xs: 24, sm: 24, md: 12, lg: 8, xl: 6, xxl: 6 };
    return { ...d, ...field.col };
  }
  // 独占整行字段
  if (field.span >= 24) {
    return { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 };
  }
  const desktopSpan = field.span > 0 && field.span <= 24 ? field.span : 6;
  // 移动端单列；桌面端按 span 精准控制每行个数
  return { xs: 24, sm: 24, md: 12, lg: desktopSpan, xl: desktopSpan, xxl: desktopSpan };
}

function resolveFieldSpan(
  type: NormalizedField['type'],
  fieldCodeLower: string,
  attrWrapperCss: unknown,
): number {
  // 特殊规则：Background 始终最后且独占一整行
  if (fieldCodeLower === 'background') return 24;
  // 长字段默认整行
  if (type === 'textarea' || type === 'table') return 24;

  // 后端返回 attrWrapperCss：1 => 一行1个，3 => 一行3个
  const n = Number(attrWrapperCss);
  if (n === 1) return 24;
  if (n === 3) return 8;

  // 其余默认一行4个
  return 6;
}

function mapType(t?: string): NormalizedField['type'] {
  if (!t) return 'unknown';
  const lower = String(t).trim().toLowerCase();
  const typeMap: Record<string, NormalizedField['type']> = {
    text: 'text',
    number: 'number',
    select: 'select',
    textarea: 'textarea',
    table: 'table',
    treeselect: 'treeSelect',
  };
  return typeMap[lower] || 'unknown';
}
function sanitizeFieldCode(code: unknown, fallback: string) {
  const raw = typeof code === 'string' ? code : '';
  const trimmed = raw.trim();
  const finalCode = trimmed ? trimmed : fallback;
  // path 分隔符是 '.'，所以需要替换掉
  return finalCode.replace(/\./g, '_');
}
function normalizeSection(key: string, title: string, section?: any): Section {
  const raw = getSectionRows(section);
  const fields = raw
    .slice()
    .sort((a: any, b: any) => (a?.sortNum ?? 0) - (b?.sortNum ?? 0))
    .map((f: any, idx: number) => {
      const codeSrc = f?.fieldCode ?? f?.code ?? f?.key ?? f?.name ?? f?.prop;
      const labelSrc = f?.fieldName ?? f?.label ?? f?.title ?? f?.fieldLabel ?? codeSrc;
      // 后端可能返回 fieldType=select 但带 columns（如 applicationList），此时按 table 渲染
      const fieldCodeSafe = sanitizeFieldCode(
        codeSrc,
        typeof labelSrc === 'string' && labelSrc ? String(labelSrc) : `missing_${idx}`,
      );
      const inferredType = Array.isArray(f.columns) && f.columns.length ? 'table' : f.fieldType;
      const type = mapType(inferredType);
      const fieldCodeLower = String(fieldCodeSafe).toLowerCase();
      const span = resolveFieldSpan(
        type,
        fieldCodeLower,
        f?.attrWrapperCss ?? f?.attr_wrapper_css,
      );
      const nf: NormalizedField = {
        path: `${key}.${fieldCodeSafe}`,
        fieldCode: fieldCodeSafe,
        label: (typeof labelSrc === 'string' && labelSrc ? labelSrc : fieldCodeSafe) as string,
        type,
        isRequired: !!f.isRequired,
        span,
        col: parseAttrWrapperCss(f?.attrWrapperCss ?? f?.attr_wrapper_css),
        defaultValue: f.defaultValue,
        options: mapSchemaOptionsList(f.options),
        apiUrl: f.apiUrl ?? null,
      };
      if (type === 'table') {
        const rawCols = Array.isArray(f.columns) ? f.columns : [];
        const cols = rawCols.map((c: any, cIdx: number) => {
          const cCode = c?.fieldCode ?? c?.code ?? c?.key ?? c?.name;
          const cLabel = c?.fieldName ?? c?.label ?? c?.title ?? cCode;
          const colCodeSafe = sanitizeFieldCode(
            cCode,
            typeof cLabel === 'string' && cLabel ? String(cLabel) : `missing_col_${cIdx}`,
          );
          return {
            title: (typeof cLabel === 'string' && cLabel ? cLabel : colCodeSafe) as string,
            key: colCodeSafe,
            fieldCode: colCodeSafe,
            __type: mapType(c?.fieldType),
            __options: mapSchemaOptionsList(c?.options) ?? [],
            __apiUrl: c?.apiUrl ?? null,
          };
        });
        nf.tableColumns = cols;
      }
      return nf;
    });
  // 特殊规则：Background 始终放在区块最后一行
  const tailBackground = fields.filter((f) => String(f.fieldCode).toLowerCase() === 'background');
  const normalFields = fields.filter((f) => String(f.fieldCode).toLowerCase() !== 'background');
  return { key, title, fields: [...normalFields, ...tailBackground] };
}
// ====== 下拉懒加载：展开下拉时才请求 ======
const apiOptionsCache = reactive<Record<string, Option[]>>({});
/** 与 apiOptionsCache 同 key，保留 dropDown 原始响应供 TreeSelect 解析 children */
const apiDropDownRawByCacheKey = reactive<Record<string, any>>({});
const apiOptionsLoading = reactive<Record<string, boolean>>({});
/** 同一 cacheKey 并发只发一次请求，其余 await 该 Promise，避免先写入空 options 导致界面不刷新 */
const apiOptionsInflight = new Map<string, Promise<void>>();
// options 赋值用独立的响应式 Map，避免直接修改 computed/非响应对象导致不刷新
const selectOptionsByFieldPath = reactive<Record<string, Option[]>>({});
const tableSelectOptionsByKey = reactive<Record<string, Option[]>>({});
/** SBU 下拉受控 open：BU 变更时在「仍展开」状态下强制关→开，刷新 antd 内部选项缓存 */
const sbuSelectOpenByPath = reactive<Record<string, boolean>>({});
/** TreeSelect：antd TreeSelect 的 treeData（已规范为 title/value/key/children） */
const treeSelectDataByFieldPath = reactive<Record<string, any[]>>({});
const treeSelectLoadingByPath = reactive<Record<string, boolean>>({});
const treeSelectInflight = new Map<string, Promise<void>>();

/** 与 ensureDropDownOptions 内 cacheKey 规则一致 */
function getCatalogDropDownCacheKey(fieldCode: string, categoryCodeOverride?: any): string {
  const normalizedType = String(fieldCode).toLowerCase();
  const categoryCode = categoryCodeOverride ?? props.params?.categoryCode;
  return `dropDown:${normalizedType}:${categoryCode ?? ''}`;
}

function toAntdTreeSelectNodes(nodes: any[]): any[] {
  return (nodes || [])
    .map((n) => {
      const rawChildren = n?.children ?? n?.childList ?? n?.nodes ?? n?.childrenList;
      const value = n?.value ?? n?.id ?? n?.code ?? n?.key ?? n?.categoryCode;
      const title =
        n?.title ??
        n?.label ??
        n?.name ??
        n?.categoryNameCn ??
        n?.categoryName ??
        (value != null ? String(value) : '');
      const vs = value != null && String(value) !== '' ? String(value) : String(title);
      const childArr =
        Array.isArray(rawChildren) && rawChildren.length ? toAntdTreeSelectNodes(rawChildren) : undefined;
      return {
        title: String(title),
        value: vs,
        key: vs,
        children: childArr,
      };
    })
    .filter((n) => n.value != null && String(n.value) !== '');
}

function treeSelectGetPopupContainer(trigger: HTMLElement) {
  return trigger?.parentElement ?? document.body;
}

function coerceTreeSelectStoredValue(raw: any): string[] | undefined {
  if (raw == null || raw === '') return undefined;
  if (Array.isArray(raw)) {
    const arr = raw.map((x) => String(x)).filter((s) => s !== '');
    return arr.length ? arr : undefined;
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return undefined;
    if (s.startsWith('[')) {
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) {
          const arr = p.map((x) => String(x)).filter((x) => x !== '');
          return arr.length ? arr : undefined;
        }
        return [String(p)];
      } catch {
        /* 按分隔符拆 */
      }
    }
    if (s.includes(',')) {
      const arr = s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      return arr.length ? arr : undefined;
    }
    return [s];
  }
  return [String(raw)];
}

function getTreeSelectDisplayValue(path: string): string[] | undefined {
  return coerceTreeSelectStoredValue(getValue(path));
}

function setTreeSelectModelValue(path: string, val: string[] | undefined) {
  const next = val && val.length ? val.map(String) : undefined;
  setValue(path, next && next.length ? next : undefined);
}

function getTreeSelectTreeData(path: string): any[] {
  return treeSelectDataByFieldPath[path] ?? [];
}

function isTreeSelectLoading(path: string): boolean {
  return !!treeSelectLoadingByPath[path];
}

/** 从 dropDown 原始响应解析树；无 children 时返回 []，由调用方用扁平 options 兜底 */
function catalogDropDownRawToTreeData(raw: any): any[] {
  if (raw == null) return [];
  const list =
    Array.isArray(raw?.options)
      ? raw.options
      : Array.isArray(raw?.data?.options)
        ? raw.data.options
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
            ? raw
            : [];
  if (!list.length) return [];
  const hasNested = list.some(
    (item: any) =>
      item &&
      typeof item === 'object' &&
      Array.isArray(item.children) &&
      item.children.length > 0,
  );
  if (hasNested) return toAntdTreeSelectNodes(list);
  return [];
}

async function ensureTreeSelectOptions(field: NormalizedField) {
  if (field.type !== 'treeSelect') return;
  const optKey = field.path;
  if (Object.prototype.hasOwnProperty.call(treeSelectDataByFieldPath, optKey)) {
    const ex = treeSelectDataByFieldPath[optKey];
    if (Array.isArray(ex) && ex.length > 0) return;
  }

  const fieldType = String(field.fieldCode).toLowerCase();
  let categoryCodeOverride: any = undefined;
  if (fieldType === 'bu') {
    categoryCodeOverride = props.params?.categoryCode;
  } else if (fieldType === 'sbu') {
    const sectionKey = getSectionKeyFromFieldPath(field.path);
    const buVal = sectionKey ? getValue(`${sectionKey}.bu`) : undefined;
    if (buVal == null || buVal === '' || buVal === EMPTY_SELECT_VALUE) {
      treeSelectDataByFieldPath[optKey] = [];
      return;
    }
    categoryCodeOverride = buVal;
  }

  const cacheKey = getCatalogDropDownCacheKey(field.fieldCode, categoryCodeOverride);
  const inflightKey = `${optKey}::${cacheKey}`;
  if (!treeSelectInflight.has(inflightKey)) {
    const load = (async () => {
      treeSelectLoadingByPath[optKey] = true;
      try {
        await ensureDropDownOptions(field.fieldCode, categoryCodeOverride);
        const raw = apiDropDownRawByCacheKey[cacheKey];
        let treeData = catalogDropDownRawToTreeData(raw);
        if (!treeData.length) {
          const options = [...(apiOptionsCache[cacheKey] || [])];
          treeData = options.map((o) => ({
            title: o.label,
            value: String(o.value),
            key: String(o.value),
          }));
        }
        treeSelectDataByFieldPath[optKey] = treeData;
      } catch {
        treeSelectDataByFieldPath[optKey] = [];
      } finally {
        treeSelectLoadingByPath[optKey] = false;
        treeSelectInflight.delete(inflightKey);
      }
    })();
    treeSelectInflight.set(inflightKey, load);
  }

  await treeSelectInflight.get(inflightKey)!;
}

function normalizeApiOptions(data: any): Option[] {
  const list =
    Array.isArray(data?.options)
      ? data.options
      : Array.isArray(data?.data?.options)
        ? data.data.options
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
  return (list || []).map((item: any) => {
    if (typeof item === 'string' || typeof item === 'number') {
      const s = String(item);
      return { label: s, value: s };
    }
    const paired = mapCatalogApiOptionPair(item);
    if (paired) return paired;
    const value = item.value ?? item.id ?? item.code ?? item.key ?? item.name;
    const label = item.label ?? item.name ?? item.title ?? String(value ?? '');
    return { label: String(label), value: value as any };
  });
}
async function ensureDropDownOptions(
  fieldCode?: string,
  categoryCodeOverride?: any,
) {
  if (!fieldCode) return;
  // 后端参数只需要 type=<fieldCode>（fieldCode 不再作为独立参数传入）
  // 注意：type 这里尽量保持原始大小写，避免后端大小写敏感取值导致 options 不匹配/为空
  const typeValue = String(fieldCode);
  const normalizedType = typeValue.toLowerCase();
  const categoryCode = categoryCodeOverride ?? props.params?.categoryCode;
  const cacheKey = `dropDown:${normalizedType}:${categoryCode ?? ''}`;
  if (apiOptionsCache[cacheKey]) return;

  if (!apiOptionsInflight.has(cacheKey)) {
    const load = (async () => {
      apiOptionsLoading[cacheKey] = true;
      try {
        const params: Record<string, any> = { type: typeValue };
        // 业务要求：
        // 1) bu 下拉：categoryCode = 当前分类编码
        // 2) sbu 下拉：categoryCode = 当前 bu 的 value（由调用方传入覆盖值）
        if (
          (normalizedType === 'bu' || normalizedType === 'sbu') &&
          categoryCode != null &&
          String(categoryCode) !== ''
        ) {
          params.categoryCode = String(categoryCode);
        }

        const res1 = await requestClient.get<any>('/api/product/catalog/dropDown', {
          params,
        });
        apiOptionsCache[cacheKey] = normalizeApiOptions(res1);
        apiDropDownRawByCacheKey[cacheKey] = res1;
      } catch {
        apiOptionsCache[cacheKey] = [];
        delete apiDropDownRawByCacheKey[cacheKey];
      } finally {
        apiOptionsLoading[cacheKey] = false;
        apiOptionsInflight.delete(cacheKey);
      }
    })();
    apiOptionsInflight.set(cacheKey, load);
  }

  await apiOptionsInflight.get(cacheKey)!;
}
async function ensureFieldSelectOptions(field: NormalizedField) {
  if (field.type !== 'select') return;
  // 避免重复请求：如果响应式 Map 已有值，就认为已加载过
  const optKey = field.path;
  const fieldTypeEarly = String(field.fieldCode).toLowerCase();
  const cachedList = selectOptionsByFieldPath[optKey] || [];
  if (cachedList.length) {
    // 编辑回显：常现顺序是先 merge BU（触发拉 SBU 选项）再 merge SBU 值，此时会走此处 return，
    // 若详情里 sbu 存的是名称而选项 value 为编码，必须仍做一次 label→value，否则会不回显
    if (fieldTypeEarly === 'sbu') {
      const curVal = getValue(field.path);
      if (
        curVal != null &&
        curVal !== '' &&
        curVal !== EMPTY_SELECT_VALUE &&
        !cachedList.some((o) => String(o.value) === String(curVal))
      ) {
        const matchByLabel = cachedList.find((o) => String(o.label) === String(curVal));
        if (matchByLabel) setValue(field.path, matchByLabel.value);
      }
    }
    // 详情 defaultValue 常为 BU 中文名，选项 value 为编码；须先规范 BU 再拉 SBU，且 setValue 时不可误清 SBU
    if (fieldTypeEarly === 'bu') {
      const curVal = getValue(field.path);
      if (
        curVal != null &&
        curVal !== '' &&
        curVal !== EMPTY_SELECT_VALUE &&
        !cachedList.some((o) => String(o.value) === String(curVal))
      ) {
        const matchByLabel = cachedList.find((o) => String(o.label) === String(curVal));
        if (matchByLabel) setValue(field.path, matchByLabel.value);
      }
    }
    return;
  }
  // 统一：所有 select 都走通用下拉接口
  // 这样就不会出现你截图里的 category/transport/application 这些 apiUrl 未正确返回 options 的情况
  const fieldType = String(field.fieldCode).toLowerCase();

  // 联动：sbu 只有 bu 已选择时才加载（并且 sbu 请求参数 categoryCode=bu.value）
  let categoryCodeOverride: any = undefined;
  if (fieldType === 'bu') {
    categoryCodeOverride = props.params?.categoryCode;
  } else if (fieldType === 'sbu') {
    const sectionKey = getSectionKeyFromFieldPath(field.path);
    const buVal = sectionKey ? getValue(`${sectionKey}.bu`) : undefined;
    if (buVal == null || buVal === '' || buVal === EMPTY_SELECT_VALUE) {
      selectOptionsByFieldPath[optKey] = [];
      return;
    }
    categoryCodeOverride = buVal;
  }

  await ensureDropDownOptions(field.fieldCode, categoryCodeOverride);
  // 必须与 ensureDropDownOptions 内 cacheKey 一致：categoryCode = override ?? params.categoryCode
  const categoryCodeForCache = categoryCodeOverride ?? props.params?.categoryCode;
  const optCacheKey = `dropDown:${fieldType}:${categoryCodeForCache ?? ''}`;
  const options = [
    ...(apiOptionsCache[optCacheKey] || []),
  ];
  // 新数组引用 + nextTick，避免并发路径下先写入空列表后界面不跟接口结果同步
  selectOptionsByFieldPath[optKey] = [...options];
  await nextTick();

  // 如果当前表单模型里存的是 label（而不是 value），在拿到 options 后自动转换成 value
  const curVal = getValue(field.path);
  if (curVal != null && curVal !== '' && !options.some((o) => String(o.value) === String(curVal))) {
    const matchByLabel = options.find((o) => String(o.label) === String(curVal));
    if (matchByLabel) setValue(field.path, matchByLabel.value);
  }
}

/** BU 变更后 SBU 若正在展开：先收起再拉选项再展开，否则 antd Select 展开层不随 options 更新 */
async function reloadSbuOptionsAndMaybeReopenDropdown(
  sbuFieldPath: string,
  field: NormalizedField,
) {
  const wasOpen = !!sbuSelectOpenByPath[sbuFieldPath];
  if (wasOpen) {
    sbuSelectOpenByPath[sbuFieldPath] = false;
    await nextTick();
  }
  await ensureFieldSelectOptions(field);
  await nextTick();
  if (wasOpen) {
    sbuSelectOpenByPath[sbuFieldPath] = true;
  }
}

function getTableSelectOptionKey(fieldPath: string, col: any) {
  const colKey = col?.key ?? col?.fieldCode;
  return `${fieldPath}::${String(colKey)}`;
}
function getFieldSelectOptions(field: NormalizedField) {
  // Map 优先，确保响应式更新
  const key = field.path;
  if (Object.prototype.hasOwnProperty.call(selectOptionsByFieldPath, key)) {
    // 如果接口已加载过，即使返回空数组，也按“空”处理，交给 toVbenOptions 显示暂无数据
    return selectOptionsByFieldPath[key] ?? [];
  }
  return field.options ?? [];
}
function getTableSelectOptions(fieldPath: string, col: any) {
  const tableKey = getTableSelectOptionKey(fieldPath, col);
  if (Object.prototype.hasOwnProperty.call(tableSelectOptionsByKey, tableKey)) {
    return tableSelectOptionsByKey[tableKey] ?? [];
  }
  return col.__options ?? [];
}
function toVbenOptions(list: Option[], currentValue?: any) {
  let safeList = Array.isArray(list) ? list.slice() : [];
  const cur = currentValue;
  // 如果当前值不在 options 里，也动态补一条，保证回显时至少能展示 defaultValue
  if (cur != null && cur !== '' && cur !== EMPTY_SELECT_VALUE) {
    const curStr = String(cur);
    const hasCur = safeList.some((o) => String(o.value) === curStr);
    if (!hasCur) {
      // 如果 cur 本身等于某个 label，说明当前模型可能用的是 label（我们应当已在 ensure* 中映射成 value）
      // 为避免重复展示两条（同一文案），这里不再额外补一条。
      const hasByLabel = safeList.some((o) => String(o.label) === curStr);
      if (!hasByLabel) {
        safeList.push({ label: curStr, value: curStr });
      }
    }
  }
  if (!safeList.length) {
    return [{ label: '暂无数据', value: EMPTY_SELECT_VALUE }];
  }
  return safeList.map((o) => ({
    label: o.label,
    value: String(o.value),
  }));
}
async function ensureTableColumnOptions(fieldPath: string, col: any) {
  if (col.__type !== 'select') return;
  const tableKey = getTableSelectOptionKey(fieldPath, col);
  if ((tableSelectOptionsByKey[tableKey] || []).length) return;
  // 统一：所有表格列 select 都走通用下拉接口
  await ensureDropDownOptions(col.fieldCode, props.params?.categoryCode);
  const categoryCode = props.params?.categoryCode;
  const optCacheKey = `dropDown:${String(col.fieldCode).toLowerCase()}:${categoryCode ?? ''}`;
  const options = [
    ...(apiOptionsCache[optCacheKey] || []),
  ];
  tableSelectOptionsByKey[tableKey] = options;

  // 同理：表格列如果回显的是 label，需要转换成 value，避免保存时传 label
  const rows = getTableRows(fieldPath);
  if (rows.length) {
    rows.forEach((row: any) => {
      const curVal = row?.[col.key];
      if (
        curVal != null &&
        curVal !== '' &&
        !options.some((o) => String(o.value) === String(curVal))
      ) {
        const matchByLabel = options.find((o) => String(o.label) === String(curVal));
        if (matchByLabel) {
          updateTableCell(fieldPath, row._rowKey, col.key, matchByLabel.value);
        }
      }
    });
  }
}
async function preloadAllSelectOptions() {
  /** 先加载 BU 等下拉，再加载 SBU，避免详情回填时 SBU 先于 BU 预加载失败 */
  const tasksFirst: Array<Promise<any>> = [];
  const tasksSbu: Array<Promise<any>> = [];
  const currentSections = sections.value;
  currentSections.forEach((s) => {
    s.fields.forEach((f) => {
      if (f.type === 'treeSelect') {
        tasksFirst.push(ensureTreeSelectOptions(f));
        return;
      }
      if (f.type === 'select') {
        const fc = String(f.fieldCode || '').toLowerCase();
        if (fc === 'sbu') {
          if (!isSbuDisabled(f)) tasksSbu.push(ensureFieldSelectOptions(f));
          return;
        }
        tasksFirst.push(ensureFieldSelectOptions(f));
        return;
      }
      if (f.type === 'table') {
        (f.tableColumns || []).forEach((c) => {
          if (c.__type === 'select') tasksFirst.push(ensureTableColumnOptions(f.path, c));
        });
      }
    });
  });
  await Promise.all(tasksFirst.map((p) => p.catch(() => undefined)));
  await Promise.all(tasksSbu.map((p) => p.catch(() => undefined)));
}
const sectionTitleMap: Record<string, string> = {
  basicInfo: '基本信息',
  classificationInfo: '分类属性',
  applicationInfo: '应用信息',
  otherInfo: '其他信息',
};
/** 区块标题：优先读后端区块对象上的 title/label 等，其次常用 key 中文映射，最后用 key 本身 */
function resolveSectionTitle(sectionKey: string, section: any): string {
  if (section && typeof section === 'object' && !Array.isArray(section)) {
    const t =
      section.sectionTitle ??
      section.title ??
      section.label ??
      section.name ??
      section.sectionName;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  return sectionTitleMap[sectionKey] ?? sectionKey;
}
const sections = computed<Section[]>(() => {
  const d = definition.value as any;
  if (!d) return [];
  // 只渲染「表单区块」：避免把 code/msg 等非区块字段当成一节
  const keys = Object.keys(d).filter((k) => isFormSection(d[k]));
  // 排序：已知 key 优先，其余按字母序排在后面
  const preferredOrder = ['basicInfo', 'classificationInfo', 'applicationInfo', 'otherInfo'];
  keys.sort((a, b) => {
    const ai = preferredOrder.indexOf(a);
    const bi = preferredOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return keys
    .map((key) => normalizeSection(key, resolveSectionTitle(key, d[key]), d[key]))
    .filter((s) => s.fields.length);
});
const formModel = reactive<Record<string, any>>({});
const formRef = ref();
function ensurePath(path: string) {
  const seg = toNamePath(path);
  if (!seg.length) return { cur: formModel, key: '' };
  let cur: any = formModel;
  for (let i = 0; i < seg.length - 1; i++) {
    const k = String(seg[i]!);
    cur[k] ||= {};
    cur = cur[k];
  }
  return { cur, key: String(seg[seg.length - 1]!) };
}

function getValue(path: string) {
  const { cur, key } = ensurePath(path);
  return cur[key];
}

function getSectionKeyFromFieldPath(path: string): string | undefined {
  const seg = toNamePath(path);
  return seg.length ? String(seg[0]!) : undefined;
}

/** BU 变更时重建 SBU 的 Select，避免 antd 内部缓存旧 options */
function selectControlKey(field: NormalizedField): string {
  const fc = String(field.fieldCode || '').toLowerCase();
  if (fc === 'sbu') {
    const sk = getSectionKeyFromFieldPath(field.path);
    const bu = sk ? getValue(`${sk}.bu`) : '';
    return `${field.path}__bu_${String(bu ?? '')}`;
  }
  return field.path;
}

function isSbuFieldCode(field: NormalizedField): boolean {
  return String(field.fieldCode || '').toLowerCase() === 'sbu';
}

/** 与 ensureDropDownOptions 中 sbu 的 cacheKey 一致，用于 loading 状态 */
function sbuApiCacheKey(field: NormalizedField): string | null {
  if (!isSbuFieldCode(field)) return null;
  const sk = getSectionKeyFromFieldPath(field.path);
  const buVal = sk ? getValue(`${sk}.bu`) : undefined;
  if (buVal == null || buVal === '' || buVal === EMPTY_SELECT_VALUE) return null;
  return `dropDown:sbu:${String(buVal)}`;
}

function isSbuSelectLoading(field: NormalizedField): boolean {
  if (isSbuDisabled(field)) return false;
  const k = sbuApiCacheKey(field);
  return k != null && !!apiOptionsLoading[k];
}

/** SBU 请求中且尚无选项时不塞「暂无数据」，交给 Select 的 loading 展示 */
function selectOptionsForTemplate(field: NormalizedField, currentVal: any) {
  const raw = getFieldSelectOptions(field);
  if (isSbuFieldCode(field) && isSbuSelectLoading(field) && !raw.length) {
    return [];
  }
  return toVbenOptions(raw, currentVal);
}

function isSbuDisabled(field: NormalizedField): boolean {
  if (!field.fieldCode || String(field.fieldCode).toLowerCase() !== 'sbu') return false;
  const sectionKey = getSectionKeyFromFieldPath(field.path);
  if (!sectionKey) return true;
  const buVal = getValue(`${sectionKey}.bu`);
  return buVal == null || buVal === '' || buVal === EMPTY_SELECT_VALUE;
}

/** 仅 SBU 使用受控 open；其它 select 不传 open，保持 antd 非受控行为 */
function sbuSelectOpenBinding(field: NormalizedField): boolean | undefined {
  if (!isSbuFieldCode(field) || props.readonly) return undefined;
  return sbuSelectOpenByPath[field.path] ?? false;
}

function onSelectDropdownVisibleChange(field: NormalizedField, open: boolean) {
  if (isSbuFieldCode(field) && !props.readonly) {
    sbuSelectOpenByPath[field.path] = open;
  }
  if (
    open &&
    !props.readonly &&
    field.type === 'select' &&
    !isSbuDisabled(field)
  ) {
    void ensureFieldSelectOptions(field).catch(() => undefined);
  }
}

/** 表格渲染用：保证始终为数组，避免接口偶发返回对象导致 v-for / map 异常 */
function getTableRows(path: string): any[] {
  const v = getValue(path);
  if (Array.isArray(v)) return v;
  const coerced = coerceToRowsArray(v);
  return coerced ?? [];
}

function isBuValueEmpty(v: any) {
  return v == null || v === '' || v === EMPTY_SELECT_VALUE;
}

/** 详情里 BU 常存中文 label，下拉 value 为编码：此种 setValue 不应清空已回填的 SBU */
function isBuLabelToValueCoercion(buPath: string, prevBu: any, newBu: any): boolean {
  if (isBuValueEmpty(prevBu) || isBuValueEmpty(newBu)) return false;
  const ps = String(prevBu).trim();
  const ns = String(newBu).trim();
  if (ps === ns) return false;
  const buOpts = selectOptionsByFieldPath[buPath] || [];
  return buOpts.some(
    (o) => String(o.value).trim() === ns && String(o.label).trim() === ps,
  );
}

function setValue(path: string, val: any) {
  const seg = toNamePath(path);
  const { cur, key } = ensurePath(path);
  const prevBu = String(seg[seg.length - 1]!) === 'bu' ? cur[key] : undefined;
  cur[key] = val;

  // 联动：bu 变更时处理对应 section 的 sbu（避免详情合并时「先写 sbu 再写 bu」被误清空）
  if (seg.length >= 2 && String(seg[seg.length - 1]!) === 'bu') {
    const sectionKey = String(seg[0]!);
    let sbuField: NormalizedField | undefined;
    let sbuFieldPath: string | undefined;

    for (const sec of sections.value) {
      for (const f of sec.fields) {
        if (f.type !== 'select') continue;
        const fSeg = toNamePath(f.path);
        if (fSeg.length < 2) continue;
        const fSection = String(fSeg[0]!);
        const fLast = String(fSeg[fSeg.length - 1]!).toLowerCase();
        if (fSection === sectionKey && fLast === 'sbu') {
          sbuField = f;
          sbuFieldPath = f.path;
          break;
        }
      }
      if (sbuField) break;
    }

    if (sbuField && sbuFieldPath) {
      const hadBu = !isBuValueEmpty(prevBu);
      const hasBu = !isBuValueEmpty(val);
      const buChanged = String(prevBu ?? '') !== String(val ?? '');

      const { cur: sbuCur, key: sbuKey } = ensurePath(sbuFieldPath);

      if (!hasBu) {
        // 清空 BU：同步清空 SBU
        sbuCur[sbuKey] = undefined;
        delete selectOptionsByFieldPath[sbuFieldPath];
        sbuSelectOpenByPath[sbuFieldPath] = false;
      } else if (buChanged) {
        const buCoercion = isBuLabelToValueCoercion(path, prevBu, val);
        // 真实切换 BU：清空 SBU；仅 label→value 规范化：保留 SBU 并换用正确 BU 编码重新拉 SBU 列表
        if (hadBu && !buCoercion) sbuCur[sbuKey] = undefined;
        delete selectOptionsByFieldPath[sbuFieldPath];
        const p = buCoercion
          ? ensureFieldSelectOptions(sbuField)
          : props.readonly
            ? ensureFieldSelectOptions(sbuField)
            : reloadSbuOptionsAndMaybeReopenDropdown(sbuFieldPath, sbuField);
        void p.catch(() => undefined);
      }
      // bu 未变化：不反复删 options / 请求
    }
  }
}

/** 下拉占位、未选、空串与 antd required 漏检场景：用 validator 读 formModel */
function getFieldRules(field: NormalizedField): any[] {
  if (!field.isRequired) return [];
  const path = field.path;
  if (!toNamePath(path).length) return [];
  if (field.type === 'select') {
    return [
      {
        validator: async () => {
          const val = getValue(path);
          if (
            val === undefined ||
            val === null ||
            val === '' ||
            (typeof val === 'string' && val.trim() === '') ||
            val === EMPTY_SELECT_VALUE
          ) {
            return Promise.reject(new Error('请选择'));
          }
          return Promise.resolve();
        },
        trigger: ['change', 'blur'],
      },
    ];
  }
  if (field.type === 'treeSelect') {
    return [
      {
        validator: async () => {
          const val = getTreeSelectDisplayValue(path);
          if (!val || !val.length) {
            return Promise.reject(new Error('请选择'));
          }
          return Promise.resolve();
        },
        trigger: ['change', 'blur'],
      },
    ];
  }
  if (field.type === 'number') {
    return [
      {
        validator: async () => {
          const val = getValue(path);
          if (val === undefined || val === null || val === '') {
            return Promise.reject(new Error('必填'));
          }
          if (typeof val === 'number' && Number.isNaN(val)) {
            return Promise.reject(new Error('必填'));
          }
          return Promise.resolve();
        },
        trigger: ['change', 'blur'],
      },
    ];
  }
  if (field.type === 'text' || field.type === 'textarea' || field.type === 'unknown') {
    return [
      {
        validator: async () => {
          const val = getValue(path);
          if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
            return Promise.reject(new Error('必填'));
          }
          return Promise.resolve();
        },
        trigger: ['change', 'blur'],
      },
    ];
  }
  return [{ required: true, message: '必填' }];
}

function initDefaults() {
  sections.value.forEach((s) => {
    s.fields.forEach((f) => {
      if (f.type === 'table') {
        // table 默认至少一行，确保像“推荐稀释比”等列能直接展示出来
        let existing = getValue(f.path);
        const coerced = coerceToRowsArray(existing);
        if (existing != null && coerced == null && !Array.isArray(existing)) {
          setValue(f.path, []);
          existing = [];
        } else if (coerced != null && coerced !== existing) {
          setValue(f.path, coerced);
          existing = coerced;
        }

        if (existing == null && f.defaultValue != null) {
          const dvRows = coerceToRowsArray(f.defaultValue);
          if (dvRows) {
            setValue(f.path, dvRows);
          } else if (Array.isArray(f.defaultValue)) {
            setValue(f.path, f.defaultValue);
          } else {
            setValue(f.path, []);
          }
        } else if (existing == null) {
          setValue(f.path, []);
        } else if (!Array.isArray(getValue(f.path))) {
          setValue(f.path, []);
        }

        let list = (getValue(f.path) ?? []) as any[];
        if (!Array.isArray(list)) {
          setValue(f.path, []);
          list = [];
        }
        // 兼容：后端 defaultValue 的 table 行可能没有 _rowKey，导致 updateTableCell 找不到行
        list = list.map((row: any, idx: number) => {
          const nextRow = { ...(row || {}) };
          if (!nextRow._rowKey) nextRow._rowKey = `r${rowSeed++}_${idx}`;
          (f.tableColumns || []).forEach((c) => {
            if (!(c.key in nextRow)) nextRow[c.key] = undefined;
          });
          return nextRow;
        });
        if (list.length === 0) {
          const row: Record<string, any> = { _rowKey: `r${rowSeed++}` };
          (f.tableColumns || []).forEach((c) => {
            row[c.key] = undefined;
          });
          list = [row];
        }
        setValue(f.path, list);
        return;
      }
      if (f.type === 'treeSelect') {
        if (getValue(f.path) == null && f.defaultValue !== undefined && f.defaultValue !== '') {
          const c = coerceTreeSelectStoredValue(f.defaultValue);
          if (c?.length) setValue(f.path, c);
        }
        return;
      }
      if (getValue(f.path) == null && f.defaultValue !== undefined) {
        setValue(f.path, f.defaultValue);
      }
    });
  });
}

function isEmptyValue(val: any) {
  return val == null || val === '' || val === EMPTY_SELECT_VALUE;
}

function normalizeText(val: any) {
  return String(val ?? '').trim().toLowerCase();
}

function pickPreferredOption(
  options: Option[],
  preferred?: { code?: any; name?: any },
) {
  if (!Array.isArray(options) || !options.length) return undefined;
  const codeNorm = normalizeText(preferred?.code);
  const nameNorm = normalizeText(preferred?.name);
  if (codeNorm) {
    const hitByCode = options.find((o) => normalizeText(o?.value) === codeNorm);
    if (hitByCode) return hitByCode;
  }
  if (nameNorm) {
    const hitByName = options.find((o) => normalizeText(o?.label) === nameNorm);
    if (hitByName) return hitByName;
  }
  return undefined;
}

async function autoSelectBuSbuWhenAdd() {
  if (!props.params?.autoSelectBuSbu) return;

  const buFields: NormalizedField[] = [];
  const sbuFields: NormalizedField[] = [];
  sections.value.forEach((s) => {
    s.fields.forEach((f) => {
      const code = String(f.fieldCode || '').toLowerCase();
      if (code === 'bu') buFields.push(f);
      if (code === 'sbu') sbuFields.push(f);
    });
  });

  // 先处理 BU，确保后续 SBU 能按 BU 联动拉取选项
  for (const f of buFields) {
    await ensureFieldSelectOptions(f);
    const cur = getValue(f.path);
    if (!isEmptyValue(cur)) continue;
    const opts = getFieldSelectOptions(f);
    if (Array.isArray(opts) && opts.length > 0) {
      const hit = pickPreferredOption(opts, {
        code: props.params?.preferBuCode,
        name: props.params?.preferBuName,
      });
      setValue(f.path, (hit ?? opts[0])?.value);
    }
  }

  // 再处理 SBU（此时 BU 已有值，SBU 的下拉参数 categoryCode=bu.value）
  for (const f of sbuFields) {
    await ensureFieldSelectOptions(f);
    const cur = getValue(f.path);
    if (!isEmptyValue(cur)) continue;
    const opts = getFieldSelectOptions(f);
    if (Array.isArray(opts) && opts.length > 0) {
      const hit = pickPreferredOption(opts, {
        code: props.params?.preferSbuCode,
        name: props.params?.preferSbuName,
      });
      setValue(f.path, (hit ?? opts[0])?.value);
    }
  }
}

let rowSeed = 1;
function addTableRow(field: { path: string; tableColumns?: Array<{ key: string }> }) {
  const path = field.path;
  const list = (getValue(path) ?? []) as any[];
  const row: Record<string, any> = { _rowKey: `r${rowSeed++}` };
  (field.tableColumns || []).forEach((c) => {
    row[c.key] = undefined;
  });
  list.push(row);
  setValue(path, [...list]);
}

function removeTableRow(path: string, rowKey: string) {
  const list = ((getValue(path) ?? []) as any[]).filter((r) => r._rowKey !== rowKey);
  setValue(path, list);
}

function updateTableCell(path: string, rowKey: string, key: string, val: any) {
  const list = (getValue(path) ?? []) as any[];
  const idx = list.findIndex((r) => r._rowKey === rowKey);
  if (idx >= 0) {
    list[idx] = { ...list[idx], [key]: val };
    setValue(path, [...list]);
  }
}

async function reload() {
  loading.value = true;
  try {
    // 切语言/切参数前先清空旧表单值，避免旧字段残留
    for (const k of Object.keys(formModel)) {
      delete formModel[k];
    }

    for (const k of Object.keys(sbuSelectOpenByPath)) {
      delete sbuSelectOpenByPath[k];
    }
    for (const k of Object.keys(selectOptionsByFieldPath)) {
      delete selectOptionsByFieldPath[k];
    }
    for (const k of Object.keys(tableSelectOptionsByKey)) {
      delete tableSelectOptionsByKey[k];
    }
    for (const k of Object.keys(apiOptionsCache)) {
      delete apiOptionsCache[k];
    }
    for (const k of Object.keys(apiOptionsLoading)) {
      delete apiOptionsLoading[k];
    }
    for (const k of Object.keys(treeSelectDataByFieldPath)) {
      delete treeSelectDataByFieldPath[k];
    }
    for (const k of Object.keys(treeSelectLoadingByPath)) {
      delete treeSelectLoadingByPath[k];
    }
    for (const k of Object.keys(apiDropDownRawByCacheKey)) {
      delete apiDropDownRawByCacheKey[k];
    }
    apiOptionsInflight.clear();
    treeSelectInflight.clear();
    const params = { ...(props.params ?? {}), lang: currentLang.value };
    let res: any = await props.fetchDefinition(params);
    res = unwrapDefinitionRoot(res);
    definition.value = res;
    mergeSectionPayloadIntoFormModel(res);
    initDefaults();
    // 预加载所有下拉 options，避免“打开时请求未完成导致下拉不渲染”
    await preloadAllSelectOptions();
    // 新增时：根据左侧分类默认选中 BU/SBU（仅空值时生效，不覆盖详情/编辑已有值）
    await autoSelectBuSbuWhenAdd();
  } catch (e: any) {
    const respMsg = e?.response?.data?.msg ?? e?.data?.msg;
    message.error(respMsg ?? e?.message ?? '获取表单定义失败');
  } finally {
    loading.value = false;
  }
}
async function handleSave() {
  if (saving.value) return;
  try {
    saving.value = true;
    // 先让 loading 状态渲染出来，避免大表单校验前的“点击无反馈”体感
    await nextTick();
    await (formRef.value as any)?.validate?.();
    if (props.onSave) {
      // 保存时补充当前语言，供后端 sourceLang 使用
      await Promise.resolve(props.onSave({ ...formModel, sourceLang: currentLang.value }));
    } else {
      message.success('校验通过（未配置保存接口）');
    }
  } catch (e: any) {
    // validate 会抛错，保持静默；但保存接口若失败，后端可能返回 { code: 500, msg: '...' }
    const respMsg = e?.response?.data?.msg ?? e?.data?.msg;
    if (respMsg) message.error(respMsg);
    // validate 会抛错，保持静默
  } finally {
    saving.value = false;
  }
}
function handleCancel() {
  props.onCancel?.();
}
onMounted(() => {
  // params 里可能已经传了 lang，但按需求仍以 currentLang 控制
  if (typeof props.params?.lang === 'string') {
    currentLang.value = props.params.lang;
  }
  reload();
});

// 父组件变更入参（如 id、categoryName）时重新拉定义；用 stringify 避免 computed 每次返回新对象导致死循环
watch(
  () => JSON.stringify(props.params ?? {}),
  () => {
    reload();
  },
);
</script>
<style lang="scss" scoped>
.df-page {
  padding: 16px 20px 80px;
  min-height: 100%;
}

.df-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.df-tree-select {
  width: 100%;
}

:deep(.df-tree-select-dropdown) {
  .ant-select-tree-list-holder-inner {
    min-width: 380px;
  }

  .ant-select-tree-node-content-wrapper {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.df-lang {
  display: flex;
  align-items: center;
  gap: 8px;

  &__label {
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
  }

  &__select {
    width: 180px;
  }
}

.df-section {
  margin-bottom: 12px;

  &__title {
    position: relative;
    padding-left: 12px;
    font-weight: 600;
    margin: 12px 0;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 16px;
      border-radius: 2px;
      background: #ffe900;
    }
  }
}

.df-item {
  margin-bottom: 12px;
}

/* 表单项统一对齐：标签固定宽度，输入控件等宽左对齐 */
.df-form {
  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }

  :deep(.ant-form-item-control-input),
  :deep(.ant-form-item-control-input-content) {
    width: 100%;
    min-width: 0;
  }

  :deep(.ant-input),
  :deep(.ant-input-affix-wrapper),
  :deep(.ant-input-number),
  :deep(.ant-input-number-affix-wrapper),
  :deep(.ant-select),
  :deep(.ant-tree-select),
  :deep(.ant-picker) {
    width: 100%;
  }

  :deep(.ant-input-number .ant-input-number-input-wrap) {
    width: 100%;
  }

  :deep(.ant-select .ant-select-selector),
  :deep(.ant-tree-select .ant-select-selector) {
    width: 100% !important;
  }

  /* 多选下拉美化（如 Website Category） */
  :deep(.ant-select-multiple .ant-select-selector),
  :deep(.ant-tree-select.ant-select-multiple .ant-select-selector) {
    height: 32px !important;
    min-height: 32px !important;
    padding: 1px 8px !important;
    border-radius: 8px !important;
    align-items: center !important;
    overflow: hidden;
  }

  :deep(.ant-select-multiple .ant-select-selection-overflow),
  :deep(.ant-tree-select.ant-select-multiple .ant-select-selection-overflow) {
    flex-wrap: nowrap !important;
    row-gap: 0;
    column-gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
  }

  :deep(.ant-select-multiple .ant-select-selection-overflow::-webkit-scrollbar),
  :deep(.ant-tree-select.ant-select-multiple .ant-select-selection-overflow::-webkit-scrollbar) {
    height: 4px;
  }

  :deep(.ant-select-multiple .ant-select-selection-overflow::-webkit-scrollbar-thumb),
  :deep(.ant-tree-select.ant-select-multiple .ant-select-selection-overflow::-webkit-scrollbar-thumb) {
    background-color: rgba(0, 0, 0, 0.25);
    border-radius: 999px;
  }

  :deep(.ant-select-multiple .ant-select-selection-item),
  :deep(.ant-tree-select.ant-select-multiple .ant-select-selection-item) {
    background: #f5f7fa !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 6px !important;
    color: rgba(0, 0, 0, 0.78);
    margin-inline-end: 0 !important;
    max-width: 110px;
    height: 22px;
    line-height: 20px;
  }

  :deep(.ant-select-multiple .ant-select-selection-item-content),
  :deep(.ant-tree-select.ant-select-multiple .ant-select-selection-item-content) {
    max-width: 78px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.df-table {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;

  &__row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr)) 60px;
    gap: 12px;
    align-items: end;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
  }

  &__row:last-child {
    border-bottom: none;
  }

  &__cell-label {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.55);
    margin-bottom: 6px;
  }

  &__remove {
    justify-self: end;
    padding: 0;
  }

  &__add {
    margin-top: 8px;
    text-align: right;
  }
}

.df-footer {
  position: sticky;
  bottom: 0;
  margin-top: 16px;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(to top, #fff 70%, rgba(255, 255, 255, 0));
}

.df-footer__save {
  background-color: #ffe900 !important;
  border-color: #ffe900 !important;
  color: #000 !important;
  width: 120px;
}

.df-footer__cancel {
  width: 120px;
}
</style>

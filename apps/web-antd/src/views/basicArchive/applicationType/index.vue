<template>
    <div class="p-5 bg-white">
        <div class="lang-switch mb-4 flex items-center">
            <span class="mr-2">语言：</span>
            <Select v-model:value="currentLang" style="width: 160px" :options="langOptions" />
        </div>
        <Form :model="formModel" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal"
            class="dynamic-form">
            <template v-for="group in groups" :key="group.name">
                <Divider orientation="left">
                    {{ group.name }}
                </Divider>
                <Row :gutter="16">
                    <Col v-for="field in group.fields" :key="field.fieldName" :span="12">
                        <Form.Item :label="field.label?.[currentLang] || field.fieldName" :name="field.fieldName"
                            :required="field.isRequired">
                            <!-- 文本输入 -->
                            <Input v-if="field.type === 'text'" :value="getFieldValue(field.fieldName)"
                                :placeholder="field.placeholder?.[currentLang] || field.placeholder?.zh_cn"
                                :maxlength="field.maxLength" @update:value="setFieldValue(field.fieldName, $event)" />
                            <!-- 下拉选择（options 的 label 支持多语言对象） -->
                            <Select
                                v-else-if="field.type === 'select'"
                                :value="getFieldValue(field.fieldName)"
                                :options="(field.options || []).map((opt) => ({
                                    value: opt.value,
                                    label: typeof opt.label === 'string'
                                        ? opt.label
                                        : opt.label?.[currentLang] || opt.label?.zh_cn || String(opt.value),
                                }))"
                                :placeholder="field.placeholder?.[currentLang] || field.placeholder?.zh_cn || '请选择'"
                                @update:value="setFieldValue(field.fieldName, $event)"
                            />
                            <!-- 复选框组（options 的 label 支持多语言对象） -->
                            <CheckboxGroup
                                v-else-if="field.type === 'checkbox'"
                                :value="getFieldValue(field.fieldName) || []"
                                @change="(val) => setFieldValue(field.fieldName, val)"
                            >
                                <Checkbox
                                    v-for="opt in field.options || []"
                                    :key="opt.value"
                                    :value="opt.value"
                                >
                                    {{
                                        typeof opt.label === 'string'
                                            ? opt.label
                                            : opt.label?.[currentLang] || opt.label?.zh_cn || opt.value
                                    }}
                                </Checkbox>
                            </CheckboxGroup>
                            <!-- 日期时间 -->
                            <DatePicker v-else-if="field.type === 'datetime'" show-time
                                :value="getFieldValue(field.fieldName)" style="width: 100%"
                                @update:value="setFieldValue(field.fieldName, $event)" />
                            <!-- 分类选择等暂未实现的类型，占位显示 -->
                            <Input v-else :value="getFieldValue(field.fieldName)"
                                :placeholder="field.placeholder?.[currentLang] || field.placeholder?.zh_cn || '暂未实现的控件类型'"
                                @update:value="setFieldValue(field.fieldName, $event)" />
                        </Form.Item>
                    </Col>
                </Row>
            </template>
        </Form>
    </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
} from 'ant-design-vue';
// 本地模拟接口返回的表单配置
// 这里用 ?raw 导入字符串，再手动去掉注释并 JSON.parse，
// 这样可以兼容 index.json 中的注释行（// ...）
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import rawSchemaText from './index.json?raw';
interface RawOption {
  value: string | number;
  label?: Record<string, string> | string;
}

interface FieldConfig {
  fieldName: string; // 例如 basicInfo.productNo
  label?: Record<string, string>;
  type: string;
  isRequired?: boolean;
  isMultilang?: boolean;
  maxLength?: number;
  placeholder?: Record<string, string>;
  sortNum?: number;
  group?: string;
  options?: RawOption[];
  wrapperCss?: string;
}
const parsedSchema = JSON.parse(
  rawSchemaText.replace(/\/\/.*$/gm, ''),
) as any;
const formInfo = parsedSchema.formInfo ?? {};
// 语言切换：从 languageList 生成
const languageList =
  (formInfo.languageList as Array<{ code: string; name: string }>) ?? [];

const langOptions =
  languageList.length > 0
    ? languageList.map((item) => ({
        label: item.name,
        value: item.code,
      }))
    : [{ label: '中文', value: 'zh_cn' }];

type LangCode = string;
const currentLang = ref<LangCode>(langOptions[0]?.value || 'zh_cn');
// 将 basicInfo / classificationInfo / applicationInfo 等模块统一拍平成字段数组
const groupNameMap: Record<string, string> = {
  basicInfo: '基本信息',
  classificationInfo: '分类属性',
  applicationInfo: '应用信息',
};

const fields: FieldConfig[] = [];

Object.entries(formInfo).forEach(([sectionKey, sectionVal]) => {
  if (sectionKey === 'languageList') return;
  const section: any = sectionVal;
  const sectionFields = (section?.fields ?? []) as any[];
  const groupName = groupNameMap[sectionKey] ?? sectionKey;
  sectionFields.forEach((raw) => {
    const field: FieldConfig = {
      fieldName: `${sectionKey}.${raw.fieldCode}`,
      label: raw.fieldName,
      type: raw.fieldType || 'text',
      isRequired: raw.isRequired,
      isMultilang: raw.isMultilang,
      maxLength: raw.maxLength,
      placeholder: raw.placeholder,
      sortNum: raw.sortNum,
      group: groupName,
      options: raw.options as RawOption[] | undefined,
      wrapperCss: raw.wrapperCss,
    };
    fields.push(field);
  });
});

// 按 group 分组
const groups = computed(() => {
  const map = new Map<string, FieldConfig[]>();
  fields
    .slice()
    .sort((a, b) => (a.sortNum || 0) - (b.sortNum || 0))
    .forEach((field) => {
      const groupName = field.group || '其他';
      if (!map.has(groupName)) {
        map.set(groupName, []);
      }
      map.get(groupName)!.push(field);
    });

  return Array.from(map.entries()).map(([name, groupFields]) => ({
    name,
    fields: groupFields,
  }));
});

// 简单的扁平对象作为表单模型
const formModel = reactive<Record<string, any>>({});
function getFieldValue(path: string) {
  const segments = path.split('.');
  let current: any = formModel;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = segments[segments.length - 1];
  return current[lastKey];
}

function setFieldValue(path: string, value: any) {
  const segments = path.split('.');
  let current: any = formModel;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = segments[segments.length - 1];
  current[lastKey] = value;
}
</script>

<style lang="scss" scoped>
.dynamic-form {
    :deep(.ant-form-item-label > label) {
        font-size: 13px;
    }
}
</style>
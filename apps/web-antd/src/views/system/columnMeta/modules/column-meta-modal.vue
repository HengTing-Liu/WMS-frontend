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
      <FormItem label="数据库字段名" name="columnName">
        <Input
          v-model:value="formData.columnName"
          :disabled="isEdit"
          :maxlength="100"
          placeholder="如 warehouse_code"
        />
      </FormItem>
      <FormItem label="显示标题" name="title">
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
              <SelectOption value="upload">upload</SelectOption>
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

      <template v-if="formData.formType === 'upload'">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="上传方式" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
              <Select v-model:value="uploadBuilder.uploadType">
                <SelectOption value="">本地上传</SelectOption>
                <SelectOption value="OSS">阿里云 OSS</SelectOption>
                <SelectOption value="MINIO">MINIO</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="展示样式" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
              <Select v-model:value="uploadBuilder.listType">
                <SelectOption value="text">文本列表</SelectOption>
                <SelectOption value="picture">图片列表</SelectOption>
                <SelectOption value="picture-card">卡片</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="最大数量" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
              <InputNumber v-model:value="uploadBuilder.maxCount" :min="1" :max="99" style="width: 100%" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="允许格式" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
              <Input v-model:value="uploadBuilder.accept" placeholder="如 .jpg,.png,.pdf" />
            </FormItem>
          </Col>
        </Row>
        <FormItem v-if="!uploadBuilder.uploadType" label="上传接口地址">
          <Input v-model:value="uploadBuilder.action" placeholder="/api/system/file/upload" />
        </FormItem>
      </template>

      <div class="section-title">展示与校验</div>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="必填" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.required" /></FormItem></Col>
        <Col :span="8"><FormItem label="只读" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.readonly" /></FormItem></Col>
        <Col :span="8"><FormItem label="编辑只读" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.editReadonly" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="唯一" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.isUnique" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="可搜索" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.searchable" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="列表显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInList" /></FormItem></Col>
        <Col :span="8"><FormItem label="表单显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInForm" /></FormItem></Col>
        <Col :span="8"><FormItem label="导出显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInExport" /></FormItem></Col>
        <Col :span="8"><FormItem label="导入显示" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.showInImport" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8"><FormItem label="可排序" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.sortable" /></FormItem></Col>
        <Col :span="8"><FormItem label="状态" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Switch v-model:checked="switches.status" /></FormItem></Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="列表宽度" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <InputNumber v-model:value="formData.width" :min="50" :max="600" style="width: 100%" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="栅格列宽" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <!-- 使用数字输入：库中可为 1–24 任意值；仅用 6/8/12/24 下拉会导致非选项值无法回显 -->
            <InputNumber
              v-model:value="formData.colSpan"
              :min="1"
              :max="24"
              allow-clear
              placeholder="未配置（可留空）"
              style="width: 100%"
            />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="排序号" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" name="sortOrder"><InputNumber v-model:value="formData.sortOrder" :min="1" :max="9999" style="width: 100%" /></FormItem></Col>
        <Col :span="12">
          <FormItem label="分组 Key" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Select
              v-model:value="formData.sectionKey"
              allow-clear
              show-search
              :loading="groupLoading"
              placeholder="请选择分组编码"
              option-filter-prop="label"
              @change="handleSectionKeyChange"
            >
              <SelectOption
                v-for="group in groupMetaOptions"
                :key="group.groupCode"
                :value="group.groupCode"
                :label="`${group.groupCode} - ${group.groupTitle}`"
              >
                {{ group.groupCode }} - {{ group.groupTitle }}
              </SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="分组标题" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><Input v-model:value="formData.sectionTitle" placeholder="未选择分组时可手动输入" /></FormItem></Col>
        <Col :span="12"><FormItem label="分组排序" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><InputNumber v-model:value="formData.sectionOrder" :min="0" :max="9999" style="width: 100%" /></FormItem></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="分组容器" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Select v-model:value="formData.sectionType">
              <SelectOption value="card">Card</SelectOption>
              <SelectOption value="collapse">Collapse</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="默认展开" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Switch v-model:checked="switches.sectionOpen" />
          </FormItem>
        </Col>
      </Row>
      <FormItem label="i18n Key"><Input v-model:value="formData.i18nKey" /></FormItem>

      <div class="section-title">默认值与数据源</div>
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

      <div class="section-title">校验规则</div>
      <Row :gutter="16">
        <Col :span="12"><FormItem label="最小值" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"><InputNumber v-model:value="ruleBuilder.min" :min="0" style="width: 100%" /></FormItem></Col>
        <Col :span="12"><FormItem label="最大值" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"><InputNumber v-model:value="ruleBuilder.max" :min="0" style="width: 100%" /></FormItem></Col>
      </Row>
      <FormItem label="正则表达式"><Input v-model:value="ruleBuilder.pattern" placeholder="如 ^[A-Za-z0-9_]+$" /></FormItem>
      <FormItem label="错误提示"><Input v-model:value="ruleBuilder.message" /></FormItem>

      <div class="linkage-action-header">
        <span>可见条件</span>
        <div style="display: flex; gap: 8px">
          <Select v-model:value="visibleLogic" style="width: 120px">
            <SelectOption value="and">AND</SelectOption>
            <SelectOption value="or">OR</SelectOption>
          </Select>
          <Button size="small" type="dashed" @click="addVisibleCondition">新增条件</Button>
        </div>
      </div>
      <div
        v-for="(condition, conditionIndex) in visibleConditions"
        :key="`visible-condition-${conditionIndex}`"
        class="linkage-action-card"
      >
        <div class="linkage-action-card__title">
          <span>条件 {{ conditionIndex + 1 }}</span>
          <Button
            v-if="visibleConditions.length > 1"
            danger
            size="small"
            type="link"
            @click="removeVisibleCondition(conditionIndex)"
          >
            删除
          </Button>
        </div>
        <FormItem label="条件字段">
          <Select
            v-model:value="condition.field"
            allow-clear
            show-search
            :loading="fieldLoading"
            placeholder="请选择可见条件字段"
            option-filter-prop="label"
            @change="handleVisibleFieldChange(conditionIndex)"
          >
            <SelectOption
              v-for="item in fieldOptions"
              :key="`visible-${conditionIndex}-${item.value}`"
              :value="item.value"
              :label="item.label"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
        <Row :gutter="16">
          <Col :span="8">
            <FormItem label="条件操作符" :label-col="{ span: 14 }" :wrapper-col="{ span: 10 }">
              <Select v-model:value="condition.operator" @change="handleVisibleOperatorChange(conditionIndex)">
                <SelectOption value="hasValue">hasValue</SelectOption>
                <SelectOption value="isEmpty">isEmpty</SelectOption>
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
            <FormItem label="条件值" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <Switch
                v-if="resolveVisibleValueControlType(conditionIndex) === 'boolean'"
                v-model:checked="condition.value"
                :disabled="isValuelessVisibleOperator(condition.operator)"
              />
              <InputNumber
                v-else-if="resolveVisibleValueControlType(conditionIndex) === 'number'"
                v-model:value="condition.value"
                :disabled="isValuelessVisibleOperator(condition.operator)"
                style="width: 100%"
              />
              <Input
                v-else
                v-model:value="condition.value"
                :disabled="isValuelessVisibleOperator(condition.operator)"
              />
            </FormItem>
          </Col>
        </Row>
      </div>

      <FormItem label="联动源字段">
        <Select
          v-model:value="linkageBuilder.sourceField"
          allow-clear
          show-search
          :loading="fieldLoading"
          placeholder="请选择源字段"
          option-filter-prop="label"
        >
          <SelectOption
            v-for="item in fieldOptions"
            :key="`source-${item.value}`"
            :value="item.value"
            :label="item.label"
          >
            {{ item.label }}
          </SelectOption>
        </Select>
      </FormItem>
      <Row :gutter="16">
        <Col :span="8">
          <FormItem label="联动条件" :label-col="{ span: 14 }" :wrapper-col="{ span: 10 }">
            <Select v-model:value="linkageBuilder.operator">
              <SelectOption value="hasValue">hasValue</SelectOption>
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
          <FormItem label="条件值" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <Input v-model:value="linkageBuilder.conditionValue" :disabled="linkageBuilder.operator === 'hasValue'" />
          </FormItem>
        </Col>
      </Row>
      <div class="linkage-action-header">
        <span>联动动作</span>
        <Button size="small" type="dashed" @click="addLinkageAction">新增动作</Button>
      </div>
      <div
        v-for="(action, index) in linkageActions"
        :key="`linkage-action-${index}`"
        class="linkage-action-card"
      >
        <div class="linkage-action-card__title">
          <span>动作 {{ index + 1 }}</span>
          <Button v-if="linkageActions.length > 1" danger size="small" type="link" @click="removeLinkageAction(index)">删除</Button>
        </div>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="目标字段" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
              <Select
                v-model:value="action.targetField"
                allow-clear
                show-search
                :loading="fieldLoading"
                placeholder="请选择目标字段"
                option-filter-prop="label"
              >
                <SelectOption
                  v-for="item in fieldOptions"
                  :key="`target-${index}-${item.value}`"
                  :value="item.value"
                  :label="item.label"
                >
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="动作类型" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
              <Select v-model:value="action.action">
                <SelectOption value="set">set</SelectOption>
                <SelectOption value="clear">clear</SelectOption>
                <SelectOption value="disable">disable</SelectOption>
                <SelectOption value="enable">enable</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <FormItem label="动作值">
          <Input v-model:value="action.value" :disabled="['clear', 'disable', 'enable'].includes(action.action || '')" />
        </FormItem>
      </div>

      <FormItem label="组件属性">
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

      <FormItem label="备注"><Input.TextArea v-model:value="formData.remarks" :rows="2" /></FormItem>

      <div class="section-title">关联表配置（Lookup 虚拟列）</div>
      <div class="lookup-tip">
        配置后此字段将成为“虚拟联表列”，运行时由后端 LEFT JOIN 获取显示值。
        <br />填写关联表 tableCode + 匹配字段 + 展示字段；当前表外键可留空（默认取字段编码的 snake_case）。
        <br /><strong>展示字段支持多字段拼接</strong>：用英文逗号 <code>,</code> 分隔多个字段（例如
        <code>warehouse_code,warehouse_name</code>），后端会用 <code>❤</code> 拼接成一列展示。
      </div>
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="关联表 tableCode" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input v-model:value="formData.refTableCode" allow-clear placeholder="如 inv_warehouse" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="匹配字段" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Input v-model:value="formData.refMatchField" allow-clear placeholder="如 warehouse_code" />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="展示字段" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formData.refTargetField"
              allow-clear
              placeholder="单个: warehouse_name ；多字段拼接: warehouse_code,warehouse_name"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="本表外键" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Input v-model:value="formData.refLocalField" allow-clear placeholder="默认=字段编码，如 warehouse_code" />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="拼接分隔符" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formData.refSeparator"
              allow-clear
              :maxlength="4"
              placeholder="默认 ❤（多字段拼接时生效，1-4 字符）"
            />
          </FormItem>
        </Col>
      </Row>
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
  getColumnMetaByTableId,
  getColumnMetaById,
  updateColumnMeta,
  type ColumnMetaApi,
} from '#/api/system/columnMeta';
import { getGroupMetaList, type GroupMetaApi } from '#/api/system/groupMeta';
import type { Rule } from 'ant-design-vue/es/form';

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
  showInImport: 1,
  sortable: 0,
  width: 120,
  colSpan: 24,
  defaultValue: '',
  placeholder: '',
  sortOrder: 1,
  status: 1,
  sectionKey: '',
  sectionTitle: '',
  sectionOrder: 0,
  sectionType: 'card',
  sectionOpen: 1,
  i18nKey: '',
  dataSource: '',
  apiUrl: '',
  labelField: '',
  valueField: '',
  rulesJson: '',
  visibleCondition: '',
  linkageJson: '',
  componentProps: '',
  remarks: '',
  refTableCode: '',
  refMatchField: '',
  refTargetField: '',
  refLocalField: '',
  refSeparator: '',
});

const switches = reactive({
  required: false,
  readonly: false,
  editReadonly: false,
  isUnique: false,
  searchable: false,
  showInList: true,
  showInForm: true,
  showInExport: false,
  showInImport: true,
  sortable: false,
  status: true,
  sectionOpen: true,
});

const ruleBuilder = reactive<{ min?: number; max?: number; pattern?: string; message?: string }>({});
type LinkageActionBuilder = { targetField?: string; action?: string; value?: string };
type FieldOption = {
  value: string;
  label: string;
  formType?: string;
  dataType?: string;
};
type VisibleConditionBuilder = {
  field?: string;
  operator?: string;
  value?: any;
};

const linkageBuilder = reactive<{ sourceField?: string; operator?: string; conditionValue?: string }>({
  operator: 'hasValue',
});
const linkageActions = ref<LinkageActionBuilder[]>([
  { targetField: '', action: 'set', value: '' },
]);
const fieldLoading = ref(false);
const fieldOptions = ref<FieldOption[]>([]);
const groupLoading = ref(false);
const groupMetaOptions = ref<GroupMetaApi.GroupMeta[]>([]);
const visibleLogic = ref<'and' | 'or'>('and');
const visibleConditions = ref<VisibleConditionBuilder[]>([
  { field: '', operator: '==', value: '' },
]);
const componentBuilder = reactive<{ allowClear?: boolean; multiple?: boolean; showCount?: boolean; maxLength?: number; rows?: number }>({
  allowClear: true,
  multiple: false,
  showCount: false,
});

const uploadBuilder = reactive<{ uploadType?: string; listType?: string; maxCount?: number; accept?: string; action?: string }>({
  uploadType: '',
  listType: 'text',
  maxCount: 1,
  accept: '',
  action: '',
});

const formRules: Record<string, Rule[]> = {
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
  sortOrder: [{ required: true, message: '璇疯緭鍏ユ帓搴忓彿', trigger: 'blur' }],
};

function resetBuilders() {
  Object.assign(ruleBuilder, { min: undefined, max: undefined, pattern: '', message: '' });
  visibleLogic.value = 'and';
  visibleConditions.value = [{ field: '', operator: '==', value: '' }];
  Object.assign(linkageBuilder, { sourceField: '', operator: 'hasValue', conditionValue: '' });
  linkageActions.value = [{ targetField: '', action: 'set', value: '' }];
  Object.assign(componentBuilder, {
    allowClear: true,
    multiple: false,
    showCount: false,
    maxLength: undefined,
    rows: undefined,
  });
  Object.assign(uploadBuilder, { uploadType: '', listType: 'text', maxCount: 1, accept: '', action: '' });
}

function syncSwitchFromForm() {
  switches.required = Number(formData.required || 0) === 1;
  switches.readonly = Number(formData.readonly || 0) === 1;
  switches.editReadonly = Number(formData.editReadonly || 0) === 1;
  switches.isUnique = Number(formData.isUnique || 0) === 1;
  switches.searchable = Number(formData.searchable || 0) === 1;
  switches.showInList = Number(formData.showInList || 0) === 1;
  switches.showInForm = Number(formData.showInForm || 0) === 1;
  switches.showInExport = Number(formData.showInExport || 0) === 1;
  switches.showInImport = Number(formData.showInImport ?? 1) === 1;
  switches.sortable = Number(formData.sortable || 0) === 1;
  switches.status = Number(formData.status || 0) === 1;
  switches.sectionOpen = Number(formData.sectionOpen ?? 1) === 1;
}

function syncFormFromSwitch() {
  formData.required = switches.required ? 1 : 0;
  formData.readonly = switches.readonly ? 1 : 0;
  formData.editReadonly = switches.editReadonly ? 1 : 0;
  formData.isUnique = switches.isUnique ? 1 : 0;
  formData.searchable = switches.searchable ? 1 : 0;
  formData.showInList = switches.showInList ? 1 : 0;
  formData.showInForm = switches.showInForm ? 1 : 0;
  formData.showInExport = switches.showInExport ? 1 : 0;
  formData.showInImport = switches.showInImport ? 1 : 0;
  formData.sortable = switches.sortable ? 1 : 0;
  formData.status = switches.status ? 1 : 0;
  formData.sectionOpen = switches.sectionOpen ? 1 : 0;
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
    if (Array.isArray((visible as any).conditions)) {
      visibleLogic.value = ((visible as any).logic || 'and') === 'or' ? 'or' : 'and';
      visibleConditions.value = (visible as any).conditions
        .map((condition: any) => ({
          field: condition?.field ?? '',
          operator: condition?.operator || '==',
          value: condition?.value,
        }))
        .filter((condition: VisibleConditionBuilder) => !!condition.field);
      if (visibleConditions.value.length === 0) {
        visibleConditions.value = [{ field: '', operator: '==', value: '' }];
      }
    } else {
      visibleConditions.value = [{
        field: (visible as any).field ?? '',
        operator: (visible as any).operator || '==',
        value: (visible as any).value,
      }];
    }
  }

  const linkage = parseJsonObject(formData.linkageJson);
  if (linkage && typeof linkage === 'object') {
    if (linkage.trigger || linkage.actions) {
      linkageBuilder.sourceField = linkage.trigger?.field;
      linkageBuilder.operator = linkage.trigger?.operator || 'hasValue';
      linkageBuilder.conditionValue = linkage.trigger?.value != null ? String(linkage.trigger.value) : '';
      linkageActions.value = Array.isArray(linkage.actions) && linkage.actions.length > 0
        ? linkage.actions.map((action: any) => ({
          targetField: action?.targetField ?? '',
          action: action?.action || 'set',
          value: action?.value != null ? String(action.value) : '',
        }))
        : [{ targetField: '', action: 'set', value: '' }];
    } else {
      linkageBuilder.sourceField = linkage.sourceField;
      linkageBuilder.operator = linkage.operator || (linkage.conditionValue != null ? '==' : 'hasValue');
      linkageBuilder.conditionValue = linkage.conditionValue != null ? String(linkage.conditionValue) : '';
      linkageActions.value = [{
        targetField: linkage.targetField ?? '',
        action: linkage.action || 'set',
        value: linkage.value != null ? String(linkage.value) : '',
      }];
    }
  }

  const comp = parseJsonObject(formData.componentProps);
  if (comp && typeof comp === 'object') {
    componentBuilder.allowClear = !!comp.allowClear;
    componentBuilder.multiple = !!comp.multiple;
    componentBuilder.showCount = !!comp.showCount;
    componentBuilder.maxLength = comp.maxLength;
    componentBuilder.rows = comp.rows;
    if (formData.formType === 'upload') {
      uploadBuilder.uploadType = comp.uploadType || '';
      uploadBuilder.listType = comp.listType || 'text';
      uploadBuilder.maxCount = comp.maxCount ?? 1;
      uploadBuilder.accept = comp.accept || '';
      uploadBuilder.action = comp.action || '';
    }
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
  const conditions = visibleConditions.value
    .filter((condition) => !!condition.field)
    .map((condition) => {
      const operator = condition.operator || '==';
      if (operator === 'hasValue' || operator === 'isEmpty') {
        return {
          field: condition.field,
          operator,
        };
      }
      return {
        field: condition.field,
        operator,
        value: condition.value ?? '',
      };
    });

  if (conditions.length === 0) return '';
  if (conditions.length === 1) {
    return JSON.stringify(conditions[0]);
  }
  return JSON.stringify({
    logic: visibleLogic.value || 'and',
    conditions,
  });
}

function isValuelessVisibleOperator(operator?: string) {
  return operator === 'hasValue' || operator === 'isEmpty';
}

function resolveVisibleValueControlType(index: number): 'boolean' | 'number' | 'text' {
  const fieldCode = visibleConditions.value[index]?.field;
  const fieldOption = fieldOptions.value.find((item) => item.value === fieldCode);
  const formType = String(fieldOption?.formType || '').toLowerCase();
  const dataType = String(fieldOption?.dataType || '').toLowerCase();
  if (formType === 'switch' || formType === 'boolean' || dataType === 'boolean') return 'boolean';
  if (['number', 'inputnumber'].includes(formType) || ['int', 'integer', 'long', 'float', 'double', 'decimal', 'bigdecimal'].includes(dataType)) {
    return 'number';
  }
  return 'text';
}

function normalizeVisibleConditionValue(index: number) {
  const condition = visibleConditions.value[index];
  if (!condition) return;
  if (isValuelessVisibleOperator(condition.operator)) {
    condition.value = undefined;
    return;
  }
  const valueControlType = resolveVisibleValueControlType(index);
  if (valueControlType === 'boolean') {
    condition.value = condition.value === true || condition.value === 'true' || condition.value === 1 || condition.value === '1';
    return;
  }
  if (valueControlType === 'number') {
    if (condition.value === '' || condition.value == null) return;
    const value = Number(condition.value);
    condition.value = Number.isNaN(value) ? undefined : value;
  }
}

function handleVisibleFieldChange(index: number) {
  normalizeVisibleConditionValue(index);
}

function handleVisibleOperatorChange(index: number) {
  normalizeVisibleConditionValue(index);
}

function addVisibleCondition() {
  visibleConditions.value.push({ field: '', operator: '==', value: '' });
}

function removeVisibleCondition(index: number) {
  if (visibleConditions.value.length <= 1) {
    visibleConditions.value = [{ field: '', operator: '==', value: '' }];
    return;
  }
  visibleConditions.value.splice(index, 1);
}

function buildLinkageJson() {
  const actions = linkageActions.value
    .filter((action) => action.targetField && action.action)
    .map((action) => ({
      targetField: action.targetField,
      action: action.action || 'set',
      value: action.value ?? '',
    }));
  if (!linkageBuilder.sourceField || actions.length === 0) return '';
  const operator = linkageBuilder.operator || 'hasValue';
  const trigger: Record<string, any> = {
    field: linkageBuilder.sourceField,
  };
  if (operator !== 'hasValue') {
    trigger.operator = operator;
    trigger.value = linkageBuilder.conditionValue ?? '';
  }
  return JSON.stringify({
    trigger,
    actions,
  });
}

function addLinkageAction() {
  linkageActions.value.push({ targetField: '', action: 'set', value: '' });
}

function removeLinkageAction(index: number) {
  if (linkageActions.value.length <= 1) {
    linkageActions.value = [{ targetField: '', action: 'set', value: '' }];
    return;
  }
  linkageActions.value.splice(index, 1);
}

function buildComponentPropsJson() {
  if (formData.formType === 'upload') {
    const payload: Record<string, any> = {};
    if (uploadBuilder.uploadType) payload.uploadType = uploadBuilder.uploadType;
    if (uploadBuilder.listType) payload.listType = uploadBuilder.listType;
    if (uploadBuilder.maxCount != null) payload.maxCount = uploadBuilder.maxCount;
    if (uploadBuilder.accept) payload.accept = uploadBuilder.accept;
    if (uploadBuilder.action) payload.action = uploadBuilder.action;
    return Object.keys(payload).length ? JSON.stringify(payload) : '';
  }
  const payload: Record<string, any> = {
    allowClear: !!componentBuilder.allowClear,
    multiple: !!componentBuilder.multiple,
    showCount: !!componentBuilder.showCount,
  };
  if (componentBuilder.maxLength != null) payload.maxLength = componentBuilder.maxLength;
  if (componentBuilder.rows != null) payload.rows = componentBuilder.rows;
  return Object.keys(payload).length ? JSON.stringify(payload) : '';
}

function getActiveTableCode() {
  return (props.tableCode || formData.tableCode || '').trim();
}

async function loadFieldOptions() {
  const tableCode = getActiveTableCode();
  if (!tableCode) {
    fieldOptions.value = [];
    return;
  }
  fieldLoading.value = true;
  try {
    const list = await getColumnMetaByTableId(tableCode);
    fieldOptions.value = (list || []).map((item: any) => {
      const field = String(item?.field || '').trim();
      const title = String(item?.title || item?.columnName || field || '').trim();
      return {
        value: field,
        label: title ? `${field} - ${title}` : field,
        formType: item?.formType,
        dataType: item?.dataType,
      };
    }).filter((item) => !!item.value);
  } catch {
    fieldOptions.value = [];
  } finally {
    fieldLoading.value = false;
  }
}

async function loadGroupMetaOptions() {
  const tableCode = getActiveTableCode();
  if (!tableCode) {
    groupMetaOptions.value = [];
    return;
  }
  groupLoading.value = true;
  try {
    const res = await getGroupMetaList(tableCode);
    groupMetaOptions.value = (res.rows || [])
      .filter((item) => Number(item.status ?? 1) === 1)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  } catch {
    groupMetaOptions.value = [];
  } finally {
    groupLoading.value = false;
  }
}

function handleSectionKeyChange(sectionKey?: string) {
  if (!sectionKey) return;
  const selected = groupMetaOptions.value.find((item) => item.groupCode === sectionKey);
  if (!selected) return;
  formData.sectionTitle = selected.groupTitle ?? '';
  formData.sectionOrder = Number(selected.sortOrder ?? 0);
  formData.sectionType = selected.groupType ?? 'card';
  formData.sectionOpen = Number(selected.defaultOpen ?? 1);
  syncSwitchFromForm();
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
    readonly: 0,
    editReadonly: 0,
    isUnique: 0,
    searchable: 0,
    showInList: 1,
    showInForm: 1,
    showInExport: 0,
    showInImport: 1,
    sortable: 0,
    width: 120,
    colSpan: 24,
    defaultValue: '',
    placeholder: '',
    sortOrder: 1,
    status: 1,
    sectionKey: '',
    sectionTitle: '',
    sectionOrder: 0,
    sectionType: 'card',
    sectionOpen: 1,
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
    refTableCode: '',
    refMatchField: '',
    refTargetField: '',
    refLocalField: '',
    refSeparator: '',
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
      /** 未填则传 null，与库 col_span IS NULL、接口 colSpan:null 一致 */
      colSpan: formData.colSpan === undefined || formData.colSpan === null ? null : formData.colSpan,
      tableCode: props.tableCode || formData.tableCode,
      field: formData.field?.trim(),
      title: formData.title?.trim(),
      dictType: formData.dictType?.trim() || '',
      defaultValue: formData.defaultValue ?? '',
      placeholder: formData.placeholder ?? '',
      readonly: formData.readonly ?? 0,
      editReadonly: formData.editReadonly ?? 0,
      sectionKey: formData.sectionKey ?? '',
      sectionTitle: formData.sectionTitle ?? '',
      sectionOrder: formData.sectionOrder ?? 0,
      sectionType: formData.sectionType ?? 'card',
      sectionOpen: formData.sectionOpen ?? 1,
      i18nKey: formData.i18nKey ?? '',
      dataSource: formData.dataSource ?? '',
      apiUrl: formData.apiUrl ?? '',
      labelField: formData.labelField ?? '',
      valueField: formData.valueField ?? '',
      remarks: formData.remarks ?? '',
      refTableCode: (formData.refTableCode || '').trim(),
      refMatchField: (formData.refMatchField || '').trim(),
      refTargetField: (formData.refTargetField || '').trim(),
      refLocalField: (formData.refLocalField || '').trim(),
      refSeparator: (formData.refSeparator || '').trim(),
    };

    if (isEdit.value) {
      await updateColumnMeta(payload);
      message.success('保存成功');
    } else {
      await addColumnMeta(payload);
      message.success('新增成功');
    }

    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || (isEdit.value ? '保存失败' : '新增失败'));
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

watch(visible, (val) => {
  if (!val) return;
  loadFieldOptions();
  loadGroupMetaOptions();
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
      return;
    }
    formData.tableCode = code || '';
    loadFieldOptions();
    loadGroupMetaOptions();
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

.linkage-action-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #374151;
  font-weight: 600;
}

.linkage-action-card {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
}

.linkage-action-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.lookup-tip {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #f9fafb;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}
</style>


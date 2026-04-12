<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="760px"
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
      <FormItem label="表编码" name="tableCode">
        <Input v-model:value="formData.tableCode" disabled />
      </FormItem>
      <FormItem label="操作编码" name="operationCode">
        <Input
          v-model:value="formData.operationCode"
          :maxlength="50"
          :disabled="isEdit"
          placeholder="如 create / export"
        />
      </FormItem>
      <FormItem label="操作名称" name="operationName">
        <Input v-model:value="formData.operationName" :maxlength="100" />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="按钮类型" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" name="operationType">
            <Select v-model:value="formData.operationType">
              <SelectOption value="button">button</SelectOption>
              <SelectOption value="link">link</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="位置" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" name="position">
            <Select v-model:value="formData.position">
              <SelectOption value="toolbar">toolbar</SelectOption>
              <SelectOption value="row">row</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="图标" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input v-model:value="formData.icon" placeholder="material-symbols:add" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="排序" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" name="sortOrder">
            <InputNumber v-model:value="formData.sortOrder" :min="1" :max="9999" style="width: 100%" />
          </FormItem>
        </Col>
      </Row>

      <FormItem label="权限标识">
        <Input
          v-model:value="formData.permission"
          :maxlength="150"
          placeholder="如 system:warehouse:add"
        />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="事件类型" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" name="eventType">
            <Select v-model:value="formData.eventType" @change="handleEventTypeChange">
              <SelectOption value="builtin">builtin</SelectOption>
              <SelectOption value="api">api</SelectOption>
              <SelectOption value="download">download</SelectOption>
              <SelectOption value="redirect">redirect</SelectOption>
              <SelectOption value="modal">modal</SelectOption>
              <SelectOption value="drawer">drawer</SelectOption>
              <SelectOption value="custom">custom</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="状态" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
            <Switch v-model:checked="statusChecked" />
          </FormItem>
        </Col>
      </Row>

      <div class="config-block">
        <div class="config-title">事件配置</div>

        <template v-if="formData.eventType === 'builtin'">
          <FormItem label="内置处理器">
            <Select v-model:value="eventConfig.builtin.handler">
              <SelectOption value="create">create</SelectOption>
              <SelectOption value="add">add</SelectOption>
              <SelectOption value="edit">edit</SelectOption>
              <SelectOption value="delete">delete</SelectOption>
              <SelectOption value="toggle">toggle</SelectOption>
              <SelectOption value="export">export</SelectOption>
            </Select>
          </FormItem>
        </template>

        <template v-else-if="formData.eventType === 'api'">
          <FormItem label="URL"><Input v-model:value="eventConfig.api.url" /></FormItem>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="Method" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
                <Select v-model:value="eventConfig.api.method">
                  <SelectOption value="GET">GET</SelectOption>
                  <SelectOption value="POST">POST</SelectOption>
                  <SelectOption value="PUT">PUT</SelectOption>
                  <SelectOption value="DELETE">DELETE</SelectOption>
                </Select>
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="Payload" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
                <Select v-model:value="eventConfig.api.payloadType">
                  <SelectOption value="none">none</SelectOption>
                  <SelectOption value="filtered">filtered</SelectOption>
                  <SelectOption value="selected">selected</SelectOption>
                  <SelectOption value="currentPage">currentPage</SelectOption>
                  <SelectOption value="all">all</SelectOption>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <FormItem label="成功提示"><Input v-model:value="eventConfig.api.successMessage" /></FormItem>
          <FormItem label="失败提示"><Input v-model:value="eventConfig.api.failMessage" /></FormItem>
        </template>

        <template v-else-if="formData.eventType === 'download'">
          <FormItem label="URL"><Input v-model:value="eventConfig.download.url" /></FormItem>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="Method" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
                <Select v-model:value="eventConfig.download.method">
                  <SelectOption value="GET">GET</SelectOption>
                  <SelectOption value="POST">POST</SelectOption>
                </Select>
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="Payload" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
                <Select v-model:value="eventConfig.download.payloadType">
                  <SelectOption value="none">none</SelectOption>
                  <SelectOption value="filtered">filtered</SelectOption>
                  <SelectOption value="selected">selected</SelectOption>
                  <SelectOption value="currentPage">currentPage</SelectOption>
                  <SelectOption value="all">all</SelectOption>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <FormItem label="文件名"><Input v-model:value="eventConfig.download.fileName" placeholder="xxx.xlsx" /></FormItem>
        </template>

        <template v-else-if="formData.eventType === 'redirect'">
          <FormItem label="目标路径"><Input v-model:value="eventConfig.redirect.path" placeholder="/path/to/page" /></FormItem>
          <FormItem label="Query 参数">
            <div class="kv-list">
              <div v-for="(item, idx) in eventConfig.redirect.query" :key="idx" class="kv-item">
                <Input v-model:value="item.key" placeholder="key" />
                <Input v-model:value="item.value" placeholder="value" />
                <Button danger type="text" @click="removeRedirectQuery(idx)">删除</Button>
              </div>
            </div>
            <Button type="dashed" block @click="addRedirectQuery">新增参数</Button>
          </FormItem>
        </template>

        <template v-else>
          <FormItem label="配置说明">
            <Input v-model:value="eventConfig.other.message" placeholder="该事件类型暂未细化，先记录说明" />
          </FormItem>
        </template>
      </div>

      <FormItem label="确认文案">
        <Input v-model:value="formData.confirmMessage" placeholder="需要二次确认时显示" />
      </FormItem>
      <FormItem label="关联菜单ID">
        <InputNumber v-model:value="formData.menuId" :min="1" style="width: 100%" />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Button,
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
  addOperationMeta,
  getOperationMetaById,
  updateOperationMeta,
  type OperationMetaApi,
} from '#/api/system/operationMeta';

const props = defineProps<{
  mode: 'add' | 'edit';
  data?: OperationMetaApi.OperationMeta | null;
  tableCode?: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => props.mode === 'edit');
const modalTitle = computed(() => (isEdit.value ? '编辑操作元数据' : '新增操作元数据'));

const formData = reactive<OperationMetaApi.OperationMeta>({
  id: undefined,
  tableCode: '',
  operationCode: '',
  operationName: '',
  operationType: 'button',
  icon: '',
  permission: '',
  position: 'toolbar',
  sortOrder: 1,
  status: 1,
  menuId: undefined,
  eventType: 'builtin',
  eventConfig: '',
  confirmMessage: '',
});

const statusChecked = computed({
  get: () => Number(formData.status ?? 1) === 1,
  set: (val: boolean) => {
    formData.status = val ? 1 : 0;
  },
});

type Kv = { key: string; value: string };

const eventConfig = reactive({
  builtin: { handler: 'create' },
  api: {
    url: '',
    method: 'POST',
    payloadType: 'filtered',
    successMessage: '',
    failMessage: '',
  },
  download: {
    url: '',
    method: 'GET',
    payloadType: 'filtered',
    fileName: '',
  },
  redirect: {
    path: '',
    query: [] as Kv[],
  },
  other: {
    message: '',
  },
});

const formRules = {
  tableCode: [{ required: true, message: '请选择表编码', trigger: 'change' }],
  operationCode: [
    { required: true, message: '请输入操作编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '操作编码格式不正确', trigger: 'blur' },
  ],
  operationName: [{ required: true, message: '请输入操作名称', trigger: 'blur' }],
  operationType: [{ required: true, message: '请选择按钮类型', trigger: 'change' }],
  position: [{ required: true, message: '请选择位置', trigger: 'change' }],
  sortOrder: [{ required: true, message: '请输入排序号', trigger: 'blur' }],
  eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
};

function resetEventConfig() {
  eventConfig.builtin.handler = 'create';
  eventConfig.api = {
    url: '',
    method: 'POST',
    payloadType: 'filtered',
    successMessage: '',
    failMessage: '',
  };
  eventConfig.download = {
    url: '',
    method: 'GET',
    payloadType: 'filtered',
    fileName: '',
  };
  eventConfig.redirect = {
    path: '',
    query: [],
  };
  eventConfig.other = {
    message: '',
  };
}

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: undefined,
    tableCode: props.tableCode || '',
    operationCode: '',
    operationName: '',
    operationType: 'button',
    icon: '',
    permission: '',
    position: 'toolbar',
    sortOrder: 1,
    status: 1,
    menuId: undefined,
    eventType: 'builtin',
    eventConfig: '',
    confirmMessage: '',
  });
  resetEventConfig();
}

function addRedirectQuery() {
  eventConfig.redirect.query.push({ key: '', value: '' });
}

function removeRedirectQuery(index: number) {
  eventConfig.redirect.query.splice(index, 1);
}

function handleEventTypeChange() {
  resetEventConfig();
}

function parseEventConfigByType(raw: string | undefined, eventType: string | undefined) {
  if (!raw) return;
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (eventType === 'builtin' && parsed?.handler) {
    eventConfig.builtin.handler = String(parsed.handler);
    return;
  }
  if (eventType === 'api') {
    eventConfig.api.url = parsed?.url ?? '';
    eventConfig.api.method = parsed?.method ?? 'POST';
    eventConfig.api.payloadType = parsed?.payloadType ?? 'filtered';
    eventConfig.api.successMessage = parsed?.successMessage ?? '';
    eventConfig.api.failMessage = parsed?.failMessage ?? '';
    return;
  }
  if (eventType === 'download') {
    eventConfig.download.url = parsed?.url ?? '';
    eventConfig.download.method = parsed?.method ?? 'GET';
    eventConfig.download.payloadType = parsed?.payloadType ?? 'filtered';
    eventConfig.download.fileName = parsed?.fileName ?? '';
    return;
  }
  if (eventType === 'redirect') {
    eventConfig.redirect.path = parsed?.path ?? '';
    const query = parsed?.query ?? {};
    eventConfig.redirect.query = Object.entries(query).map(([k, v]) => ({
      key: String(k),
      value: String(v ?? ''),
    }));
    return;
  }

  eventConfig.other.message = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
}

function buildEventConfigString() {
  const type = formData.eventType;
  let config: any = {};

  if (type === 'builtin') {
    config = { handler: eventConfig.builtin.handler };
  } else if (type === 'api') {
    config = {
      url: eventConfig.api.url,
      method: eventConfig.api.method,
      payloadType: eventConfig.api.payloadType,
      successMessage: eventConfig.api.successMessage,
      failMessage: eventConfig.api.failMessage,
    };
  } else if (type === 'download') {
    config = {
      url: eventConfig.download.url,
      method: eventConfig.download.method,
      payloadType: eventConfig.download.payloadType,
      fileName: eventConfig.download.fileName,
    };
  } else if (type === 'redirect') {
    const query = eventConfig.redirect.query.reduce<Record<string, string>>((acc, item) => {
      const key = item.key?.trim();
      if (!key) return acc;
      acc[key] = item.value ?? '';
      return acc;
    }, {});
    config = {
      path: eventConfig.redirect.path,
      query,
    };
  } else {
    config = {
      message: eventConfig.other.message,
    };
  }

  return JSON.stringify(config);
}

async function loadDetail(id: number) {
  try {
    loading.value = true;
    const detail = await getOperationMetaById(id);
    if (!detail) return;
    Object.assign(formData, detail);
    resetEventConfig();
    parseEventConfigByType(detail.eventConfig, detail.eventType);
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

    const payload: Partial<OperationMetaApi.OperationMeta> = {
      ...formData,
      tableCode: props.tableCode || formData.tableCode,
      operationCode: formData.operationCode?.trim(),
      operationName: formData.operationName?.trim(),
      eventConfig: buildEventConfigString(),
    };

    if (isEdit.value && payload.id) {
      await updateOperationMeta(payload.id, payload);
      message.success('更新成功');
    } else {
      await addOperationMeta(payload);
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
.config-block {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.config-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.kv-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.kv-item {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
}
</style>

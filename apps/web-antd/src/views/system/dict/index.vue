<template>
  <div class="p-5 bg-white">
    <BasicGridPage
      ref="gridRef"
      :form-options="formOptions"
      :grid-options="gridOptions"
      :grid-events="gridEvents"
    >
      <template #toolbar-tools>
        <Button type="primary" class="btn-add" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="mr-1" />
          新增
        </Button>
        <Button class="btn-edit" :disabled="selectedRowKeys.length !== 1" @click="handleEditSelected">
          修改
        </Button>
        <Popconfirm
          v-if="selectedRowKeys.length"
          title="是否确认删除选中的字典类型?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleBatchDelete"
        >
          <Button danger class="btn-danger">删除</Button>
        </Popconfirm>
        <Button v-else danger class="btn-danger" disabled>删除</Button>
        <Button class="btn-export" @click="handleExport">导出</Button>
        <Button class="btn-refresh" @click="handleRefreshCache">刷新缓存</Button>
      </template>

      <template #status="{ row }">
        <Tag :color="row.status === '0' ? 'processing' : 'default'">
          {{ row.status === '0' ? '正常' : '停用' }}
        </Tag>
      </template>

      <template #action="{ row }">
        <Button type="link" class="p-0 link-edit" @click="handleEdit(row as DictTypeItem)">修改</Button>
        <Popconfirm
          title="是否确认删除该字典类型?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleDeleteOne(row as DictTypeItem)"
        >
          <Button type="link" danger class="p-0 link-delete">删除</Button>
        </Popconfirm>
      </template>
    </BasicGridPage>

    <Modal
      v-model:open="modalVisible"
      :title="modalMode === 'add' ? '添加字典类型' : '修改字典类型'"
      width="500px"
      destroy-on-close
      :confirm-loading="modalSubmitting"
      :after-close="resetForm"
      @ok="handleModalOk"
    >
      <Form ref="formRef" :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem v-if="modalMode === 'edit'" name="dictId" label="字典编号" hidden>
          <InputNumber v-model:value="formState.dictId" />
        </FormItem>
        <FormItem name="dictName" label="字典名称" :rules="[{ required: true, message: '请输入字典名称' }]">
          <Input v-model:value="formState.dictName" placeholder="请输入字典名称" />
        </FormItem>
        <FormItem name="dictType" label="字典类型" :rules="[{ required: true, message: '请输入字典类型' }]">
          <Input v-model:value="formState.dictType" placeholder="请输入字典类型" />
        </FormItem>
        <FormItem name="status" label="状态" :rules="[{ required: true }]">
          <RadioGroup v-model:value="formState.status">
            <Radio value="0">正常</Radio>
            <Radio value="1">停用</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem name="remarks" label="备注">
          <Textarea v-model:value="formState.remarks" placeholder="请输入备注" :rows="3" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import {
  Button,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  RadioGroup,
  Tag,
} from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, nowTimestamp } from '@vben/utils';
import { message } from 'ant-design-vue';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import BasicGridPage from '#/components/BasicGridPage.vue';
import {
  getDictTypeList,
  addDictType,
  getDictTypeDetail,
  editDictType,
  deleteDictType,
  exportDictType,
  refreshDictCache,
  type DictTypeItem,
  type DictTypeListParams,
} from '#/api';

const RangePicker = DatePicker.RangePicker;
const Textarea = Input.TextArea;

const gridRef = ref<InstanceType<typeof BasicGridPage> | null>(null);
const selectedRowKeys = ref<(string | number)[]>([]);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-4',
  fieldMappingTime: [['createTimeRange', ['params[beginTime]', 'params[endTime]']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'dictName',
      label: '字典名称',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入字典名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'dictType',
      label: '字典类型',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入字典类型',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      formItemClass: 'col-span-1',
      labelWidth: 60,
      componentProps: {
        allowClear: true,
        options: [
          { label: '正常', value: '0' },
          { label: '停用', value: '1' },
        ],
        placeholder: '字典状态',
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createTimeRange',
      label: '创建时间',
      formItemClass: 'col-span-1',
      labelWidth: 80,
    },
  ],
};

const gridOptions: VxeTableGridOptions<DictTypeItem> = {
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'dictId', title: '字典编号', width: 100 },
    { field: 'dictName', title: '字典名称', width: 160 },
    { field: 'dictType', title: '字典类型', width: 180 },
    { field: 'status', title: '状态', width: 90, slots: { default: 'status' } },
    { field: 'remarks', title: '备注', minWidth: 160 },
    { field: 'createTime', title: '创建时间', width: 180 },
    {
      field: 'action',
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const params: DictTypeListParams = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          dictName: formValues.dictName?.trim() || undefined,
          dictType: formValues.dictType?.trim() || undefined,
          status: formValues.status,
          params: formValues.params,
        };
        const res = (await getDictTypeList(params)) as any;
        const body = res?.rows ? res : res?.data ?? res;
        return {
          total: body?.total ?? 0,
          items: body?.rows ?? [],
        };
      },
    },
  },
};

const gridEvents = {
  checkboxChange: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: DictTypeItem) => item.dictId);
  },
  checkboxAll: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: DictTypeItem) => item.dictId);
  },
};

const modalVisible = ref(false);
const modalSubmitting = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const formRef = ref();
const formState = reactive<{
  dictId?: number;
  dictName: string;
  dictType: string;
  status: string;
  remarks?: string;
}>({
  dictName: '',
  dictType: '',
  status: '0',
  remarks: '',
});

async function checkDictTypeUnique(dictType: string, currentId?: number) {
  const params: DictTypeListParams = {
    pageNum: 1,
    pageSize: 100,
    dictType: dictType.trim(),
  } as any;
  const res = (await getDictTypeList(params)) as any;
  const body = res?.rows ? res : res?.data ?? res;
  const list: DictTypeItem[] = body?.rows ?? [];
  if (!list.length) return true;
  // 编辑时允许和自己相同，新增时只要有就算重复
  if (currentId != null) {
    return !list.some((item) => item.dictId !== currentId && item.dictType === dictType);
  }
  return false;
}

function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys;
}

function resetForm() {
  formState.dictId = undefined;
  formState.dictName = '';
  formState.dictType = '';
  formState.status = '0';
  formState.remarks = '';
}

function handleAdd() {
  modalMode.value = 'add';
  resetForm();
  modalVisible.value = true;
}

async function handleEdit(record: DictTypeItem) {
  modalMode.value = 'edit';
  try {
    const res = (await getDictTypeDetail(record.dictId)) as any;
    const detail = res?.data ?? res ?? record;
    formState.dictId = detail.dictId;
    formState.dictName = detail.dictName ?? '';
    formState.dictType = detail.dictType ?? '';
    formState.status = detail.status ?? '0';
    formState.remarks = detail.remarks ?? '';
    modalVisible.value = true;
  } catch (e: any) {
    message.error(e?.message ?? '获取字典详情失败');
  }
}

function handleEditSelected() {
  if (selectedRowKeys.value.length !== 1) {
    message.warning('请选择一条记录进行修改');
    return;
  }
  const grid = gridRef.value?.gridApi?.grid;
  const rows = (grid?.getCheckboxRecords?.() || []) as DictTypeItem[];
  const record = rows.find((r) => r.dictId === selectedRowKeys.value[0]);
  if (record) {
    handleEdit(record);
  }
}

function handleModalOk() {
  formRef.value
    ?.validate()
    .then(async () => {
      const pattern = /^[a-z][a-z0-9_]*$/;
      const dictTypeVal = formState.dictType?.trim?.() ?? '';
      if (!pattern.test(dictTypeVal)) {
        message.error('字典类型必须以小写字母开头，只能包含小写字母、数字和下划线');
        return;
      }
      // 校验字典类型唯一性（新增和编辑都不能重复）
      const unique = await checkDictTypeUnique(
        dictTypeVal,
        modalMode.value === 'edit' ? formState.dictId : undefined,
      );
      if (!unique) {
        message.error('字典类型已存在，不能重复');
        return;
      }
      modalSubmitting.value = true;
      try {
        if (modalMode.value === 'add') {
          await addDictType({
            dictName: formState.dictName,
            dictType: formState.dictType,
            status: formState.status,
            remarks: formState.remarks || undefined,
          });
          message.success('新增成功');
        } else {
          if (formState.dictId == null) {
            message.error('缺少字典编号');
            return;
          }
          await editDictType({
            dictId: formState.dictId,
            dictName: formState.dictName,
            dictType: formState.dictType,
            status: formState.status,
            remarks: formState.remarks || undefined,
          });
          message.success('修改成功');
        }
        modalVisible.value = false;
        gridRef.value?.gridApi?.reload();
      } catch (e: any) {
        message.error(e?.message ?? (modalMode.value === 'add' ? '新增失败' : '修改失败'));
      } finally {
        modalSubmitting.value = false;
      }
    })
    .catch(() => {});
}

async function handleDeleteOne(record: DictTypeItem) {
  try {
    await deleteDictType(record.dictId);
    message.success('删除成功');
    gridRef.value?.gridApi?.reload();
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) return;
  try {
    await deleteDictType(selectedRowKeys.value as number[]);
    message.success('删除成功');
    selectedRowKeys.value = [];
    gridRef.value?.gridApi?.reload();
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

async function handleExport() {  
  try {
    const formValues = await gridRef.value?.gridApi?.formApi?.getValues?.();
    const range = formValues?.createTimeRange as [Dayjs, Dayjs] | undefined;
    const params: DictTypeListParams = {
      dictName: formValues?.dictName?.trim() || undefined,
      dictType: formValues?.dictType?.trim() || undefined,
      status: formValues?.status,
      params:
        range?.[0] && range?.[1]
          ? { beginTime: range[0].format('YYYY-MM-DD'), endTime: range[1].format('YYYY-MM-DD') }
          : undefined,
    };
    const blob = (await exportDictType(params)) as Blob;
    downloadFileFromBlob({
      fileName: `字典类型_${nowTimestamp()}.xlsx`,
      source: blob,
    });
    message.success('导出成功');
  } catch (e: any) {
    message.error(e?.message ?? '导出失败');
  }
}

async function handleRefreshCache() {
  try {
    await refreshDictCache();
    message.success('刷新缓存成功');
  } catch (e: any) {
    message.error(e?.message ?? '刷新缓存失败');
  }
}
</script>

<style scoped>
.btn-add,
.btn-edit,
.btn-danger,
.btn-export,
.btn-refresh {
  margin-right: 8px;
}

.btn-refresh {
  margin-right: 0;
}

.btn-add {
  background: #1890ff;
  color: #fff;
}
.btn-edit:not(:disabled) {
  background: #52c41a;
  color: #fff;
  border-color: #52c41a;
}
.btn-export {
  background: #13c2c2;
  color: #fff;
  border-color: #13c2c2;
}
.btn-refresh {
  background: #722ed1;
  color: #fff;
  border-color: #722ed1;
}
.link-edit {
  margin-right: 8px;
}
</style>


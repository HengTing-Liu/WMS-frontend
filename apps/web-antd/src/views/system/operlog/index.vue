<template>
  <div class="logininfor-page p-5 bg-white w-full min-h-full box-border">
    <BasicGridPage
      ref="gridRef"
      :form-options="formOptions"
      :grid-options="gridOptions"
      :grid-events="gridEvents"
    >
      <!-- 工具栏 -->
      <template #toolbar-tools>
        <Popconfirm
          title="是否确认删除选中的操作日志?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleBatchDelete">
          <Button danger class="btn-danger" :disabled="!selectedRowKeys.length">
            删除
          </Button>
        </Popconfirm>
        <!-- <Popconfirm
          title="是否确认清空所有操作日志?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleClean"
        >
          <Button danger class="btn-danger">
            清空
          </Button>
        </Popconfirm> -->
        <Button class="btn-export" @click="handleExport">
          导出
        </Button>
      </template>

      <!-- 操作类型 -->
      <template #businessType="{ row }">
        <Tag color="gold">
          {{ renderBusinessType(row.businessType) }}
        </Tag>
      </template>

      <!-- 状态 -->
      <template #status="{ row }">
        <Tag :color="row.status === 0 ? 'processing' : 'error'">
          {{ row.status === 0 ? '成功' : '失败' }}
        </Tag>
      </template>

      <!-- 耗时 -->
      <template #costTime="{ row }">
        {{ row.costTime }}秒
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <Button type="link" class="p-0 link-detail" @click="openDetail(row)">
          详情
        </Button>
      </template>
    </BasicGridPage>

    <!-- 详情弹框（按若依样式自定义布局） -->
    <Modal v-model:open="detailVisible" title="操作日志详情" width="780px" destroy-on-close>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">操作模块：</span>
          <span class="detail-value">{{ detailRecord?.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">请求地址：</span>
          <span class="detail-value">{{ detailRecord?.operUrl }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">请求方式：</span>
          <span class="detail-value">{{ detailRecord?.requestMethod }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作人员：</span>
          <span class="detail-value">
            {{ detailRecord?.operName || 'admin' }} / {{ detailRecord?.operIp }} / {{ detailRecord?.operLocation || 'XX XX' }}
          </span>
        </div>
        <div class="detail-row detail-row-span">
          <span class="detail-label">请求方法：</span>
          <span class="detail-value">{{ detailRecord?.method }}</span>
        </div>
        <div class="detail-row detail-row-span">
          <span class="detail-label">请求参数：</span>
          <pre class="detail-pre detail-value">{{ detailRecord?.operParam }}</pre>
        </div>
        <div class="detail-row detail-row-span">
          <span class="detail-label">返回参数：</span>
          <pre class="detail-pre detail-value">{{ detailRecord?.jsonResult }}</pre>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作状态：</span>
          <span class="detail-value">
            <Tag :color="detailRecord?.status === 0 ? 'processing' : 'error'">
              {{ detailRecord?.status === 0 ? '成功' : '失败' }}
            </Tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">消耗时间：</span>
          <span class="detail-value">{{ detailRecord?.costTime }}秒</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作时间：</span>
          <span class="detail-value">{{ detailRecord?.operTime }}</span>
        </div>
        <div v-if="detailRecord?.errorMsg" class="detail-row detail-row-span">
          <span class="detail-label">异常信息：</span>
          <pre class="detail-pre detail-value">{{ detailRecord?.errorMsg }}</pre>
        </div>
      </div>
      <template #footer>
        <Button type="primary" @click="detailVisible = false">关闭</Button>
      </template>
    </Modal>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Tag, DatePicker, Popconfirm, Modal } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { downloadFileFromBlob } from '@vben/utils';
import { message } from 'ant-design-vue';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import BasicGridPage from '#/components/BasicGridPage.vue';
import { getOperLogList, deleteOperLog, cleanOperLog, exportOperLog, type OperLogItem } from '#/api';

const RangePicker = DatePicker.RangePicker;

const selectedRowKeys = ref<(string | number)[]>([]);

const gridRef = ref<InstanceType<typeof BasicGridPage> | null>(null);

const businessTypeOptions = [
  { label: '其它', value: 0 },
  { label: '新增', value: 1 },
  { label: '修改', value: 2 },
  { label: '删除', value: 3 },
  { label: '授权', value: 4 },
  { label: '导出', value: 5 },
  { label: '导入', value: 6 },
  { label: '强退', value: 7 },
  { label: '生成代码', value: 8 },
  { label: '清空数据', value: 9 },
];

const statusOptions = [
  { label: '成功', value: 0 },
  { label: '失败', value: 1 },
];

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-4',
  schema: [
    {
      component: 'Input',
      fieldName: 'operIp',
      label: '操作地址',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入操作地址',
      },
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: '系统模块',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入系统模块',
      },
    },
    {
      component: 'Input',
      fieldName: 'operName',
      label: '操作人员',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入操作人员',
      },
    },
    {
      component: 'Select',
      fieldName: 'businessType',
      label: '类型',
      formItemClass: 'col-span-1',
      labelWidth: 60,
      componentProps: {
        allowClear: true,
        placeholder: '操作类型',
        options: businessTypeOptions,
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
        placeholder: '操作状态',
        options: [
          { label: '成功', value: 0 },
          { label: '失败', value: 1 },
        ],
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'operTimeRange',
      label: '操作时间',
      formItemClass: 'col-span-2',
      labelWidth: 80,
    },
  ],
};

const gridOptions: VxeTableGridOptions<OperLogItem> = {
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'operId', title: '日志编号', width: 90, align: 'center' },
    { field: 'title', title: '系统模块' },
    { field: 'businessType', title: '操作类型', slots: { default: 'businessType' } },
    { field: 'operName', title: '操作人员' },
    { field: 'operIp', title: '操作地址' },
    // { field: 'operLocation', title: '操作地点' },
    { field: 'status', title: '操作状态', width: 100, align: 'center', slots: { default: 'status' } },
    { field: 'operTime', title: '操作时间' },
    { field: 'costTime', title: '消耗时间', width: 110, align: 'center', slots: { default: 'costTime' } },
    { field: 'action', title: '操作', width: 120, fixed: 'right', align: 'center', slots: { default: 'action' } },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const range = formValues.operTimeRange as [Dayjs, Dayjs] | undefined;
        const params = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          orderByColumn: 'operTime',
          isAsc: 'descending',
          operIp: formValues.operIp?.trim() || undefined,
          title: formValues.title?.trim() || undefined,
          operName: formValues.operName?.trim() || undefined,
          businessType: formValues.businessType,
          status: formValues.status,
          beginTime: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
          endTime: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
        };
        const res = (await getOperLogList(params)) as any;
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
    selectedRowKeys.value = (params.records || []).map((item: OperLogItem) => item.operId as number);
  },
  checkboxAll: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: OperLogItem) => item.operId as number);
  },
};

function renderBusinessType(type: number) {
  const found = businessTypeOptions.find((item) => item.value === type);
  return found?.label ?? '其它';
}

async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的日志');
    return;
  }
  try {
    const res = (await deleteOperLog(selectedRowKeys.value as number[])) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '删除成功');
      selectedRowKeys.value = [];
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '删除失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

async function handleClean() {
  try {
    const res = (await cleanOperLog()) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '清空成功');
      selectedRowKeys.value = [];
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '清空失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '清空失败');
  }
}

async function handleExport() {
  try {
    const formValues = await gridRef.value?.gridApi?.formApi?.getValues?.();
    const range = formValues?.operTimeRange as [Dayjs, Dayjs] | undefined;
    const params = {
      operIp: formValues?.operIp?.trim() || undefined,
      title: formValues?.title?.trim() || undefined,
      operName: formValues?.operName?.trim() || undefined,
      businessType: formValues?.businessType,
      status: formValues?.status,
      beginTime: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
      endTime: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
    };
    const blob = (await exportOperLog(params)) as Blob;
    downloadFileFromBlob({
      fileName: `操作日志_${Date.now()}.xlsx`,
      source: blob,
    });
    message.success('导出成功');
  } catch (e: any) {
    message.error(e?.message ?? '导出失败');
  }
}

const detailVisible = ref(false);
const detailRecord = ref<OperLogItem | null>(null);

function openDetail(record: OperLogItem) {
  detailRecord.value = record;
  detailVisible.value = true;
}

</script>

<style scoped>
.operlog-table :deep(.ant-table-thead > tr > th),
.operlog-table :deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
  color: rgba(0, 0, 0, 0.65);
}
.operlog-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  background: #fafafa;
}
.link-detail.ant-btn-link {
  color: #1890ff;
}
.link-detail.ant-btn-link:hover {
  color: #40a9ff;
}
.detail-pre {
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #fafafa;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  max-height: 260px;
  overflow: auto;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 40px;
  grid-row-gap: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.85);
}
.detail-row {
  display: flex;
  align-items: flex-start;
}
.detail-row-span {
  grid-column: 1 / span 2;
}
.detail-label {
  flex: 0 0 80px;
  text-align: right;
  color: rgba(0, 0, 0, 0.65);
  margin-right: 8px;
}
.detail-value {
  flex: 1;
}
</style>
<template>
  <div class="operlog-page p-5 bg-white w-full min-h-full box-border">
    <BasicGridPage
      ref="gridRef"
      :form-options="formOptions"
      :grid-options="gridOptions"
      :grid-events="gridEvents"
    >
      <template #toolbar-tools>
        <Popconfirm
          title="是否确认删除选中的登录日志?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleBatchDelete"
        >
          <Button danger class="btn-danger" :disabled="!selectedRowKeys.length">
            删除
          </Button>
        </Popconfirm>
        <!-- <Popconfirm
          title="是否确认清空所有登录日志?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleClean"
        >
          <Button danger class="btn-danger">
            清空
          </Button>
        </Popconfirm> -->
        <!-- <Button type="primary" class="btn-unlock" :disabled="selectedRowKeys.length !== 1" @click="handleUnlock">
          解锁
        </Button> -->
        <Button class="btn-export" @click="handleExport">
          导出
        </Button>
      </template>

      <template #status="{ row }">
        <Tag :color="row.status === '0' ? 'processing' : 'error'">
          {{ row.status === '0' ? '成功' : '失败' }}
        </Tag>
      </template>
    </BasicGridPage>

    <!-- 解锁确认弹框 -->
    <Modal
      v-model:open="unlockModalVisible"
      title="系统提示"
      :ok-text="'确定'"
      :cancel-text="'取消'"
      @ok="handleConfirmUnlock"
    >
      <span class="unlock-tip">
        是否确认解锁用户"{{ unlockUserName }}"数据项?
      </span>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button, Modal, Popconfirm, Tag } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { downloadFileFromBlob } from '@vben/utils';
import { message } from 'ant-design-vue';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import BasicGridPage from '#/components/BasicGridPage.vue';
import {
  getLoginLogList,
  deleteLoginLog,
  cleanLoginLog,
  unlockLoginUser,
  exportLoginLog,
  type LoginLogItem,
} from '#/api';

const gridRef = ref<InstanceType<typeof BasicGridPage> | null>(null);
const selectedRowKeys = ref<(string | number)[]>([]);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-4',
  schema: [
    // {
    //   component: 'Input',
    //   fieldName: 'ipaddr',
    //   label: '登录地址',
    //   formItemClass: 'col-span-1',
    //   labelWidth: 80,
    //   componentProps: {
    //     placeholder: '请输入登录地址',
    //   },
    // },
    {
      component: 'Input',
      fieldName: 'userName',
      label: '用户名称',
      formItemClass: 'col-span-1',
      labelWidth: 80,
      componentProps: {
        placeholder: '请输入用户名称',
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
        placeholder: '登录状态',
        options: [
          { label: '成功', value: '0' },
          { label: '失败', value: '1' },
        ],
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'accessTimeRange',
      label: '登录时间',
      formItemClass: 'col-span-1',
      labelWidth: 80,
    },
  ],
};

const gridOptions: VxeTableGridOptions<LoginLogItem> = {
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'infoId', title: '访问编号', width: 90, align: 'center' },
    { field: 'userName', title: '用户名称' },
    { field: 'ipaddr', title: 'IP地址' },
    { field: 'status', title: '登录状态', width: 100, align: 'center', slots: { default: 'status' } },
    { field: 'msg', title: '操作信息' },
    { field: 'accessTime', title: '登录日期' },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const range = formValues.accessTimeRange as [Dayjs, Dayjs] | undefined;
        const params: Record<string, any> = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ipaddr: formValues.ipaddr?.trim() || undefined,
          userName: formValues.userName?.trim() || undefined,
          status: formValues.status,
          beginTime: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
          endTime: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
        };
        const res = (await getLoginLogList(params)) as any;
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
    selectedRowKeys.value = (params.records || []).map((item: LoginLogItem) => item.infoId as number);
  },
  checkboxAll: (params: any) => {
    selectedRowKeys.value = (params.records || []).map((item: LoginLogItem) => item.infoId as number);
  },
};

async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的日志');
    return;
  }
  try {
    const res = (await deleteLoginLog(selectedRowKeys.value as number[])) as { code?: number; msg?: string };
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
    const res = (await cleanLoginLog()) as { code?: number; msg?: string };
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

const unlockModalVisible = ref(false);
const unlockUserName = ref('');

function handleUnlock() {
  if (selectedRowKeys.value.length !== 1) return;
  const grid = gridRef.value?.gridApi?.grid;
  const rows = (grid?.getCheckboxRecords?.() || []) as LoginLogItem[];
  const row = rows.find((r) => r.infoId === selectedRowKeys.value[0]);
  if (!row?.userName) {
    message.warning('无法获取选中用户');
    return;
  }
  unlockUserName.value = row.userName;
  unlockModalVisible.value = true;
}

async function handleConfirmUnlock() {
  if (!unlockUserName.value) return;
  try {
    const res = (await unlockLoginUser(unlockUserName.value)) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '解锁成功');
      unlockModalVisible.value = false;
      gridRef.value?.gridApi?.reload();
    } else {
      message.error(res?.msg ?? '解锁失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '解锁失败');
  }
}

async function handleExport() {
  try {
    const formValues = await gridRef.value?.gridApi?.formApi?.getValues?.();
    const range = formValues?.accessTimeRange as [Dayjs, Dayjs] | undefined;
    const params: Record<string, any> = {
      ipaddr: formValues?.ipaddr?.trim() || undefined,
      userName: formValues?.userName?.trim() || undefined,
      status: formValues?.status,
      beginTime: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
      endTime: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
    };
    const blob = (await exportLoginLog(params)) as Blob;
    downloadFileFromBlob({
      fileName: `登录日志_${Date.now()}.xlsx`,
      source: blob,
    });
    message.success('导出成功');
  } catch (e: any) {
    message.error(e?.message ?? '导出失败');
  }
}
</script>

<style scoped>
.btn-unlock.ant-btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
.unlock-tip {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}
</style>

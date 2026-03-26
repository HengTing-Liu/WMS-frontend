<template>
  <div>
    <Row>
    <Col :span="6">    
      <Page auto-content-height>
        <deptTree v-if="treeData" :treeData="treeData"  @select="handleSelect"/>
      </Page>
    </Col>
    <Col :span="18">
      <Page auto-content-height>
        <Grid>
          <template #toolbar-tools>
            <!-- 按钮和图标垂直居中 -->
            <Button v-access:code="'system:user:add'" type="primary"  class="mr-2 flex items-center" @click="handleEdit()">
              <IconifyIcon icon="material-symbols:add" class="size-5" /> {{ $t('page.common.add') }}
            </Button> 
            
            <Button v-access:code="'system:user:edit'" type="primary"  class="mr-2 flex items-center" :disabled="selectedCount !== 1" @click="handleBatchEdit">
              <IconifyIcon icon="ep:edit" class="size-5" /> {{ $t('page.system.user.batchEdit') }}
            </Button>
           
            <Popconfirm
              v-access:code="'system:user:delete'"
              :title="$t('page.system.user.confirmBatchDelete')"
              :ok-text="$t('page.common.confirm')"
              :cancel-text="$t('page.common.cancel')"
              @confirm="handleBatchDeleteUser"
            >
            <Button danger  class="mr-2 flex items-center" >
                <IconifyIcon icon="material-symbols:delete" class="size-5" /> {{ $t('page.common.delete') }}
            </Button>
            </Popconfirm>
             <Button v-access:code="'system:user:export'" type="primary" class="mr-2 flex items-center" @click="handleExport">
              <IconifyIcon icon="bx:export" class="size-5" /> {{ $t('page.common.export') }}
            </Button>
                <Button v-access:code="'system:user:import'" type="primary" class="mr-2 flex items-center" @click="handleImport">
              <IconifyIcon icon="bx:import" class="size-5" /> {{ $t('page.common.import') }}
            </Button>
          </template>
          <template #dept="{ row }">
            {{ row?.dept?.deptName || $t('page.system.user.noDept') }}
          </template>
          <template #status="{ row }">
            <Switch
              :checked="row.status"
              :checkedValue="'0'"
              :unCheckedValue="'1'"
              @change="() => handleChangeStatus(row)"
              :checked-children="$t('page.system.user.enabled')"
              :un-checked-children="$t('page.system.user.disabled')"
            />
          </template>
          <template #action="{ row }">
            <Button v-access:code="'system:user:edit'" type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>  
            <Popconfirm
                v-access:code="'system:user:delete'"
                :title="$t('page.system.user.confirmDelete')"
                :ok-text="$t('page.common.confirm')"
                :cancel-text="$t('page.common.cancel')"
                @confirm="handleDeleteUser(row.userId)"
              >
              <Button danger type="link">{{ $t('page.common.delete') }}</Button>
            </Popconfirm>
          </template>
        </Grid>
      </Page> 
    </Col>
  </Row>
  <ModalReg />
  <ModalImportReg />
</div>
</template>
<script lang="ts" setup>
import { onMounted,nextTick, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
// import dayjs from 'dayjs';
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlob, nowTimestamp } from '@vben/utils';
import {
  Button,
  Row,
  Col,
  Switch,
  Popconfirm,
  Modal
} from 'ant-design-vue';
import { getUserList, changeUserStatus, deleteUser, exportUser } from '#/api';
import { getDeptTree } from '#/api/system/dept';
import type { UserApi } from '#/api';
import deptTree from './modules/deptTree.vue';
import userEditModal from './modules/userEditModal.vue';
import userBatcnImportModal from './modules/userBatcnImportModal.vue';
type RowType = UserApi.User;
type TreeNode = UserApi.TreeNode;
// // 组合类型
// interface UserWithSelection extends UserApi.User {
//   selected: boolean;
// }
const selectedCount = ref(0);
const [ModalReg, modalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: userEditModal,
});
const treeData = ref<TreeNode[]>([]);
const lastPageInfo = ref<{ currentPage: number; pageSize: number }>({
  currentPage: 1,
  pageSize: 20,
});

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  fieldMappingTime: [['createTime', ['params[beginTime]', 'params[endTime]']]],
  // 设置查询表单整体为网格布局的列数（小屏3列，中屏及以上4列）
  wrapperClass: 'grid-cols-5',
// 控制表单是否显示折叠按钮
  showCollapseButton: false,
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'userName',
      label: () => $t('page.system.user.userName'),
      formItemClass: 'col-span-1',
      labelWidth: 80,
    },  
    {
      component: 'Input',
      fieldName: 'phonenumber',
      label: () => $t('page.system.user.phonenumber'),
      formItemClass: 'col-span-1',
       labelWidth: 80,
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: () => $t('page.system.user.enabled'),
      value: '0',
          },
          {
            label: () => $t('page.system.user.disabled'),
      value: '1',
          },
        ],
        placeholder: () => $t('page.common.pleaseSelect'),
      },
      fieldName: 'status',
      label: () => $t('page.common.status'),
      formItemClass: 'col-span-1',
      labelWidth: 60,
    },
    {
      component: 'RangePicker',
      // defaultValue: [dayjs().subtract(7, 'days'), dayjs()],
      fieldName: 'createTime',
      label: () => $t('page.common.createTime'),
      // 时间范围较宽，设置占2列
      formItemClass: 'col-span-2',
       labelWidth: 60,
    },
  ],
  
};


const gridOptions: VxeTableGridOptions<RowType> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    // { title: '序号', type: 'seq', width: 50 },
    {  type: 'checkbox' as const, width: 30 },
    { field: 'userId', title: () => $t('page.system.user.userId') },
    { field: 'userName', title: () => $t('page.system.user.userName') },
    { field: 'nickName', title: () => $t('page.system.user.nickName') },
    { field: 'dept', title: () => $t('page.system.user.deptId'), slots: { default: 'dept' },},
    { field: 'phonenumber', title: () => $t('page.system.user.phonenumber') },
    { field: 'status', title: () => $t('page.common.status') , slots: { default: 'status' },},
    { field: 'createTime', title: () => $t('page.common.createTime'),formatter: 'formatDateTime', },
    {
      field: 'action',
      fixed: 'right' as const,
      slots: { default: 'action' },
      title: () => $t('page.common.operation'),
      width: 200,
    },
  ],
  exportConfig: {},
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      total: 'total',
      result: 'rows',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        lastPageInfo.value = {
          currentPage: page.currentPage,
          pageSize: page.pageSize,
        };
        const res = await getUserList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
        return res;
      },
    },
  },
  // toolbarConfig: {
  //   // custom: true,
  //   export: true,
  //   import: true,
  //   // refresh: true,
  //   // resizable: true,
  //   // search: false,
  //   // zoom: false,
  // },
};
const [Grid, gridApi] = useVbenVxeGrid<RowType>({
    formOptions,
    gridOptions,
    gridEvents:{
      checkboxChange: (params:any) => {
        selectedCount.value = Array.isArray(params?.records) ? params.records.length : (gridApi.grid?.getCheckboxRecords?.()?.length ?? 0);
      },
      checkboxAll: (params:any) => {
        selectedCount.value = Array.isArray(params?.records) ? params.records.length : (gridApi.grid?.getCheckboxRecords?.()?.length ?? 0);
      },
    } 
});

const handleChangeStatus = async (row: RowType) => {
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.sysTip'),
    content: nextStatus === '1' ? $t('page.system.user.confirmDisableUser') : $t('page.system.user.confirmEnableUser'),
    okText: $t('page.common.confirm'),
    cancelText: $t('page.common.cancel'),
    async onOk() {
      const res = await changeUserStatus({ userId: row.userId, status: nextStatus });
      if (res.code == 200) {
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } else {
        message.error(res.msg || $t('page.message.operationFail'));
      }
    },
  });
}
const handleEdit = (row?:RowType) => {
  let data;
  if (row) {
    data = {
      ...row,
      isAdd: false,
      onSuccess: () => {
        gridApi.reload();
      },
    };
  } else {
    data = {
      isAdd: true,
      onSuccess: () => {
        gridApi.reload();
      },
    };
  }
  modalApi.setData(data).open();
}
// 树节点点击事件
const handleSelect = async (deptId:string) => {
  await gridApi.query({ deptId });
}
const handleDeleteUser = async(userId:string | number) => {
  const res=  await deleteUser(userId);
  if(res.code==200){
    message.success(res.data);
    gridApi.reload();
  }else{
    message.error(res.msg);
  }
};
const handleBatchDeleteUser = async () => {
  const rows = gridApi.grid?.getCheckboxRecords?.() ?? [];
  if (!rows.length) {
    message.warning($t('page.system.user.selectDelete'));
    return;
  }
  const userIds = rows.map((r: RowType) => r.userId)
  const res = await deleteUser(userIds.join(','));
  if (res?.code === 200) {
    message.success($t('page.message.batchDeleteSuccess'));
    gridApi.reload();
  } else {
    message.error(res?.msg || $t('page.message.batchDeleteFail'));
  }
};
const handleBatchEdit = () => {
  const rows = gridApi.grid?.getCheckboxRecords?.() ?? [];
  handleEdit(rows[0] as RowType);
};
const handleExport = async () => {
  const formValues = await gridApi.formApi?.getValues?.();
  const { currentPage, pageSize } = lastPageInfo.value;
  const blob: Blob = await exportUser({
    ...formValues,
    pageNum: currentPage,
    pageSize,
  });
  downloadFileFromBlob({ fileName: `${$t('page.system.user.exportUserList')}${nowTimestamp()}.xlsx`, source: blob });
};
const [ModalImportReg, importModalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: userBatcnImportModal,
});
const handleImport = async () => {
   importModalApi.setData({}).open();
};
onMounted(async() => {
  await nextTick();
  treeData.value= await getDeptTree()
});

</script>

<template>
  <div>
    <Row>
      <Col :span="6">
        <Page auto-content-height>
          <deptTree v-if="treeData" :treeData="treeData" @select="handleSelect" />
        </Page>
      </Col>
      <Col :span="18">
        <Page auto-content-height>
          <Grid>
            <template #toolbar-tools>
              <!-- 按钮和图标垂直居中 -->
              <Button type="primary" class="mr-2 flex items-center" @click="handleEdit()">
                <IconifyIcon icon="material-symbols:add" class="size-5" /> 新增
              </Button>

              <!-- <Button type="primary"  class="mr-2 flex items-center" :disabled="selectedCount !== 1" @click="handleBatchEdit">
              <IconifyIcon icon="ep:edit" class="size-5" />批量编辑  
            </Button> -->

              <Popconfirm title="是否确认批量删除选中用户?" ok-text="确认" cancel-text="取消" @confirm="handleBatchDeleteUser">
                <Button danger class="mr-2 flex items-center">
                  <IconifyIcon icon="material-symbols:delete" class="size-5" /> 删除
                </Button>
              </Popconfirm>
              <Button type="primary" class="mr-2 flex items-center" @click="handleExport">
                <IconifyIcon icon="bx:export" class="size-5" /> 导出
              </Button>
              <Button type="primary" class="mr-2 flex items-center" @click="handleImport">
                <IconifyIcon icon="bx:import" class="size-5" /> 导入
              </Button>
            </template>
            <template #dept="{ row }">
              {{ row?.deptName ?? row?.dept?.deptName ?? '无' }}
            </template>
            <template #status="{ row }">
              <Switch :checked="row.status !== '1'" @change="(checked) => handleChangeStatus(row, checked)"
                checked-children="已启用" un-checked-children="已禁用" />
            </template>
            <template #action="{ row }">
              <Button type="link" @click="handleEdit(row)">修改</Button>
              <Popconfirm title="是否确认删除?" ok-text="确认" cancel-text="取消" @confirm="handleDeleteUser(row.userId)">
                <Button danger type="link">删除</Button>
              </Popconfirm>
              <Dropdown :trigger="['click']">
                <Button type="link">更多</Button>
                <template #overlay>
                  <Menu>
                    <MenuItem @click="openResetPwdModal(row)">重置密码</MenuItem>
                    <MenuItem @click="handleAssignRole(row)">分配角色</MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </template>
          </Grid>
        </Page>
      </Col>
    </Row>
    <ModalReg />
    <ModalImportReg />
    <Modal v-model:open="resetPwdModalVisible" title="提示" ok-text="确定" cancel-text="取消" @ok="handleConfirmResetPwd"
      @cancel="handleCancelResetPwd">
      <p style="margin-bottom: 12px">
        请输入“{{ resetPwdUser?.userName || '' }}”的新密码
      </p>
      <Input v-model:value="resetPwdValue" type="password" placeholder="请输入新密码" allow-clear />
    </Modal>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
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
  Modal,
  Dropdown,
  Menu,
  Input,
} from 'ant-design-vue';
import { getUserList, updateUserStatus, getDeptTree, deleteUser, exportUser, resetUserPwd } from '#/api';
import type { UserApi } from '#/api';
import deptTree from './modules/deptTree.vue';
import userEditModal from './modules/userEditModal.vue';
import userBatcnImportModal from './modules/userBatcnImportModal.vue';
const { Item: MenuItem } = Menu;
const router = useRouter();
type RowType = UserApi.User;
type TreeNode = UserApi.TreeNode;
// // 组合类型
// interface UserWithSelection extends UserApi.User {
//   selected: boolean;
// }
const selectedCount = ref(0);
const resetPwdModalVisible = ref(false);
const resetPwdUser = ref<RowType | null>(null);
const resetPwdValue = ref('');
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
      label: '用户名称',
      formItemClass: 'col-span-1',
      labelWidth: 80,
    },
    {
      component: 'Input',
      fieldName: 'phonenumber',
      label: '手机号码',
      formItemClass: 'col-span-1',
      labelWidth: 80,
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: '正常',
            value: '0',
          },
          {
            label: '停用',
            value: '1',
          },
        ],
        placeholder: '请选择',
      },
      fieldName: 'status',
      label: '状态',
      formItemClass: 'col-span-1',
      labelWidth: 60,
    },
    {
      component: 'RangePicker',
      // defaultValue: [dayjs().subtract(7, 'days'), dayjs()],
      fieldName: 'createTime',
      label: '创建时间',
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
    { type: 'checkbox', width: 30 },
    { field: 'userId', title: '用户编号' },
    { field: 'userName', title: '用户名称' },
    { field: 'nickName', title: '用户昵称' },
    { field: 'dept', title: '部门', slots: { default: 'dept' }, },
    { field: 'phonenumber', title: '手机号码' },
    { field: 'status', title: '状态', slots: { default: 'status' }, },
    { field: 'createTime', title: '创建时间', formatter: 'formatDateTime', },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 200,
    },
  ],
  exportConfig: {},
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
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
        return {
          total: res.total,
          items: res.rows,
        }
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
  gridEvents: {
    checkboxChange: (params: any) => {
      selectedCount.value = Array.isArray(params?.records) ? params.records.length : (gridApi.grid?.getCheckboxRecords?.()?.length ?? 0);
    },
    checkboxAll: (params: any) => {
      selectedCount.value = Array.isArray(params?.records) ? params.records.length : (gridApi.grid?.getCheckboxRecords?.()?.length ?? 0);
    },
  }
});

const openResetPwdModal = (row: RowType) => {
  resetPwdUser.value = row;
  resetPwdValue.value = '';
  resetPwdModalVisible.value = true;
};

const handleConfirmResetPwd = async () => {
  if (!resetPwdUser.value) {
    resetPwdModalVisible.value = false;
    return;
  }
  const pwd = resetPwdValue.value.trim();
  if (!pwd) {
    message.warning('请输入新密码');
    return;
  }
  const res = await resetUserPwd({ userId: resetPwdUser.value.userId, password: pwd });
  if (res?.code === 200) {
    message.success(res?.msg ?? '密码重置成功');
    resetPwdModalVisible.value = false;
  } else {
    message.error(res?.msg ?? '密码重置失败');
  }
};

const handleCancelResetPwd = () => {
  resetPwdModalVisible.value = false;
};

const handleAssignRole = (row: RowType) => {
  router.push({ name: 'UserAssignRole', params: { userId: String(row.userId) } });
};

const handleChangeStatus = async (row: RowType, checked: any) => {
  const nextStatus = checked ? '0' : '1';
  Modal.confirm({
    title: '系统提示',
    content: `确认要${nextStatus === '1' ? '停用' : '启用'}"${row.userName}"用户吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const res = await updateUserStatus({ userId: row.userId, status: nextStatus });
      if (res.code == 200) {
        message.success('操作成功');
        gridApi.reload();
      } else {
        message.error(res.msg || '操作失败');
      }
    },
  });
}
const handleEdit = (row?: RowType) => {
  let data
  if (row) {
    data = {
      ...row,
      title: `${row?.userName}用户修改`,
      onSuccess: () => {
        gridApi.reload();
      },
    }
  } else {
    data = {
      title: `用户新增`,
      onSuccess: () => {
        gridApi.reload();
      },
    }
  }
  modalApi.setData(data).open();
}
// 树节点点击事件
const handleSelect = async (deptId: string) => {
  await gridApi.query({ deptId });
}
const handleDeleteUser = async (userId: string | number) => {
  const res = await deleteUser(userId);
  if (res.code == 200) {
    message.success(res.data);
    gridApi.reload();
  } else {
    message.error(res.msg);
  }
};
const handleBatchDeleteUser = async () => {
  const rows = gridApi.grid?.getCheckboxRecords?.() ?? [];
  if (!rows.length) {
    message.warning('请勾选需要删除的用户');
    return;
  }
  const userIds = rows.map((r: RowType) => r.userId)
  const res = await deleteUser(userIds.join(','));
  if (res?.code === 200) {
    message.success('批量删除成功');
    gridApi.reload();
  } else {
    message.error(res?.msg || '批量删除失败');
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
  downloadFileFromBlob({ fileName: `导出用户列表${nowTimestamp()}.xlsx`, source: blob });
};
const [ModalImportReg, importModalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: userBatcnImportModal,
});
const handleImport = async () => {
  importModalApi.setData().open();
};
onMounted(async () => {
  await nextTick();
  treeData.value = await getDeptTree()
});

</script>

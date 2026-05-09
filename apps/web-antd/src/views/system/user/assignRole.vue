<template>
  <div class="p-5 bg-white">
    <!-- <div class="mb-4 text-base font-semibold text-gray-800">
      分配角色
    </div> -->

    <!-- 基本信息 -->
    <div class="mb-4">
      <div class="mb-2 font-medium text-gray-700">基本信息</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <div class="flex items-center gap-2">
          <span class="w-20 text-right text-gray-700">用户昵称</span>
          <Input :value="userInfo?.nickName" disabled />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-20 text-right text-gray-700">登录账号</span>
          <Input :value="userInfo?.userName" disabled />
        </div>
      </div>
    </div>

    <!-- 角色信息 -->
    <div class="mb-2 font-medium text-gray-700">角色信息</div>
    <Table
      :columns="columns"
      :data-source="roleList"
      :loading="loading"
      row-key="roleId"
      :pagination="pagination"
      :row-selection="rowSelection"
      class="assign-role-table"
      @change="onTableChange"
    />

    <!-- 底部按钮 -->
    <div class="mt-6 flex justify-center gap-4">
      <Button type="primary" @click="handleSubmit">提交</Button>
      <Button @click="handleBack">返回</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Table, Button, Input, message } from 'ant-design-vue';
import type { PaginationProps } from 'ant-design-vue';
import { getUserAuthRole, authUserRole } from '#/api';

interface RoleItem {
  roleId: number;
  roleName: string;
  roleKey: string;
  createTime: string;
  flag?: boolean;
}

interface UserInfo {
  userId: number | string;
  userName: string;
  nickName: string;
}

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const userInfo = ref<UserInfo | null>(null);
const allRoles = ref<RoleItem[]>([]);
const selectedRoleIds = ref<(string | number)[]>([]);

const pagination = ref<PaginationProps>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 80,
    align: 'center' as const,
    customRender: ({ index }: { index: number }) =>
      (pagination.value.current! - 1) * pagination.value.pageSize! + index + 1,
  },
  { title: '角色编号', dataIndex: 'roleId', key: 'roleId', width: 100, align: 'center' as const },
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName', width: 160, align: 'center' as const },
  { title: '权限字符', dataIndex: 'roleKey', key: 'roleKey', width: 160, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 200, align: 'center' as const },
];

const roleList = computed(() => {
  const { current = 1, pageSize = 10 } = pagination.value;
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  return allRoles.value.slice(start, end);
});

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRoleIds.value,
  onChange: (keys: (string | number)[]) => {
    selectedRoleIds.value = keys;
  },
}));

function onTableChange(p: PaginationProps) {
  pagination.value = {
    ...pagination.value,
    current: p.current,
    pageSize: p.pageSize,
  };
}

async function loadData() {
  const userId = route.params.userId as string;
  if (!userId) return;
  loading.value = true;
  try {
    const res = await getUserAuthRole(userId) as any;
    // 兼容两层结构：外层 { code, msg, data }，内层 data 里再包一层 { code, msg, roles, user }
    const outerCode = res?.code;
    const outerMsg = res?.msg;
    const payload = res?.data ?? res;
    const innerCode = payload?.code;
    const innerMsg = payload?.msg;

    if (outerCode !== 200 || (innerCode !== undefined && innerCode !== 200)) {
      message.error(innerMsg || outerMsg || '加载分配角色信息失败');
      return;
    }
    const user = payload.user;
    const roles = payload.roles || [];
    userInfo.value = {
      userId: user.userId,
      userName: user.userName,
      nickName: user.nickName,
    };
    allRoles.value = roles;
    pagination.value.total = roles.length;
    selectedRoleIds.value = roles
      .filter((r: any) => r.flag)
      .map((r: any) => r.roleId);
  } catch (e: any) {
    message.error(e?.message ?? '加载分配角色信息失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!userInfo.value) return;
  const ids = selectedRoleIds.value;
  const userId = userInfo.value.userId;
  try {
    const res = await authUserRole({ userId, roleIds: ids }) as any;
    if (res?.code === 200) {
      message.success(res?.msg || '分配角色成功');
      router.back();
    } else {
      message.error(res?.msg || '分配角色失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '分配角色失败');
  }
}

function handleBack() {
  router.back();
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.assign-role-table :deep(.ant-table-thead > tr > th),
.assign-role-table :deep(.ant-table-tbody > tr > td) {
  padding: 14px 16px;
  text-align: center;
}
.assign-role-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  background: #fafafa;
}
</style>


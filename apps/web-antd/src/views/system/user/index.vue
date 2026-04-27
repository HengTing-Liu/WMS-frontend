<template>
  <div>
    <Row :gutter="16">
      <Col :span="6">
        <Page auto-content-height>
          <deptTree v-if="treeData" :treeData="treeData" @select="handleDeptSelect" />
        </Page>
      </Col>
      <Col :span="18">
        <LowcodePage
          ref="userLowcodeRef"
          table-code="sys_user"
          page-title="用户管理"
          :crud-prefix="'/api/wms/crud/sys_user'"
          :enable-selection="true"
          :static-operations="userLowcodeOperations"
        >
          <template #toolbarExtra>
            <Button type="primary" class="flex items-center" @click="handleImport">
              <IconifyIcon icon="bx:import" class="mr-1 size-5" />
              导入
            </Button>
          </template>
          <template #appendAction="{ record }">
            <Dropdown :trigger="['click']">
              <Button type="link" size="small" class="p-0">更多</Button>
              <template #overlay>
                <Menu>
                  <MenuItem @click="openResetPwdModal(record)">重置密码</MenuItem>
                  <MenuItem @click="handleAssignRole(record)">分配角色</MenuItem>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </LowcodePage>
      </Col>
    </Row>
    <ModalImportReg />
    <Modal
      v-model:open="resetPwdModalVisible"
      title="提示"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleConfirmResetPwd"
      @cancel="handleCancelResetPwd"
    >
      <p style="margin-bottom: 12px">请输入“{{ resetPwdUserDisplayName }}”的新密码</p>
      <Input v-model:value="resetPwdValue" type="password" placeholder="请输入新密码" allow-clear />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Button, Col, Dropdown, Input, Menu, Modal, Row } from 'ant-design-vue';
import { getDeptTree, resetUserPwd } from '#/api';
import type { UserApi } from '#/api';
import { fetchTreeAll, LowcodePage, type LowcodeAction } from '#/lowcode';
import deptTree from './modules/deptTree.vue';
import userBatcnImportModal from './modules/userBatcnImportModal.vue';

const { Item: MenuItem } = Menu;

const router = useRouter();
type TreeNode = UserApi.TreeNode;

const treeData = ref<TreeNode[]>([]);
const userLowcodeRef = ref<InstanceType<typeof LowcodePage> | null>(null);

/** 与操作元数据约定一致：create / export / row_edit / row_delete / toggle */
const userLowcodeOperations: LowcodeAction[] = [
  {
    key: 'create',
    label: '新增',
    type: 'primary',
    permission: 'system:user:add',
    position: 'toolbar',
    eventType: 'builtin',
  },
  {
    key: 'export',
    label: '导出',
    type: 'default',
    permission: 'system:user:export',
    position: 'toolbar',
    eventType: 'builtin',
  },
  {
    key: 'row_edit',
    label: '编辑',
    type: 'link',
    permission: 'system:user:edit',
    position: 'row',
    eventType: 'builtin',
  },
  {
    key: 'row_delete',
    label: '删除',
    type: 'link',
    permission: 'system:user:delete',
    position: 'row',
    eventType: 'builtin',
  },
  {
    key: 'toggle',
    label: '启用/停用',
    type: 'link',
    permission: 'system:user:edit',
    position: 'row',
    eventType: 'builtin',
  },
];

const resetPwdModalVisible = ref(false);
const resetPwdUser = ref<Record<string, any> | null>(null);
const resetPwdValue = ref('');
const resetPwdUserDisplayName = computed(
  () => resetPwdUser.value?.userName ?? resetPwdUser.value?.user_name ?? '',
);

const [ModalImportReg, importModalApi] = useVbenModal({
  connectedComponent: userBatcnImportModal,
});

function resolveUserId(row: Record<string, any>): string | number | undefined {
  return row?.userId ?? row?.user_id ?? row?.id;
}

function handleDeptSelect(deptId: string | number) {
  userLowcodeRef.value?.handleSearch({
    deptId,
    __queryModes: { deptId: 'eq' },
  });
}

function openResetPwdModal(row: Record<string, any>) {
  resetPwdUser.value = row;
  resetPwdValue.value = '';
  resetPwdModalVisible.value = true;
}

async function handleConfirmResetPwd() {
  if (!resetPwdUser.value) {
    resetPwdModalVisible.value = false;
    return;
  }
  const userId = resolveUserId(resetPwdUser.value);
  if (userId === undefined || userId === null || userId === '') {
    message.error('当前用户缺少主键，无法重置密码');
    return;
  }
  const pwd = resetPwdValue.value.trim();
  if (!pwd) {
    message.warning('请输入新密码');
    return;
  }
  const res = await resetUserPwd({ userId, password: pwd });
  if (res?.code === 200) {
    message.success(res?.msg ?? '密码重置成功');
    resetPwdModalVisible.value = false;
    userLowcodeRef.value?.reload();
  } else {
    message.error(res?.msg ?? '密码重置失败');
  }
}

function handleCancelResetPwd() {
  resetPwdModalVisible.value = false;
}

function handleAssignRole(row: Record<string, any>) {
  const userId = resolveUserId(row);
  if (userId === undefined || userId === null || userId === '') {
    message.error('当前用户缺少主键，无法分配角色');
    return;
  }
  router.push({ name: 'UserAssignRole', params: { userId: String(userId) } });
}

function handleImport() {
  importModalApi.open();
}

/** 兼容多种后端包裹与单根树对象，避免部门树拿不到数组 */
function extractDeptList(res: unknown): any[] {
  if (Array.isArray(res)) return res;
  const r = res as Record<string, any> | null;
  if (!r || typeof r !== 'object') return [];
  for (const key of ['data', 'depts', 'rows', 'list', 'tree', 'records']) {
    const c = r[key];
    if (Array.isArray(c)) return c;
  }
  const d = r.data;
  if (d && typeof d === 'object') {
    for (const key of ['list', 'rows', 'depts', 'tree', 'records', 'nodes']) {
      const c = (d as Record<string, any>)[key];
      if (Array.isArray(c)) return c;
    }
    if (!Array.isArray(d) && (d.deptId != null || d.dept_id != null || d.id != null) && Array.isArray(d.children)) {
      return [d];
    }
  }
  if ((r.deptId != null || r.dept_id != null || r.id != null) && Array.isArray(r.children)) {
    return [r];
  }
  return [];
}

onMounted(async () => {
  await nextTick();
  try {
    const res = await getDeptTree();
    let list = extractDeptList(res);
    if (!list.length) {
      list = await fetchTreeAll({
        tableCode: 'sys_dept',
        prefix: '/api/wms/crud/sys_dept',
      });
    }
    treeData.value = Array.isArray(list) ? list : [];
  } catch {
    treeData.value = [];
  }
});
</script>

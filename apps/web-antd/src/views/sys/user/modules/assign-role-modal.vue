<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Modal, Checkbox, CheckboxGroup, message } from 'ant-design-vue';
import { getAllRoles, getUserRoleIds, type RoleResult } from '#/api/sys/user';

const props = defineProps<{
  userId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const loading = ref(false);
const allRoles = ref<RoleResult[]>([]);
const userRoleIds = ref<number[]>([]);

const modalTitle = computed(() => '分配角色');

// 加载角色列表
async function loadRoles() {
  try {
    allRoles.value = await getAllRoles();
  } catch {
    message.error('加载角色列表失败');
  }
}

// 加载用户已有角色
async function loadUserRoles(userId: number) {
  try {
    userRoleIds.value = await getUserRoleIds(userId);
  } catch {
    message.error('加载用户角色失败');
  }
}

// 打开弹窗
const open = async (userId: number) => {
  visible.value = true;
  await loadRoles();
  await loadUserRoles(userId);
};

// 提交
const handleSubmit = async () => {
  if (!props.userId) return;
  try {
    loading.value = true;
    // TODO: 调用分配角色接口
    message.success('角色分配成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '分配失败');
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  emit('cancel');
};

// 监听 visible 变化
watch(visible, async (val) => {
  if (val && props.userId) {
    await loadRoles();
    await loadUserRoles(props.userId);
  }
});

// 暴露方法
defineExpose({
  open,
});
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="500px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="role-assign-content">
      <p class="role-tip">请选择要分配给该用户的角色：</p>
      <CheckboxGroup
        v-model:value="userRoleIds"
        class="role-checkbox-group"
      >
        <div class="role-list">
          <div
            v-for="role in allRoles"
            :key="role.roleId"
            class="role-item"
          >
            <Checkbox :value="role.roleId">
              {{ role.roleName }}
            </Checkbox>
          </div>
        </div>
      </CheckboxGroup>
      <div v-if="allRoles.length === 0" class="empty-tip">
        暂无可分配的角色
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.role-assign-content {
  padding: 8px 0;
}

.role-tip {
  margin-bottom: 16px;
  color: #666;
}

.role-checkbox-group {
  width: 100%;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-item {
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.role-item:hover {
  background: #f0f7ff;
  border-color: #1890ff;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 24px 0;
}
</style>

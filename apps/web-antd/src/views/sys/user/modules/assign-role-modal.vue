<template>
  <Modal
    title="分配角色"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="500px"
  >
    <CheckboxGroup v-model:value="selectedRoles" style="width: 100%">
      <div v-for="role in roleOptions" :key="role.roleId" style="margin-bottom: 8px">
        <Checkbox :value="role.roleId">{{ role.roleName }}</Checkbox>
      </div>
    </CheckboxGroup>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Modal, CheckboxGroup, Checkbox, message } from 'ant-design-vue';

const visible = ref(false);
const loading = ref(false);
const selectedRoles = ref<number[]>([]);
const roleOptions = ref<any[]>([]);
const currentUserId = ref<number>();

const open = async (userId: number) => {
  currentUserId.value = userId;
  visible.value = true;
  selectedRoles.value = [];
  // TODO: 加载已有角色列表
};

const handleSubmit = async () => {
  loading.value = true;
  // TODO: 调用 assignRoles API
  setTimeout(() => {
    visible.value = false;
    message.success('角色分配成功');
    loading.value = false;
  }, 500);
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({ open });
</script>
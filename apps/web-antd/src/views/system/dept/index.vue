<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="sys_dept"
    page-title="部门管理"
    :crud-prefix="crudPrefix"
    :static-operations="[]"
    @form-success="handleModalSuccess"
  >
    <template #toolbarLeft>
      <Button type="primary" @click="handleCreate">
        <Plus class="mr-1" :size="16" />
        新增部门
      </Button>
    </template>

    <template #appendAction="{ record }">
      <Tooltip title="编辑">
        <Button type="link" size="small" class="p-0" @click="handleEdit(record)">
          <Pencil class="text-lg" />
        </Button>
      </Tooltip>
      <Popconfirm title="是否确认删除?" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record)">
        <Button type="link" size="small" danger class="p-0">
          <Trash2 class="text-lg" />
        </Button>
      </Popconfirm>
    </template>
  </LowcodePage>

  <DeptModal ref="deptModalRef" @success="handleModalSuccess" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button, Popconfirm, Tooltip, message } from 'ant-design-vue';
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import LowcodePage from '#/lowcode/LowcodePage.vue';
import DeptModal from './modules/deptModal.vue';

const crudPrefix = '/api/wms/crud/sys_dept';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);
const deptModalRef = ref<InstanceType<typeof DeptModal> | null>(null);

function reloadList() {
  lowcodePageRef.value?.reload();
}

function handleCreate() {
  deptModalRef.value?.modalApi.setData({
    onSuccess: reloadList,
  });
  deptModalRef.value?.modalApi.open();
}

function handleEdit(record: Record<string, any>) {
  deptModalRef.value?.modalApi.setData({
    record,
    onSuccess: reloadList,
  });
  deptModalRef.value?.modalApi.open();
}

async function handleDelete(record: Record<string, any>) {
  try {
    const { deleteDept } = await import('#/api/system/dept');
    await deleteDept(record.deptId ?? record.dept_id ?? record.id);
    message.success('删除成功');
    reloadList();
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

function handleModalSuccess() {
  reloadList();
}
</script>

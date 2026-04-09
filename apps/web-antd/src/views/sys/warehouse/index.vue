<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="sys_warehouse"
    page-title="WMS0010 仓库档案"
    page-desc="管理仓库基本信息、温区、质检分区等"
    :crud-prefix="crudPrefix"
    @form-success="handleFormSuccess"
  >
    <!-- 操作列插槽：保留收货地址按钮 -->
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'action'">
        <div class="flex items-center gap-2">
          <Tooltip title="编辑">
            <Button type="link" size="small" class="p-0" @click="handleEdit(record)">
              <IconifyIcon icon="material-symbols:edit" class="text-lg" />
            </Button>
          </Tooltip>

          <Tooltip :title="record.isEnabled === 1 ? '停用' : '启用'">
            <Button
              type="link"
              size="small"
              class="p-0"
              @click="handleToggleStatus(record, record.isEnabled !== 1)"
            >
              <IconifyIcon
                :icon="record.isEnabled === 1 ? 'material-symbols:toggle-on' : 'material-symbols:toggle-off'"
                :class="record.isEnabled === 1 ? 'text-green-500 text-2xl' : 'text-gray-400 text-2xl'"
              />
            </Button>
          </Tooltip>

          <Tooltip title="删除">
            <Popconfirm title="是否确认删除?" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record.id)">
              <Button type="link" size="small" danger class="p-0">
                <IconifyIcon icon="material-symbols:delete" class="text-lg" />
              </Button>
            </Popconfirm>
          </Tooltip>

          <Tooltip title="收货地址">
            <Button
              type="link"
              size="small"
              class="p-0"
              @click="handleReceiver(record)"
            >
              <IconifyIcon icon="material-symbols:location-on" class="text-lg" />
            </Button>
          </Tooltip>
        </div>
      </template>
    </template>
  </LowcodePage>

  <!-- 收货地址管理弹窗 -->
  <WarehouseReceiverModal
    v-model:open="receiverModalVisible"
    :warehouse-code="currentReceiver?.warehouseCode || ''"
    :warehouse-name="currentReceiver?.warehouseName || ''"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Tooltip, Popconfirm, Button } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import LowcodePage from '#/lowcode/LowcodePage.vue';
import WarehouseReceiverModal from '#/views/sys/warehouse/modules/warehouse-receiver-modal.vue';
import { toggleRecord, deleteRecord } from '#/lowcode/api';
import { message } from 'ant-design-vue';

const crudPrefix = '/api/wms/crud/sys_warehouse';

// LowcodePage 引用
const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

// 收货地址弹窗
const receiverModalVisible = ref(false);
const currentReceiver = ref<{ warehouseCode: string; warehouseName: string } | null>(null);

function reloadList() {
  lowcodePageRef.value?.reload();
}

function handleEdit(record: Record<string, any>) {
  lowcodePageRef.value?.handleEdit(record);
}

function handleFormSuccess() {
  reloadList();
}

async function handleDelete(id: number | string) {
  try {
    await deleteRecord({
      tableCode: 'sys_warehouse',
      prefix: '/api/wms/crud/sys_warehouse',
      id,
    });
    message.success('删除成功');
    reloadList();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

async function handleToggleStatus(record: Record<string, any>, enabled: boolean) {
  try {
    await toggleRecord({
      tableCode: 'sys_warehouse',
      prefix: '/api/wms/crud/sys_warehouse',
      id: record.id,
      enabled,
    });
    message.success(enabled ? '启用成功' : '停用成功');
    reloadList();
  } catch (e: any) {
    message.error(e?.message || '状态更新失败');
  }
}

function handleReceiver(record: Record<string, any>) {
  currentReceiver.value = {
    warehouseCode: record.warehouseCode,
    warehouseName: record.warehouseName,
  };
  receiverModalVisible.value = true;
}
</script>

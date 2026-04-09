<template>
  <div class="sys-warehouse-page">
  <LowcodePage
    ref="lowcodePageRef"
    table-code="sys_warehouse"
    page-title="WMS0010 仓库档案"
    page-desc="管理仓库基本信息、温区、质检分区等"
    :crud-prefix="crudPrefix"
    @form-success="handleFormSuccess"
  >
    <!-- 操作列由 LowcodePage 根据 meta 渲染；此处仅追加「收货地址」 -->
    <template #appendAction="{ record }">
      <Tooltip title="收货地址">
        <Button type="link" size="small" class="p-0" @click="handleReceiver(record)">
          <IconifyIcon icon="material-symbols:location-on" class="text-lg" />
        </Button>
      </Tooltip>
    </template>
  </LowcodePage>

  <!-- 收货地址管理弹窗 -->
  <WarehouseReceiverModal
    v-model:open="receiverModalVisible"
    :warehouse-code="currentReceiver?.warehouseCode || ''"
    :warehouse-name="currentReceiver?.warehouseName || ''"
  />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Tooltip, Button } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import LowcodePage from '#/lowcode/LowcodePage.vue';
import WarehouseReceiverModal from '#/views/sys/warehouse/modules/warehouse-receiver-modal.vue';

const crudPrefix = '/api/wms/crud/sys_warehouse';

// LowcodePage 引用
const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

// 收货地址弹窗
const receiverModalVisible = ref(false);
const currentReceiver = ref<{ warehouseCode: string; warehouseName: string } | null>(null);

function reloadList() {
  lowcodePageRef.value?.reload();
}

function handleFormSuccess() {
  reloadList();
}

function handleReceiver(record: Record<string, any>) {
  currentReceiver.value = {
    warehouseCode: record.warehouseCode,
    warehouseName: record.warehouseName,
  };
  receiverModalVisible.value = true;
}
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="$t('page.warehouse.title')"
    width="600px"
    :footer="null"
  >
    <Descriptions :column="1" bordered v-if="detail">
      <DescriptionsItem :label="$t('page.warehouse.warehouseCode')">
        {{ detail.warehouseCode }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.warehouseName')">
        {{ detail.warehouseName }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.temperatureZone')">
        {{ detail.temperatureZone || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.qualityZone')">
        {{ detail.qualityZone || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.employeeCode')">
        {{ detail.employeeCode || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.employeeName')">
        {{ detail.employeeName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.deptCode')">
        {{ detail.deptCode || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.deptNameFullPath')">
        {{ detail.deptNameFullPath || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.company')">
        {{ detail.company || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.isEnabled')">
        <Tag :color="detail.isEnabled === 1 ? 'success' : 'default'">
          {{ detail.isEnabled === 1 ? $t('page.common.enabled') : $t('page.common.disabled') }}
        </Tag>
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.warehouse.remark')">
        {{ detail.remark || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="$t('page.common.createTime')">
        {{ detail.createTime }}
      </DescriptionsItem>
    </Descriptions>
    <div v-else class="loading-container">
      <Spin />
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@vben/locales';
import { Drawer, Descriptions, DescriptionsItem, Tag, Spin, message } from 'ant-design-vue';

import { getWarehouseDetail, type WarehouseResult } from '#/api/sys/warehouse';

const visible = defineModel<boolean>('open', { required: true });

const detail = ref<WarehouseResult | null>(null);

// 打开详情
const open = async (id: number) => {
  visible.value = true;
  detail.value = null;
  try {
    const data = await getWarehouseDetail(id);
    detail.value = data;
  } catch {
    message.error($t('page.warehouse.loadDetailFailed'));
    visible.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>

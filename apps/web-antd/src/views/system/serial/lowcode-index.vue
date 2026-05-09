<template>
  <div class="sys-serial-page">
    <LowcodePage
      ref="lowcodePageRef"
      table-code="sys_serial_number"
      page-title="流水号规则"
      page-desc="管理系统流水号规则"
      crud-prefix="/api/wms/crud/sys_serial_number"
    >
      <!-- 工具栏追加「生成流水号」按钮 -->
      <template #toolbarExtra>
        <Button
          v-access:code="'sys:serial:generate'"
          class="mr-2"
          @click="handleGenerate"
        >
          <IconifyIcon icon="material-symbols:bolt" class="size-5" />
          {{ $t('page.system.serial.generateTitle') }}
        </Button>
      </template>
    </LowcodePage>

    <GenerateModal ref="generateModalRef" @success="handleReload" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import LowcodePage from '#/lowcode/LowcodePage.vue';
import GenerateModal from './modules/generate-modal.vue';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);
const generateModalRef = ref<InstanceType<typeof GenerateModal> | null>(null);

function handleGenerate() {
  generateModalRef.value?.open();
}

function handleReload() {
  lowcodePageRef.value?.reload();
}
</script>

<style scoped>
.sys-serial-page {
  min-height: 100%;
}
</style>

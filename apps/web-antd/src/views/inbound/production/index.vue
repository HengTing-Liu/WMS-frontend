<template>
  <Page auto-content-height>
    <div class="page-content">
      <div class="toolbar-tools">
        <Button
          v-access:code="'wms:inbound:production:query'"
          type="primary"
          class="mr-2"
          @click="handleQuery"
        >
          <IconifyIcon icon="material-symbols:search" class="size-5" />
          {{ $t('page.common.search') }}
        </Button>
        <Button
          v-access:code="'wms:inbound:production:add'"
          type="primary"
          class="mr-2"
          @click="handleAdd"
        >
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button
          v-access:code="'wms:inbound:production:import'"
          class="mr-2"
          @click="handleImport"
        >
          <IconifyIcon icon="material-symbols:upload" class="size-5" />
          {{ $t('page.common.import') }}
        </Button>
        <Button
          v-access:code="'wms:inbound:production:export'"
          @click="handleExport"
        >
          <IconifyIcon icon="material-symbols:download" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
      </div>
    </div>
  </Page>`r`n</template>`r`n`r`n<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Button } from 'ant-design-vue';



function handleQuery() {
  console.log($t('page.inbound.production.queryLog'));
}

function handleAdd() {
  console.log($t('page.inbound.production.addLog'));
}

function handleImport() {
  console.log($t('page.inbound.production.importLog'));
}

function handleExport() {
  console.log($t('page.inbound.production.exportLog'));
}
</script>


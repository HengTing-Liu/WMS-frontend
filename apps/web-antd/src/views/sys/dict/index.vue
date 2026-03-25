<template>
  <Page auto-content-height>
    <div class="page-content">
      <div class="toolbar-tools">
        <Button v-access:code="'wms:base:dict:query'" type="primary" class="mr-2" @click="handleQuery">
          <IconifyIcon icon="material-symbols:search" class="size-5" />
          {{ $t('page.common.search') }}
        </Button>
        <Button v-access:code="'wms:base:dict:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" />
          {{ $t('page.common.add') }}
        </Button>
        <Button v-access:code="'wms:base:dict:export'" @click="handleExport">
          <IconifyIcon icon="material-symbols:download" class="size-5" />
          {{ $t('page.common.export') }}
        </Button>
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Button } from 'ant-design-vue';
import { $t } from '@vben/locales';

function handleQuery() {
  console.log($t('page.common.searchHint'));
}

function handleAdd() {
  console.log($t('page.common.addData'));
}

function handleExport() {
  console.log($t('page.common.exportData'));
}
</script>

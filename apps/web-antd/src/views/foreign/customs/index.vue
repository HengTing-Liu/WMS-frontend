<template>
  <Page auto-content-height>
    <div class="page-content">
      <div class="toolbar-tools">
        <Button v-access:code="'wms:foreign:customs:query'" type="primary" class="mr-2" @click="handleQuery">
          <IconifyIcon icon="material-symbols:search" class="size-5" /> 查询
        </Button>
        <Button v-access:code="'wms:foreign:customs:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" /> 新增
        </Button>
        <Button v-access:code="'wms:foreign:customs:export'" @click="handleExport">
          <IconifyIcon icon="material-symbols:download" class="size-5" /> 导出
        </Button>
      </div>
    </div>
  </Page>`r`n</template>`r`n`r`n<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Button } from 'ant-design-vue';


function handleQuery() {
  console.log('查询报关列表');
}

function handleAdd() {
  console.log('新增报关列表');
}

function handleExport() {
  console.log('导出报关列表');
}
</script>


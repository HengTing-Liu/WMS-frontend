<template>
  <Page auto-content-height>
    <div class="page-content">
      <div class="toolbar-tools">
        <Button v-access:code="'wms:delivery:express:query'" type="primary" class="mr-2" @click="handleQuery">
          <IconifyIcon icon="material-symbols:search" class="size-5" /> 查询
        </Button>
        <Button v-access:code="'wms:delivery:express:add'" type="primary" class="mr-2" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="size-5" /> 新增
        </Button>
        <Button v-access:code="'wms:delivery:express:export'" @click="handleExport">
          <IconifyIcon icon="material-symbols:download" class="size-5" /> 导出
        </Button>
      </div>
    </div>
  </Page>`r`n</template>`r`n`r`n<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Button } from 'ant-design-vue';


function handleQuery() {
  console.log('查询快递计划');
}

function handleAdd() {
  console.log('新增快递计划');
}

function handleExport() {
  console.log('导出快递计划');
}
</script>


<template>
  <CrudPage
    ref="crudRef"
    :config="consigneePageConfig"
    :api="consigneeApi"
    perm-prefix="sys:consignee"
    @form-success="handleFormSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CrudPage } from '#/components/crud';
import { consigneePageConfig, consigneeApi } from '#/api/sys/consignee';
import { message } from 'ant-design-vue';

const crudRef = ref<InstanceType<typeof CrudPage> | null>(null);

// 表单提交成功
const handleFormSuccess = () => {
  message.success($t('page.message.operationSuccess'));
};
</script>

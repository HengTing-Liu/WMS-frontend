<script setup lang="ts">
import { computed } from 'vue';

import { ProfileNotificationSetting } from '@vben/common-ui';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: () => $t('page.profile.accountPassword'),
      description: () => $t('page.profile.accountPasswordDesc'),
    },
    {
      value: true,
      fieldName: 'systemMessage',
      label: () => $t('page.profile.systemMessage'),
      description: () => $t('page.profile.systemMessageDesc'),
    },
    {
      value: true,
      fieldName: 'todoTask',
      label: () => $t('page.profile.todoTask'),
      description: () => $t('page.profile.todoTaskDesc'),
    },
  ];
});
</script>
<template>
  <ProfileNotificationSetting :form-schema="formSchema" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { ProfileSecuritySetting } from '@vben/common-ui';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: () => $t('page.profile.accountPassword'),
      description: () => $t('page.profile.passwordStrengthDesc'),
    },
    {
      value: true,
      fieldName: 'securityPhone',
      label: () => $t('page.profile.phone'),
      description: () => $t('page.profile.phoneDesc'),
    },
    {
      value: true,
      fieldName: 'securityQuestion',
      label: () => $t('page.profile.securityQuestion'),
      description: () => $t('page.profile.securityQuestionDesc'),
    },
    {
      value: true,
      fieldName: 'securityEmail',
      label: () => $t('page.profile.backupEmail'),
      description: () => $t('page.profile.backupEmailDesc'),
    },
    {
      value: false,
      fieldName: 'securityMfa',
      label: () => $t('page.profile.mfaDevice'),
      description: () => $t('page.profile.mfaDeviceDesc'),
    },
  ];
});
</script>
<template>
  <ProfileSecuritySetting :form-schema="formSchema" />
</template>

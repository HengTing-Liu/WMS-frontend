<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: () => $t('page.profile.oldPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: () => $t('page.profile.inputOldPassword'),
      },
    },
    {
      fieldName: 'newPassword',
      label: () => $t('page.profile.newPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: () => $t('page.profile.inputNewPassword'),
      },
    },
    {
      fieldName: 'confirmPassword',
      label: () => $t('page.profile.confirmPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: () => $t('page.profile.inputNewPasswordAgain'),
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: () => $t('page.profile.inputNewPasswordAgain') })
            .min(1, { message: () => $t('page.profile.inputNewPasswordAgain') })
            .refine((value) => value === newPassword, {
              message: () => $t('page.profile.passwordMismatch'),
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

function handleSubmit() {
  message.success($t('page.profile.passwordChangeSuccess'));
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>

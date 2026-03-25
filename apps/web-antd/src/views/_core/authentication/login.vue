<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed, markRaw } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { SUPPORT_LANGUAGES } from '@vben/constants';
import { $t } from '@vben/locales';
import { loadLocaleMessages } from '@vben/locales';
import { preferences, updatePreferences } from '@vben/preferences';
import { VbenDropdownRadioMenu } from '@vben-core/shadcn-ui';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const MOCK_USER_OPTIONS: BasicOption[] = [
  {
    label: 'Super',
    value: 'vben',
  },
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'User',
    value: 'jack',
  },
];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: 'admin123',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
      defaultValue: 'admin',
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
      defaultValue: 'admin123',

    },
  ];
});

// 语言切换处理
async function handleLanguageChange(value: string | undefined) {
  if (!value) return;
  updatePreferences({
    app: {
      locale: value,
    },
  });
  await loadLocaleMessages(value);
}
</script>

<template>
  <div class="relative">
    <!-- 语言选择器 - 右上角 -->
    <div class="absolute right-0 top-0 z-10">
      <VbenDropdownRadioMenu
        :menus="SUPPORT_LANGUAGES"
        :model-value="preferences.app.locale"
        @update:model-value="handleLanguageChange"
      >
        <div class="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <span class="icon-[material-symbols--language] text-lg"></span>
          <span>{{ SUPPORT_LANGUAGES.find(item => item.value === preferences.app.locale)?.label || $t('page.common.chinese') }}</span>
          <span class="icon-[material-symbols--keyboard-arrow-down] text-lg"></span>
        </div>
      </VbenDropdownRadioMenu>
    </div>

    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      @submit="authStore.authLogin"
      :showCodeLogin="false"
      :showForgetPassword="false"
      :showRegister="false"
      :showRememberMe="false"
      :showQrcodeLogin="false"
      :showThirdPartyLogin="false"
    />
  </div>
</template>

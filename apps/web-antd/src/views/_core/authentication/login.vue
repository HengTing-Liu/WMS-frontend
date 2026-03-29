<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed, markRaw } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const route = useRoute();

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

const usernameDefault = computed(() => {
  const username = route.query.username as string | undefined;
  return username || 'ry';
});

const passwordDefault = computed(() => {
  const fromChangePwd = route.query.fromChangePwd === '1';
  const passwordFromQuery = route.query.password as string | undefined;
  if (fromChangePwd) {
    // 修改密码场景，强制清空密码
    return '';
  }
  // 普通退出登录场景，优先使用上次真正登录时输入的密码
  if (passwordFromQuery) {
    return passwordFromQuery;
  }
  // 首次进入或没有记录时，使用默认密码
  return 'admin123';
});

// 当路由 query（username、password、fromChangePwd）变化时，强制重新挂载登录组件
const loginKey = computed(() => {
  return JSON.stringify({
    username: route.query.username ?? '',
    password: route.query.password ?? '',
    fromChangePwd: route.query.fromChangePwd ?? '',
  });
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    // {
    //   component: 'VbenSelect',
    //   componentProps: {
    //     options: MOCK_USER_OPTIONS,
    //     placeholder: $t('authentication.selectAccount'),
    //   },
    //   fieldName: 'selectAccount',
    //   label: $t('authentication.selectAccount'),
    //   rules: z
    //     .string()
    //     .min(1, { message: $t('authentication.selectAccount') })
    //     .optional()
    //     .default('vben'),
    // },
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
      defaultValue: usernameDefault.value,
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
      defaultValue: passwordDefault.value,

    },
    // {
    //   component: markRaw(SliderCaptcha),
    //   fieldName: 'captcha',
    //   rules: z.boolean().refine((value) => value, {
    //     message: $t('authentication.verifyRequiredTip'),
    //   }),
    // },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :key="loginKey"
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
</template>

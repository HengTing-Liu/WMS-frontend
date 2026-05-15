<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed, h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getCaptchaApi } from '#/api';
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
  return username || 'admin';
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

const captchaImg = ref('');
const captchaUuid = ref('');

async function getCaptcha() {
  try {
    const res = await getCaptchaApi();
    const data = res.data || res;
    if (data?.uuid && data?.img) {
      captchaUuid.value = data.uuid;
      captchaImg.value = data.img;
    }
  } catch (error) {
    console.error('获取验证码失败', error);
  }
}

onMounted(() => {
  getCaptcha();
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
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入验证码',
        maxlength: 4,
      },
      fieldName: 'code',
      label: '验证码',
      defaultValue: '',
      rules: z.string().min(1, { message: '验证码不能为空' }),
      suffix: () =>
        h('img', {
          alt: '验证码',
          class:
            'ml-2 h-[36px] w-[111px] cursor-pointer rounded border border-gray-300',
          onClick: getCaptcha,
          src: captchaImg.value || '',
          style: 'object-fit: cover;',
        }),
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

async function handleLogin(values: Record<string, any>) {
  try {
    await authStore.authLogin({
      ...values,
      uuid: captchaUuid.value,
    });
  } catch {
    // 登录失败时刷新验证码
    getCaptcha();
  }
}
</script>

<template>
  <AuthenticationLogin
    :key="loginKey"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleLogin"
    :showCodeLogin="false"
    :showForgetPassword="false"
    :showRegister="false"
    :showRememberMe="false"
    :showQrcodeLogin="false"
    :showThirdPartyLogin="false"
  />
</template>

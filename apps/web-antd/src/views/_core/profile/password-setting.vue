<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Form, Input, Button, message } from 'ant-design-vue';

import { useAuthStore } from '#/store';
import { updateUserPwd } from '#/api';

const formRef = ref();
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const rules = {
  oldPassword: [{ required: true, message: '旧密码不能为空' }],
  newPassword: [{ required: true, message: '新密码不能为空' }],
  confirmPassword: [
    { required: true, message: '确认密码不能为空' },
    {
      validator(_: any, value: string) {
        if (!value || value === form.newPassword) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('两次输入的密码不一致'));
      },
    },
  ],
};

const authStore = useAuthStore();
const router = useRouter();

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const res = (await updateUserPwd(form.oldPassword, form.newPassword)) as any;
    if (res?.code === 200) {
      message.success(res?.msg ?? '密码修改成功，即将退出登录');
      await authStore.logout(false, { fromChangePwd: true });
    } else {
      message.error(res?.msg ?? '密码修改失败');
    }
  } catch {
    // 校验失败
  }
}

async function handleCancel() {
  await router.push({ name: 'User' });
}
</script>
<template>
  <Form
    ref="formRef"
    :model="form"
    :rules="rules"
    :label-col="{ style: { width: '80px' } }"
    :wrapper-col="{ style: { flex: 1 } }"
    class="max-w-xl"
  >
    <Form.Item label="旧密码" name="oldPassword">
      <Input.Password v-model:value="form.oldPassword" placeholder="请输入旧密码" />
    </Form.Item>
    <Form.Item label="新密码" name="newPassword">
      <Input.Password v-model:value="form.newPassword" placeholder="请输入新密码" />
    </Form.Item>
    <Form.Item label="确认密码" name="confirmPassword">
      <Input.Password v-model:value="form.confirmPassword" placeholder="请再次输入新密码" />
    </Form.Item>
    <Form.Item :wrapper-col="{ style: { marginLeft: '80px' } }">
      <Button type="primary" @click="handleSubmit">保存</Button>
      <Button class="ml-2" @click="handleCancel">关闭</Button>
    </Form.Item>
  </Form>
</template>

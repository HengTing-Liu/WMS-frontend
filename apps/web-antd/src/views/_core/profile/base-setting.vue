<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Form, Input, Radio, Button, message } from 'ant-design-vue';

import { getUserProfile, updateUserProfile } from '#/api';

const formRef = ref();
const form = reactive({
  nickName: '',
  phonenumber: '',
  email: '',
  sex: '2',
});

const rules = {
  nickName: [{ required: true, message: '用户昵称不能为空' }],
  phonenumber: [{ required: true, message: '手机号码不能为空' }],
  email: [{ required: true, message: '邮箱不能为空' }],
};

const router = useRouter();

async function loadProfile() {
  const res = (await getUserProfile()) as any;
  const data = res?.data ?? res;
  if (data) {
    form.nickName = data.nickName ?? '';
    form.phonenumber = data.phonenumber ?? '';
    form.email = data.email ?? '';
    form.sex = data.sex ?? '2';
  }
}

loadProfile();

async function handleSave() {
  try {
    await formRef.value?.validate();
    const payload = {
      nickName: form.nickName,
      phonenumber: form.phonenumber,
      email: form.email,
      sex: form.sex,
    };
    const res = (await updateUserProfile(payload)) as any;
    if (res?.code === 200) {
      message.success(res?.msg ?? '保存成功');
    } else {
      message.error(res?.msg ?? '保存失败');
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
    <Form.Item label="用户昵称" name="nickName">
      <Input v-model:value="form.nickName" placeholder="请输入用户昵称" />
    </Form.Item>
    <Form.Item label="手机号码" name="phonenumber">
      <Input v-model:value="form.phonenumber" placeholder="请输入手机号码" />
    </Form.Item>
    <Form.Item label="邮箱" name="email">
      <Input v-model:value="form.email" placeholder="请输入邮箱" />
    </Form.Item>
    <Form.Item label="性别" name="sex">
      <Radio.Group v-model:value="form.sex">
        <Radio value="0">男</Radio>
        <Radio value="1">女</Radio>
        <!-- <Radio value="2">未知</Radio> -->
      </Radio.Group>
    </Form.Item>
    <Form.Item :wrapper-col="{ style: { marginLeft: '80px' } }">
      <Button type="primary" @click="handleSave">保存</Button>
      <Button class="ml-2" @click="handleCancel">关闭</Button>
    </Form.Item>
  </Form>
</template>

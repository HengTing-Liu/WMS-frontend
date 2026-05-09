<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Avatar, Card, Col, Row, Tabs, message } from 'ant-design-vue';

import { getUserProfile } from '#/api';

import ProfileBase from './base-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';

const activeKey = ref<'base' | 'password'>('base');

const userInfo = ref<any | null>(null);
const roleGroup = ref<string>('');
const postGroup = ref<string>('');

onMounted(async () => {
  try {
    const res = (await getUserProfile()) as any;
    const data = res?.data ?? res;
    userInfo.value = data ?? {};
    roleGroup.value = res?.roleGroup ?? '';
    postGroup.value = res?.postGroup ?? '';
  } catch (e: any) {
    message.error(e?.message ?? '获取个人信息失败');
  }
});

const avatarUrl = computed(() => {
  return (
    userInfo.value?.avatar ||
    'https://avatar.vercel.sh/user.svg?text=User'
  );
});
</script>

<template>
  <div class="profile-page p-4">
    <Row :gutter="20" :wrap="false">
      <!-- 左侧个人信息 -->
      <Col :span="6">
        <Card class="h-full">
          <template #title>个人信息</template>
          <div class="text-center mb-4">
            <Avatar :src="avatarUrl" :size="80" />
          </div>
          <ul class="info-list">
            <li class="info-item">
              <span class="label">用户名称</span>
              <span class="value">{{ userInfo?.userName }}</span>
            </li>
            <li class="info-item">
              <span class="label">手机号码</span>
              <span class="value">{{ userInfo?.phonenumber || '-' }}</span>
            </li>
            <li class="info-item">
              <span class="label">用户邮箱</span>
              <span class="value">{{ userInfo?.email || '-' }}</span>
            </li>
            <li class="info-item">
              <span class="label">所属部门</span>
              <span class="value">
                {{ userInfo?.dept?.deptName || '-' }}
                <template v-if="postGroup">
                  / {{ postGroup }}
                </template>
              </span>
            </li>
            <li class="info-item">
              <span class="label">所属角色</span>
              <span class="value">{{ roleGroup || '-' }}</span>
            </li>
            <li class="info-item">
              <span class="label">创建日期</span>
              <span class="value">{{ userInfo?.createTime || '-' }}</span>
            </li>
          </ul>
        </Card>
      </Col>

      <!-- 右侧基本资料 / 修改密码 -->
      <Col :span="18">
        <Card>
          <template #title>基本资料</template>
          <Tabs v-model:activeKey="activeKey">
            <Tabs.TabPane key="base" tab="基本资料">
              <ProfileBase />
            </Tabs.TabPane>
            <Tabs.TabPane key="password" tab="修改密码">
              <ProfilePasswordSetting />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<style scoped>
.profile-page {
  background-color: #f5f5f5;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: rgba(0, 0, 0, 0.65);
}

.value {
  color: rgba(0, 0, 0, 0.85);
}
</style>

<template>
  <div class="permission-query-page">
    <a-card :title="$t('page.system.dataPermission.title')" :bordered="false">
      <!-- 查询表单 -->
      <a-form :model="queryForm" layout="inline">
        <a-form-item :label="$t('page.system.dataPermission.user')">
          <a-input-number
            v-model:value="queryForm.userId"
            :placeholder="$t('page.common.inputPlaceholder')"
            style="width: 150px"
          />
        </a-form-item>
        <a-form-item :label="$t('page.system.dataPermission.tableCode')">
          <a-input
            v-model:value="queryForm.tableCode"
            :placeholder="$t('page.common.inputPlaceholder')"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleQuery">
              {{ $t('page.common.search') }}
            </a-button>
            <a-button @click="handleReset">
              {{ $t('page.common.reset') }}
            </a-button>
            <a-button @click="handleRefreshCache">
              {{ $t('page.system.dataPermission.refreshCache') }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 权限详情 -->
      <div v-if="permissionDetail" class="permission-detail">
        <a-divider />
        <a-descriptions
          :title="$t('page.system.dataPermission.effectivePermission')"
          :column="2"
          bordered
        >
          <a-descriptions-item :label="$t('page.system.dataPermission.user')">
            {{ permissionDetail.dimensionName }}
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.tableCode')"
          >
            {{ permissionDetail.tableCode }} ({{ permissionDetail.tableName }})
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.dataScope')"
          >
            {{ permissionDetail.dataScopeName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('page.system.dataPermission.sqlCondition')">
            <a-tag color="blue">{{ permissionDetail.sqlCondition }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 白名单/黑名单 -->
        <a-divider :dashed="true" />
        <a-descriptions :column="2" bordered>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.deptWhitelist')"
            :span="2"
          >
            <a-tag
              v-for="dept in permissionDetail.deptWhitelist"
              :key="dept"
              color="green"
            >
              {{ dept }}
            </a-tag>
            <span v-if="!permissionDetail.deptWhitelist?.length">-</span>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.deptBlacklist')"
            :span="2"
          >
            <a-tag
              v-for="dept in permissionDetail.deptBlacklist"
              :key="dept"
              color="red"
            >
              {{ dept }}
            </a-tag>
            <span v-if="!permissionDetail.deptBlacklist?.length">-</span>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.customSql')"
            :span="2"
          >
            <code>{{ permissionDetail.customSql || '-' }}</code>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 权限继承链 -->
        <a-divider :dashed="true" />
        <h3>{{ $t('page.system.dataPermission.inheritChain') }}</h3>
        <a-timeline>
          <a-timeline-item
            v-for="(item, index) in permissionDetail.inheritChain"
            :key="index"
            :color="item.overridden ? 'gray' : 'blue'"
          >
            <template #dot>
              <CheckCircleOutlined
                v-if="!item.overridden"
                style="font-size: 16px"
              />
              <CloseCircleOutlined
                v-else
                style="font-size: 16px"
              />
            </template>
            <div>
              <strong>{{ item.dimensionName }}</strong>
              <a-tag :color="item.overridden ? 'default' : 'blue'">
                {{ item.dataScopeName }}
              </a-tag>
              <br />
              <small>{{ item.reason }}</small>
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { $t } from '#/locales';
import {
  getUserDataPermission,
  refreshUserPermissionCache,
  type UserDataPermissionResult,
} from '#/api/sys/data-permission/permission-query';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue';

// 查询表单
const queryForm = ref({
  userId: undefined as number | undefined,
  tableCode: '',
});

// 权限详情
const permissionDetail = ref<UserDataPermissionResult | null>(null);

// 加载状态
const loading = ref(false);

// 查询
async function handleQuery() {
  if (!queryForm.value.userId) {
    message.warning($t('page.system.dataPermission.userRequired'));
    return;
  }
  if (!queryForm.value.tableCode) {
    message.warning($t('page.system.dataPermission.tableCodeRequired'));
    return;
  }

  loading.value = true;
  try {
    const res = await getUserDataPermission({
      userId: queryForm.value.userId,
      tableCode: queryForm.value.tableCode,
    });
    permissionDetail.value = res.data;
  } catch (error) {
    // Error handling
  } finally {
    loading.value = false;
  }
}

// 重置
function handleReset() {
  queryForm.value = {
    userId: undefined,
    tableCode: '',
  };
  permissionDetail.value = null;
}

// 刷新缓存
async function handleRefreshCache() {
  try {
    await refreshUserPermissionCache({
      userId: queryForm.value.userId,
      tableCode: queryForm.value.tableCode,
    });
    message.success($t('page.system.dataPermission.refreshCacheSuccess'));
  } catch (error) {
    // Error handling
  }
}
</script>

<style scoped>
.permission-query-page {
  padding: 16px;
}

.permission-detail {
  margin-top: 24px;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>

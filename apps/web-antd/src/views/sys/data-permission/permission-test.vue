<template>
  <div class="permission-test-page">
    <a-card :title="$t('page.system.dataPermission.permissionTest')" :bordered="false">
      <!-- SQL 测试 -->
      <a-form :model="testForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item
              :label="$t('page.system.dataPermission.user')"
              :required="true"
            >
              <a-input-number
                v-model:value="testForm.userId"
                :placeholder="$t('page.common.inputPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item
              :label="$t('page.system.dataPermission.tableCode')"
              :required="true"
            >
              <a-input
                v-model:value="testForm.tableCode"
                :placeholder="$t('page.common.inputPlaceholder')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="$t('page.system.dataPermission.previewSql')">
              <a-switch v-model:checked="testForm.previewSql" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          :label="$t('page.system.dataPermission.baseSql')"
          :required="true"
        >
          <a-textarea
            v-model:value="testForm.baseSql"
            :placeholder="$t('page.system.dataPermission.baseSqlPlaceholder')"
            :rows="4"
          />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="loading" @click="handleSimulate">
              {{ $t('page.system.dataPermission.simulateQuery') }}
            </a-button>
            <a-button @click="handleClearCache">
              {{ $t('page.system.dataPermission.clearCache') }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 测试结果 -->
      <div v-if="testResult" class="test-result">
        <a-divider />
        <a-descriptions :title="$t('page.system.dataPermission.testResult')" bordered>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.originalSql')"
            :span="2"
          >
            <code>{{ testResult.originalSql }}</code>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.finalSql')"
            :span="2"
          >
            <code>{{ testResult.finalSql }}</code>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.permissionDimension')"
          >
            <a-tag color="blue">
              {{ testResult.permissionInfo.dimension }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.dataScope')"
          >
            <a-tag color="green">
              {{ testResult.permissionInfo.dataScope }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.whereCondition')"
            :span="2"
          >
            <code>{{ testResult.permissionInfo.whereCondition }}</code>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- 覆盖率分析 -->
      <div v-if="coverageResult" class="coverage-analysis">
        <a-divider />
        <a-descriptions
          :title="$t('page.system.dataPermission.coverageAnalysis')"
          bordered
        >
          <a-descriptions-item
            :label="$t('page.system.dataPermission.totalCount')"
          >
            {{ coverageResult.totalCount }}
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.allowedCount')"
          >
            <span style="color: green">
              {{ coverageResult.allowedCount }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.deniedCount')"
          >
            <span style="color: red">
              {{ coverageResult.deniedCount }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item
            :label="$t('page.system.dataPermission.coverageRate')"
          >
            <a-progress
              :percent="coverageResult.coverageRate * 100"
              :format="(percent) => `${percent.toFixed(2)}%`"
            />
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { $t } from '#/locales';
import {
  simulateQuery,
  analyzeCoverage,
  clearPermissionCache,
  type SimulateQueryResponse,
  type CoverageAnalysisResponse,
} from '#/api/sys/data-permission/permission-test';

// 测试表单
const testForm = ref({
  userId: undefined as number | undefined,
  tableCode: '',
  baseSql: '',
  previewSql: true,
});

// 测试结果
const testResult = ref<SimulateQueryResponse | null>(null);

// 覆盖率结果
const coverageResult = ref<CoverageAnalysisResponse | null>(null);

// 加载状态
const loading = ref(false);

// 模拟查询
async function handleSimulate() {
  if (!testForm.value.userId) {
    message.warning($t('page.system.dataPermission.userRequired'));
    return;
  }
  if (!testForm.value.tableCode) {
    message.warning($t('page.system.dataPermission.tableCodeRequired'));
    return;
  }
  if (!testForm.value.baseSql) {
    message.warning($t('page.system.dataPermission.baseSqlRequired'));
    return;
  }

  loading.value = true;
  try {
    // 模拟查询
    const simulateRes = await simulateQuery({
      userId: testForm.value.userId,
      tableCode: testForm.value.tableCode,
      baseSql: testForm.value.baseSql,
      previewSql: testForm.value.previewSql,
    });
    testResult.value = simulateRes.data;

    // 覆盖率分析
    const coverageRes = await analyzeCoverage({
      userId: testForm.value.userId,
      tableCode: testForm.value.tableCode,
    });
    coverageResult.value = coverageRes.data;

    message.success($t('page.system.dataPermission.simulateSuccess'));
  } catch (error) {
    // Error handling
  } finally {
    loading.value = false;
  }
}

// 清除缓存
async function handleClearCache() {
  try {
    await clearPermissionCache();
    message.success($t('page.system.dataPermission.clearCacheSuccess'));
  } catch (error) {
    // Error handling
  }
}
</script>

<style scoped>
.permission-test-page {
  padding: 16px;
}

.test-result,
.coverage-analysis {
  margin-top: 24px;
}

code {
  display: block;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

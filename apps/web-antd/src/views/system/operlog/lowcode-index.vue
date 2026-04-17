<template>
  <div class="sys-oper-log-page">
    <LowcodePage
      ref="lowcodePageRef"
      table-code="sys_oper_log"
      page-title="操作日志"
      page-desc="基于低代码配置的操作日志查询页面"
      crud-prefix="/api/wms/crud/sys_oper_log"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- 序号 -->
        <span v-if="column?.key === 'seq'">
          {{ ((lowcodePageRef?.pagination?.current ?? 1) - 1) * (lowcodePageRef?.pagination?.pageSize ?? 20) + index + 1 }}
        </span>

        <!-- 业务类型 -->
        <span v-else-if="column?.dataIndex === 'businessType' || column?.key === 'businessType'">
          <Tag color="gold">{{ renderBusinessType(record.businessType) }}</Tag>
        </span>

        <!-- 操作状态 -->
        <span v-else-if="column?.dataIndex === 'status' || column?.key === 'status'">
          <Tag :color="record.status === 0 ? 'processing' : 'error'">
            {{ record.status === 0 ? '成功' : '失败' }}
          </Tag>
        </span>

        <!-- 操作类别 -->
        <span v-else-if="column?.dataIndex === 'operatorType' || column?.key === 'operatorType'">
          {{ renderOperatorType(record.operatorType) }}
        </span>

        <!-- 请求方式 -->
        <span v-else-if="column?.dataIndex === 'requestMethod' || column?.key === 'requestMethod'">
          <Tag>{{ record.requestMethod }}</Tag>
        </span>

        <!-- 消耗时间 -->
        <span v-else-if="column?.dataIndex === 'costTime' || column?.key === 'costTime'">
          {{ record.costTime }} ms
        </span>

        <!-- 默认显示 -->
        <span v-else>{{ formatDefaultCell(record, column) }}</span>
      </template>
    </LowcodePage>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Tag } from 'ant-design-vue';
import LowcodePage from '#/lowcode/LowcodePage.vue';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

const businessTypeOptions = [
  { label: '其它', value: 0 },
  { label: '新增', value: 1 },
  { label: '修改', value: 2 },
  { label: '删除', value: 3 },
  { label: '授权', value: 4 },
  { label: '导出', value: 5 },
  { label: '导入', value: 6 },
  { label: '强退', value: 7 },
  { label: '生成代码', value: 8 },
  { label: '清空数据', value: 9 },
];

function renderBusinessType(type: number) {
  const found = businessTypeOptions.find((item) => item.value === type);
  return found?.label ?? '其它';
}

function renderOperatorType(type: number) {
  const map: Record<number, string> = {
    0: '其它',
    1: '后台用户',
    2: '手机端用户',
  };
  return map[type as number] ?? '其它';
}

function pickRecordField(record: Record<string, any>, key: string): unknown {
  if (!record || key == null || key === '') return undefined;
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  if (Object.prototype.hasOwnProperty.call(record, snake)) return record[snake];
  const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (Object.prototype.hasOwnProperty.call(record, camel)) return record[camel];
  return record[key];
}

function formatDefaultCell(record: Record<string, any>, column: any): string {
  const key = column?.dataIndex ?? column?.key;
  if (key == null || key === 'seq' || key === 'action') return '';
  const raw = pickRecordField(record, String(key));
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'object') return JSON.stringify(raw);
  return String(raw);
}
</script>

<style scoped>
.sys-oper-log-page {
  min-height: 100%;
}
</style>

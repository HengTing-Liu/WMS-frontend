<template>
  <WmsPageLayout title="低代码发布管理" description="将表/字段/操作元数据变更发布到数据库，执行 DDL 变更">
    <!-- 标签页：发布 / 历史 -->
    <a-tabs v-model:activeKey="activeTab" class="publish-tabs">
      <!-- ======= 发布 Tab ======= -->
      <a-tab-pane key="publish" tab="发布变更">
        <Card :bordered="false" class="plan-card">
          <!-- 步骤 1: 选择目标表 -->
          <a-steps :current="step" size="small" class="publish-steps">
            <a-step title="选择表" description="选择要发布的目标表" />
            <a-step title="预览变更" description="审阅 Diff 和 SQL" />
            <a-step title="确认发布" description="执行变更" />
          </a-steps>

          <!-- 步骤 1: 选择表 -->
          <div v-show="step === 0" class="step-content">
            <div class="step-header">
              <Typography.Text type="secondary">选择要发布的表（元数据变更将落地到数据库）</Typography.Text>
            </div>

            <!-- 表选择 -->
            <div class="table-select-area">
              <Select
                v-model:value="selectedTableCode"
                :loading="tableLoading"
                placeholder="请选择表（选择后自动生成变更计划）"
                style="width: 400px"
                show-search
                :filter-option="filterOption"
                @change="handleTableSelect"
              >
                <Select.Option v-for="t in tableList" :key="t.tableCode" :value="t.tableCode">
                  <span>{{ t.tableCode }}</span>
                  <span style="color: #999; margin-left: 8px">{{ t.tableName }}</span>
                </Select.Option>
              </Select>
              <Typography.Text type="secondary" style="margin-left: 16px">最多选择 1 张表</Typography.Text>
            </div>

            <!-- 强制执行选项 -->
            <div class="force-option">
              <Checkbox v-model:checked="forcePublish">强制执行（忽略破坏性警告，谨慎使用）</Checkbox>
            </div>

            <!-- 备注 -->
            <div class="remark-area">
              <Typography.Text type="secondary">发布备注（可选）：</Typography.Text>
              <TextArea
                v-model:value="publishRemark"
                placeholder="描述此次发布的内容..."
                :rows="2"
                style="width: 500px; margin-top: 8px"
              />
            </div>

            <!-- 生成计划按钮 -->
            <div class="action-bar">
              <Button type="primary" :loading="planLoading" :disabled="!selectedTableCode" @click="handleGeneratePlan">
                <Rocket v-if="!planLoading" class="btn-icon" />
                生成变更计划
              </Button>
            </div>
          </div>

          <!-- 步骤 2: 预览变更 -->
          <div v-show="step === 1" class="step-content">
            <div class="step-header">
              <Space>
                <Typography.Text type="secondary">变更计划预览</Typography.Text>
                <Tag :color="riskColor">{{ riskLabel }}</Tag>
                <Typography.Text type="secondary">版本 {{ currentPlan?.version }} · {{ currentPlan?.tableName }}</Typography.Text>
              </Space>
              <Button @click="handleBackToStep0">重新选择表</Button>
            </div>

            <!-- 校验结果 -->
            <Alert
              v-if="currentPlan?.validation"
              :type="currentPlan.validation.passed ? 'success' : 'error'"
              show-icon
              style="margin-bottom: 16px"
            >
              <template #message>
                <Space>
                  <Typography.Text strong>校验结果：</Typography.Text>
                  <Typography.Text v-if="currentPlan.validation.passed">通过</Typography.Text>
                  <Typography.Text v-else type="danger">未通过</Typography.Text>
                  <Typography.Text v-if="currentPlan.validation.warnings?.length" type="warning">
                    · {{ currentPlan.validation.warnings.length }} 个警告
                  </Typography.Text>
                </Space>
              </template>
              <template #description>
                <ul v-if="!currentPlan.validation.passed" style="margin: 8px 0 0; padding-left: 20px">
                  <li v-for="(err, i) in currentPlan.validation.errors" :key="i" style="color: #ff4d4f">
                    {{ err }}
                  </li>
                </ul>
                <ul v-if="currentPlan.validation.warnings?.length" style="margin: 4px 0 0; padding-left: 20px">
                  <li v-for="(warn, i) in currentPlan.validation.warnings" :key="i" style="color: #faad14">
                    {{ warn }}
                  </li>
                </ul>
              </template>
            </Alert>

            <!-- Diff 表格 -->
            <Collapse v-if="currentPlan?.diff" v-model:activeKey="diffActiveKeys" style="margin-bottom: 16px">
              <CollapsePanel key="added" header="新增字段">
                <a-table
                  v-if="currentPlan.diff.addedColumns?.length"
                  :columns="diffColumns"
                  :data-source="currentPlan.diff.addedColumns"
                  :pagination="false"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <Tag v-if="column.key === 'changeType'" color="green">{{ record.changeType }}</Tag>
                    <Typography.Text v-else>{{ record[column.dataIndex] }}</Typography.Text>
                  </template>
                </a-table>
                <Typography.Text v-else type="secondary">无新增字段</Typography.Text>
              </CollapsePanel>
              <CollapsePanel key="modified" header="修改字段">
                <a-table
                  v-if="currentPlan.diff.modifiedColumns?.length"
                  :columns="diffColumnsModify"
                  :data-source="currentPlan.diff.modifiedColumns"
                  :pagination="false"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <Tag v-if="column.key === 'changeType'" color="orange">{{ record.changeType }}</Tag>
                    <Typography.Text v-else-if="column.key === 'metaValue'" type="success">{{ record.metaValue }}</Typography.Text>
                    <Typography.Text v-else-if="column.key === 'dbValue'" type="secondary">{{ record.dbValue }}</Typography.Text>
                    <Typography.Text v-else>{{ record[column.dataIndex] }}</Typography.Text>
                  </template>
                </a-table>
                <Typography.Text v-else type="secondary">无修改字段</Typography.Text>
              </CollapsePanel>
            </Collapse>

            <!-- SQL 清单 -->
            <div class="sql-list-title">
              <Typography.Text strong>SQL 清单（共 {{ currentPlan?.sqlList?.length || 0 }} 条）</Typography.Text>
            </div>
            <div class="sql-items">
              <div v-for="item in currentPlan?.sqlList" :key="item.seq" class="sql-item" :class="'risk-' + item.riskLevel?.toLowerCase()">
                <div class="sql-item-header">
                  <Tag :color="getRiskColor(item.riskLevel)">{{ item.riskLevel }}</Tag>
                  <Tag>{{ getSqlTypeLabel(item.sqlType) }}</Tag>
                  <Typography.Text type="secondary">{{ item.riskReason }}</Typography.Text>
                </div>
                <pre class="sql-text">{{ item.sqlText }}</pre>
              </div>
            </div>

            <!-- 步骤 2 操作栏 -->
            <div class="action-bar">
              <Button @click="handleBackToStep0">上一步</Button>
              <Button
                type="primary"
                :disabled="!currentPlan?.canPublish"
                @click="handleConfirmPublish"
              >
                确认发布
              </Button>
            </div>
          </div>

          <!-- 步骤 3: 发布结果 -->
          <div v-show="step === 2" class="step-content">
            <Result
              v-if="publishResult"
              :status="publishResult.status === 'SUCCESS' ? 'success' : 'error'"
              :title="publishResult.status === 'SUCCESS' ? '发布成功' : '发布失败'"
              :sub-title="`共 ${publishResult.totalSqls} 条 SQL，成功 ${publishResult.successSqls} 条，失败 ${publishResult.failedSqls} 条`"
            >
              <template #extra>
                <Space direction="vertical">
                  <div v-if="publishResult.errorMessage" class="error-detail">
                    <Typography.Text type="danger">{{ publishResult.errorMessage }}</Typography.Text>
                  </div>
                  <Collapse v-if="publishResult.details?.length">
                    <CollapsePanel key="details" header="查看执行明细">
                      <a-table
                        :columns="detailColumns"
                        :data-source="publishResult.details"
                        :pagination="false"
                        size="small"
                      >
                        <template #bodyCell="{ column, record }">
                          <Tag v-if="column.key === 'resultStatus'" :color="getResultColor(record.resultStatus)">
                            {{ record.resultStatus }}
                          </Tag>
                          <Tag v-else-if="column.key === 'riskLevel'" :color="getRiskColor(record.riskLevel)">
                            {{ record.riskLevel }}
                          </Tag>
                          <Typography.Text v-else-if="column.key === 'errorMessage'" type="danger">{{ record.errorMessage }}</Typography.Text>
                          <Typography.Text v-else>{{ record[column.dataIndex] }}</Typography.Text>
                        </template>
                      </a-table>
                    </CollapsePanel>
                  </Collapse>
                  <Space>
                    <Button @click="handleReset">继续发布</Button>
                    <Button @click="handleViewHistory">查看历史</Button>
                  </Space>
                </Space>
              </template>
            </Result>
          </div>
        </Card>
      </a-tab-pane>

      <!-- ======= 发布历史 Tab ======= -->
      <a-tab-pane key="history" tab="发布历史">
        <Card :bordered="false">
          <!-- 筛选条件 -->
          <div class="history-filters">
            <Select
              v-model:value="historyQuery.tableCode"
              :loading="tableLoading"
              placeholder="按表编码筛选"
              style="width: 200px"
              allow-clear
              show-search
              :filter-option="filterOption"
            >
              <Select.Option v-for="t in tableList" :key="t.tableCode" :value="t.tableCode">
                {{ t.tableCode }}
              </Select.Option>
            </Select>
            <Select
              v-model:value="historyQuery.status"
              placeholder="按状态筛选"
              style="width: 140px"
              allow-clear
            >
              <Select.Option value="PENDING">待执行</Select.Option>
              <Select.Option value="RUNNING">执行中</Select.Option>
              <Select.Option value="SUCCESS">成功</Select.Option>
              <Select.Option value="FAILED">失败</Select.Option>
            </Select>
            <Button type="primary" @click="loadHistory">查询</Button>
            <Button @click="resetHistoryQuery">重置</Button>
          </div>

          <!-- 历史列表 -->
          <WmsDataTable
            :columns="historyColumns"
            :data-source="historyData"
            :loading="historyLoading"
            :pagination="{ current: historyPage, pageSize: 20, total: historyTotal }"
            row-key="id"
            @change="handleHistoryTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="getStatusColor(record.status)">{{ record.status }}</Tag>
              </template>
              <template v-else-if="column.key === 'version'">
                <Typography.Text>V{{ record.version }}</Typography.Text>
              </template>
              <template v-else-if="column.key === 'sqlSummary'">
                <Typography.Text>
                  {{ record.successSqls }}/{{ record.totalSqls }} 成功
                  <Typography.Text v-if="record.failedSqls > 0" type="danger">，{{ record.failedSqls }} 失败</Typography.Text>
                </Typography.Text>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="handleViewDetail(record)">详情</Button>
                </Space>
              </template>
            </template>
          </WmsDataTable>
        </Card>

        <!-- 历史详情抽屉 -->
        <a-drawer
          v-model:open="detailDrawerVisible"
          title="发布详情"
          width="720"
          placement="right"
        >
          <template v-if="currentHistoryRecord">
            <Descriptions :column="2" bordered size="small">
              <Descriptions.Item label="发布编码">{{ currentHistoryRecord.publishCode }}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag :color="getStatusColor(currentHistoryRecord.status)">{{ currentHistoryRecord.status }}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="表编码">{{ currentHistoryRecord.tableCode }}</Descriptions.Item>
              <Descriptions.Item label="版本">V{{ currentHistoryRecord.version }}</Descriptions.Item>
              <Descriptions.Item label="发布人">{{ currentHistoryRecord.publishByName }}</Descriptions.Item>
              <Descriptions.Item label="发布时间">{{ currentHistoryRecord.publishTime }}</Descriptions.Item>
              <Descriptions.Item label="执行结果" :span="2">
                共 {{ currentHistoryRecord.totalSqls }} 条，成功 {{ currentHistoryRecord.successSqls }} 条
                <Typography.Text v-if="currentHistoryRecord.failedSqls > 0" type="danger">，失败 {{ currentHistoryRecord.failedSqls }} 条</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item v-if="currentHistoryRecord.errorMessage" label="错误信息" :span="2">
                <Typography.Text type="danger">{{ currentHistoryRecord.errorMessage }}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item v-if="currentHistoryRecord.remark" label="备注" :span="2">
                {{ currentHistoryRecord.remark }}
              </Descriptions.Item>
            </Descriptions>

            <Typography.Text strong style="display: block; margin: 16px 0 8px">SQL 执行明细</Typography.Text>
            <a-table
              v-if="currentHistoryRecord.details?.length"
              :columns="detailColumns"
              :data-source="currentHistoryRecord.details"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <Tag v-if="column.key === 'resultStatus'" :color="getResultColor(record.resultStatus)">
                  {{ record.resultStatus }}
                </Tag>
                <Tag v-else-if="column.key === 'riskLevel'" :color="getRiskColor(record.riskLevel)">
                  {{ record.riskLevel }}
                </Tag>
                <Typography.Text v-else-if="column.key === 'errorMessage'" type="danger" style="font-size: 12px">
                  {{ record.errorMessage }}
                </Typography.Text>
                <pre v-else-if="column.key === 'sqlText'" style="margin: 0; font-size: 12px; white-space: pre-wrap">{{ record.sqlText }}</pre>
                <Typography.Text v-else>{{ record[column.dataIndex] }}</Typography.Text>
              </template>
            </a-table>
            <Typography.Text v-else type="secondary">暂无执行明细</Typography.Text>
          </template>
        </a-drawer>
      </a-tab-pane>
    </a-tabs>
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Input,
  Result,
  Select,
  SelectOption,
  Space,
  Tabs,
  TabPane,
  Table as ATable,
  Tag,
  Typography,
  Tooltip,
  message,
  Modal,
} from 'ant-design-vue';
import { Rocket } from 'lucide-vue-next';
import type { TableColumnsType } from 'ant-design-vue';
import { WmsDataTable, WmsPageLayout } from '#/components/wms';
import {
  generatePublishPlan,
  savePublishPlan,
  executePublish,
  getPublishHistory,
  getPublishById,
  type MetaPublishApi,
} from '#/api/system/metaPublish';
import { getTableMetaList } from '#/api/system/tableMeta';
import { IconifyIcon } from '@vben/icons';

const TextArea = Input.TextArea;
const activeTab = ref('publish');
const step = ref(0);

// ========== 步骤 1: 选择表 ==========
const tableLoading = ref(false);
const tableList = ref<{ tableCode: string; tableName: string }[]>([]);
const selectedTableCode = ref<string | undefined>(undefined);
const forcePublish = ref(false);
const publishRemark = ref('');
const planLoading = ref(false);

// ========== 步骤 2: 预览 ==========
const currentPlan = ref<MetaPublishApi.PublishPlanResponse | null>(null);
const diffActiveKeys = ref(['added', 'modified']);
const currentPublishCode = ref('');

// ========== 步骤 3: 结果 ==========
const publishResult = ref<MetaPublishApi.PublishResponse | null>(null);

// ========== 历史 ==========
const historyLoading = ref(false);
const historyData = ref<MetaPublishApi.PublishResponse[]>([]);
const historyPage = ref(1);
const historyPageSize = ref(20);
const historyTotal = ref(0);
const historyQuery = ref<{ tableCode?: string; status?: string }>({});
const detailDrawerVisible = ref(false);
const currentHistoryRecord = ref<MetaPublishApi.PublishResponse | null>(null);

// ========== 辅助 ==========
const riskColor = computed(() => {
  const r = currentPlan.value?.overallRisk;
  if (r === 'DANGER') return 'red';
  if (r === 'WARNING') return 'orange';
  return 'green';
});

const riskLabel = computed(() => {
  const r = currentPlan.value?.overallRisk;
  if (r === 'DANGER') return '高风险';
  if (r === 'WARNING') return '中风险';
  return '低风险';
});

// ========== Diff 表格列 ==========
const diffColumns: TableColumnsType = [
  { title: '变更', key: 'changeType', width: 80 },
  { title: '字段编码', dataIndex: 'columnCode', key: 'columnCode' },
  { title: '字段名称', dataIndex: 'columnName', key: 'columnName' },
  { title: '数据库类型', dataIndex: 'metaValue', key: 'metaValue' },
];

const diffColumnsModify: TableColumnsType = [
  { title: '变更', key: 'changeType', width: 80 },
  { title: '字段编码', dataIndex: 'columnCode', key: 'columnCode' },
  { title: '字段名称', dataIndex: 'columnName', key: 'columnName' },
  { title: '当前库类型', key: 'dbValue', width: 180 },
  { title: '元数据定义', key: 'metaValue', width: 180 },
];

// ========== 历史列表列 ==========
const historyColumns: TableColumnsType = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
  { title: '发布编码', dataIndex: 'publishCode', key: 'publishCode', width: 200, ellipsis: true },
  { title: '表编码', dataIndex: 'tableCode', key: 'tableCode', width: 150 },
  { title: '版本', key: 'version', width: 70 },
  { title: '状态', key: 'status', width: 90 },
  { title: '执行结果', key: 'sqlSummary', width: 140 },
  { title: '发布人', dataIndex: 'publishByName', key: 'publishByName', width: 100 },
  { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 170 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
];

// ========== 详情列 ==========
const detailColumns: TableColumnsType = [
  { title: '#', dataIndex: 'seq', key: 'seq', width: 50 },
  { title: '类型', key: 'sqlType', width: 120 },
  { title: '风险', key: 'riskLevel', width: 80 },
  { title: '结果', key: 'resultStatus', width: 90 },
  { title: '耗时', dataIndex: 'executionTime', key: 'executionTime', width: 80 },
  { title: 'SQL', key: 'sqlText', width: 300, ellipsis: true },
  { title: '错误', key: 'errorMessage', ellipsis: true },
];

// ========== 加载表列表 ==========
async function loadTableList() {
  tableLoading.value = true;
  try {
    const res = await getTableMetaList({ pageSize: 500 });
    tableList.value = res.rows || [];
  } catch (e: any) {
    message.error('加载表列表失败');
  } finally {
    tableLoading.value = false;
  }
}

function filterOption(input: string, option: any) {
  return String(option.label || '').toLowerCase().includes(input.toLowerCase());
}

// ========== 步骤操作 ==========
async function handleTableSelect() {
  // 选择表后可以自动生成计划，也可以等用户点击按钮
}

async function handleGeneratePlan() {
  if (!selectedTableCode.value) {
    message.warning('请先选择表');
    return;
  }
  planLoading.value = true;
  try {
    const res = await generatePublishPlan({
      tableCodes: [selectedTableCode.value],
      forced: forcePublish.value,
    });
    currentPlan.value = res[0] || null;
    if (currentPlan.value) {
      step.value = 1;
    }
  } catch (e: any) {
    message.error(e?.message || '生成变更计划失败');
  } finally {
    planLoading.value = false;
  }
}

function handleBackToStep0() {
  step.value = 0;
}

async function handleConfirmPublish() {
  if (!currentPlan.value?.canPublish) {
    message.warning('当前计划无法发布，请检查校验结果');
    return;
  }

  // 二次确认
  Modal.confirm({
    title: '确认发布',
    content: `即将在数据库执行 ${currentPlan.value.sqlList?.length || 0} 条 SQL，请确认是否继续？`,
    okText: '确认发布',
    cancelText: '取消',
    okButtonProps: { danger: true },
    async onOk() {
      planLoading.value = true;
      try {
        // 先保存计划
        const saveRes = await savePublishPlan({
          tableCodes: [selectedTableCode.value!],
          forced: forcePublish.value,
          remark: publishRemark.value,
        });
        currentPublishCode.value = saveRes.publishCode || '';

        // 再执行
        const execRes = await executePublish({
          publishCode: currentPublishCode.value,
          forced: forcePublish.value,
        });
        publishResult.value = execRes;
        step.value = 2;
      } catch (e: any) {
        message.error(e?.message || '发布失败');
      } finally {
        planLoading.value = false;
      }
    },
  });
}

function handleReset() {
  step.value = 0;
  selectedTableCode.value = undefined;
  currentPlan.value = null;
  publishResult.value = null;
  currentPublishCode.value = '';
  publishRemark.value = '';
  forcePublish.value = false;
}

function handleViewHistory() {
  activeTab.value = 'history';
  loadHistory();
}

// ========== 历史 ==========
async function loadHistory() {
  historyLoading.value = true;
  try {
    const res = await getPublishHistory({
      ...historyQuery.value,
      pageNum: historyPage.value,
      pageSize: historyPageSize.value,
    });
    // 后端目前返回 List，total 取数组长度
    historyData.value = Array.isArray(res) ? res : [];
    historyTotal.value = Array.isArray(res) ? res.length : 0;
  } catch (e: any) {
    message.error('加载历史失败');
  } finally {
    historyLoading.value = false;
  }
}

function resetHistoryQuery() {
  historyQuery.value = {};
  historyPage.value = 1;
  loadHistory();
}

function handleHistoryTableChange(pagination: any) {
  historyPage.value = pagination.current;
  loadHistory();
}

async function handleViewDetail(record: MetaPublishApi.PublishResponse) {
  try {
    const res = await getPublishById(record.id!);
    currentHistoryRecord.value = res;
    detailDrawerVisible.value = true;
  } catch (e: any) {
    message.error('加载详情失败');
  }
}

// ========== 辅助函数 ==========
function getRiskColor(risk?: string) {
  const map: Record<string, string> = { SAFE: 'green', WARNING: 'orange', DANGER: 'red' };
  return map[risk || ''] || 'default';
}

function getStatusColor(status?: string) {
  const map: Record<string, string> = {
    PENDING: 'default', RUNNING: 'processing',
    SUCCESS: 'success', FAILED: 'error', ROLLED_BACK: 'warning',
  };
  return map[status || ''] || 'default';
}

function getResultColor(status?: string) {
  const map: Record<string, string> = {
    SUCCESS: 'success', FAILED: 'error', SKIPPED: 'warning', PENDING: 'default',
  };
  return map[status || ''] || 'default';
}

function getSqlTypeLabel(type?: string) {
  const map: Record<string, string> = {
    CREATE_TABLE: '建表',
    ALTER_ADD: '新增字段',
    ALTER_MODIFY: '修改字段',
    ALTER_DROP: '删除字段',
    CREATE_INDEX: '创建索引',
    DROP_INDEX: '删除索引',
  };
  return map[type || ''] || type || '';
}

onMounted(() => {
  loadTableList();
  loadHistory();
});

watch(activeTab, (val) => {
  if (val === 'history') {
    loadHistory();
  }
});
</script>

<style scoped>
.publish-tabs {
  margin-top: -8px;
}

.plan-card {
  margin-top: 0;
}

.publish-steps {
  margin-bottom: 32px;
  padding: 0 40px;
}

.step-content {
  padding: 0 40px;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-select-area {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.force-option {
  margin-bottom: 16px;
}

.remark-area {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-bottom: 16px;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.sql-list-title {
  margin-bottom: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.sql-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.sql-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.sql-item.risk-safe {
  border-color: #b7eb8f;
  background: #f6ffed;
}

.sql-item.risk-warning {
  border-color: #ffe58f;
  background: #fffbe6;
}

.sql-item.risk-danger {
  border-color: #ffa39e;
  background: #fff1f0;
}

.sql-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sql-text {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  background: rgba(255,255,255,0.6);
  padding: 4px;
  border-radius: 4px;
}

.error-detail {
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  max-width: 600px;
  max-height: 200px;
  overflow-y: auto;
}

/* 历史 */
.history-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
</style>

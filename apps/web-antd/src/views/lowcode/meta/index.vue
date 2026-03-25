<template>
  <Page auto-content-height :title="$t('page.lowcode.meta.title')">
    <div class="meta-config-container">
      <Card>
        <Row :gutter="16" class="mb-4">
          <Col :span="12">
            <Space>
              <Button type="primary" @click="handleAdd">
                <IconifyIcon icon="mdi:plus" />
                {{ $t('page.lowcode.meta.addMeta') }}
              </Button>
              <Button @click="handleRefresh">
                <IconifyIcon icon="mdi:refresh" />
                {{ $t('page.common.refresh') }}
              </Button>
            </Space>
          </Col>
          <Col :span="12" class="text-right">
            <Space>
              <Input
                v-model:value="searchKeyword"
                :placeholder="$t('page.common.searchTableCodeOrName')"
                style="width: 200px"
                allow-clear
                @press-enter="handleSearch"
              >
                <template #prefix>
                  <IconifyIcon icon="mdi:magnify" />
                </template>
              </Input>
              <Button type="primary" @click="handleSearch">{{ $t('page.common.search') }}</Button>
            </Space>
          </Col>
        </Row>

        <Table
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'module'">
              <Tag :color="getModuleColor(record.module)">
                {{ getModuleLabel(record.module) }}
              </Tag>
            </template>
            <template v-if="column.key === 'isTreeTable'">
              <Tag :color="record.isTree ? 'green' : 'default'">
                {{ record.isTree ? $t('page.common.treeTable') : $t('page.common.normalTable') }}
              </Tag>
            </template>
            <template v-if="column.key === 'status'">
              <Tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? $t('page.common.enabled') : $t('page.common.disabled') }}
              </Tag>
            </template>
            <template v-if="column.key === 'action'">
              <Space>
                <Button size="small" type="link" @click="handleEdit(record)">
                  <IconifyIcon icon="mdi:pencil" />
                  {{ $t('page.common.edit') }}
                </Button>
                <Button size="small" type="link" @click="handleConfigColumns(record)">
                  <IconifyIcon icon="mdi:table-columns" />
                  {{ $t('page.common.configColumns') }}
                </Button>
                <Button size="small" type="link" @click="handleConfigOperations(record)">
                  <IconifyIcon icon="mdi:cursor-default-click" />
                  {{ $t('page.common.configOperations') }}
                </Button>
                <Button
                  size="small"
                  type="link"
                  danger
                  @click="handleDelete(record)"
                >
                  <IconifyIcon icon="mdi:delete" />
                  {{ $t('page.common.delete') }}
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <Modal
      v-model:open="formModalVisible"
      :title="isEditing ? $t('page.lowcode.meta.editMetaTitle') : $t('page.lowcode.meta.addMetaTitle')"
      width="800px"
      @ok="handleFormSubmit"
      @cancel="handleFormCancel"
    >
      <TableMetaForm v-model="formValue" />
    </Modal>

    <MetaFieldList
      v-model="fieldListVisible"
      :table-code="currentTableCode"
      @save="handleFieldListSave"
    />

    <OperationConfig
      v-model="operationModalVisible"
      :table-code="currentTableCode"
    />
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { TableProps } from 'ant-design-vue';
import TableMetaForm from './components/TableMetaForm.vue';
import MetaFieldList from './components/MetaFieldList.vue';
import OperationConfig from './components/OperationConfig.vue';
import type { TableMeta } from './types/meta';
import {
  getMetaList,
  addMeta,
  updateMeta,
  deleteMeta,
} from '#/api/lowcode/meta';

const loading = ref(false);
const searchKeyword = ref('');
const tableData = ref<TableMeta[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => $t('page.common.totalRecords', { total }),
});

const formModalVisible = ref(false);
const isEditing = ref(false);
const formValue = ref<Partial<TableMeta>>({});

const fieldListVisible = ref(false);
const currentTableCode = ref('');

const operationModalVisible = ref(false);

const columns = [
  { title: () => $t('page.common.colId'), dataIndex: 'id', key: 'id', width: 80 },
  { title: () => $t('page.common.colTableCode'), dataIndex: 'tableCode', key: 'tableCode', width: 150 },
  { title: () => $t('page.common.colTableName'), dataIndex: 'tableName', key: 'tableName', width: 150 },
  { title: () => $t('page.common.colModule'), dataIndex: 'module', key: 'module', width: 100 },
  { title: () => $t('page.common.colEntityClass'), dataIndex: 'entityClass', key: 'entityClass', width: 200, ellipsis: true },
  { title: () => $t('page.common.colServiceClass'), dataIndex: 'serviceClass', key: 'serviceClass', width: 200, ellipsis: true },
  { title: () => $t('page.common.colPermissionCode'), dataIndex: 'permissionCode', key: 'permissionCode', width: 150, ellipsis: true },
  { title: () => $t('page.common.colPageSize'), dataIndex: 'pageSize', key: 'pageSize', width: 100 },
  { title: () => $t('page.common.colTableType'), dataIndex: 'isTreeTable', key: 'isTreeTable', width: 100 },
  { title: () => $t('page.common.colStatus'), dataIndex: 'status', key: 'status', width: 80 },
  { title: () => $t('page.common.colRemark'), dataIndex: 'remark', key: 'remark', width: 150, ellipsis: true },
  { title: () => $t('page.common.colAction'), key: 'action', width: 280, fixed: 'right' as const },
];

const getModuleColor = (module: string) => {
  const colorMap: Record<string, string> = { base: 'blue', wms: 'green', sys: 'orange' };
  return colorMap[module] || 'default';
};

const getModuleLabel = (module: string) => {
  const labelMap: Record<string, string> = {
    base: $t('page.common.moduleBase'),
    wms: $t('page.common.moduleWms'),
    sys: $t('page.common.moduleSys'),
  };
  return labelMap[module] || module;
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getMetaList({
      page: pagination.current,
      size: pagination.pageSize,
      keyword: searchKeyword.value,
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error) {
    console.error($t('page.common.loadMetaListFail'), error);
    message.error($t('page.common.loadMetaListFail'));
  } finally {
    loading.value = false;
  }
};

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadData();
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleRefresh = () => {
  searchKeyword.value = '';
  pagination.current = 1;
  loadData();
};

const handleAdd = () => {
  isEditing.value = false;
  formValue.value = {
    tableCode: '',
    tableName: '',
    module: 'base',
    entityClass: '',
    serviceClass: '',
    permissionCode: '',
    pageSize: 20,
    isTree: false,
    status: 1,
    remark: '',
  };
  formModalVisible.value = true;
};

const handleEdit = (record: TableMeta) => {
  isEditing.value = true;
  formValue.value = { ...record };
  formModalVisible.value = true;
};

const handleFormSubmit = async () => {
  if (!formValue.value.tableCode || !formValue.value.tableName) {
    message.warning($t('page.common.requiredFieldsHint'));
    return;
  }

  try {
    if (isEditing.value) {
      await updateMeta(formValue.value);
      message.success($t('page.common.updateSuccess'));
    } else {
      await addMeta(formValue.value);
      message.success($t('page.common.addSuccess'));
    }
    formModalVisible.value = false;
    loadData();
  } catch (error) {
    console.error($t('page.common.saveFail'), error);
    message.error($t('page.common.saveFail'));
  }
};

const handleFormCancel = () => {
  formModalVisible.value = false;
};

const handleConfigColumns = (record: TableMeta) => {
  currentTableCode.value = record.tableCode;
  fieldListVisible.value = true;
};

const handleFieldListSave = (fields: any[]) => {
  console.log($t('page.lowcode.meta.fieldListSaved'), fields);
  message.success($t('page.lowcode.meta.fieldListSaved'));
};

const handleConfigOperations = (record: TableMeta) => {
  currentTableCode.value = record.tableCode;
  operationModalVisible.value = true;
};

const handleDelete = (record: TableMeta) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.lowcode.meta.deleteConfirm', { code: record.tableCode }),
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteMeta(record.id!);
        message.success($t('page.common.deleteSuccess'));
        loadData();
      } catch (error) {
        console.error($t('page.common.deleteFail'), error);
        message.error($t('page.common.deleteFail'));
      }
    },
  });
};

// 初始化加载
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="less">
.meta-config-container {
  padding: 16px;
}

.text-right {
  text-align: right;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>

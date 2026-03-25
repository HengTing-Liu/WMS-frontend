<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd">
          {{ $t('page.common.add') }}
        </Button>
        <Button class="ml-2" @click="handleBack">
          {{ $t('page.common.backToDictType') }}
        </Button>
      </template>
      
      <template #status="{ row }">
        <Switch
          :checked="row.status"
          :checkedValue="'0'"
          :unCheckedValue="'1'"
          @change="() => handleStatusChange(row)"
        />
      </template>
      
      <template #action="{ row }">
        <Button type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
        <Button type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
      </template>
    </Grid>
    
    <DictDataModal ref="modalRef" :dict-type="dictType" @success="handleReload" />
  </Page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { message, Button, Switch, Modal } from 'ant-design-vue';
import { $t } from '@vben/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDictDataList, deleteDictData, changeDictDataStatus } from '#/api';
import DictDataModal from './modules/dict-data-modal.vue';

const route = useRoute();
const router = useRouter();
const modalRef = ref();

// 直接从 route.params 获取，确保及时可用
const dictType = computed(() => route.params.dictType as string);

const gridOptions = {
  columns: [
    { type: 'seq' as const, width: 60, title: () => $t('page.common.colSeq') },
    { field: 'dictCode', title: () => $t('page.common.dictCode'), width: 100 },
    { field: 'dictLabel', title: () => $t('page.common.dictLabel'), minWidth: 150 },
    { field: 'dictValue', title: () => $t('page.common.dictValue'), minWidth: 150 },
    { field: 'dictSort', title: () => $t('page.system.dict.sortOrder'), width: 80 },
    { field: 'status', title: () => $t('page.common.status'), width: 100, slots: { default: 'status' } },
    { field: 'remark', title: () => $t('page.common.remark'), minWidth: 200 },
    { field: 'createTime', title: () => $t('page.common.createTime'), width: 160, formatter: 'formatDateTime' },
    { field: 'action', title: () => $t('page.common.operation'), fixed: 'right' as const, slots: { default: 'action' }, width: 150 },
  ],
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    response: {
      total: 'total',
      result: 'rows',
    },
    ajax: {
      query: async ({ page }: any) => {
        console.log('>>> DictData query, dictType:', dictType.value, 'page:', page);
        const res = await getDictDataList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          dictType: dictType.value,
        });
        console.log('>>> DictData query result:', res);
        return res;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const handleAdd = () => modalRef.value?.open();
const handleEdit = (row: any) => modalRef.value?.open(row);
const handleReload = () => gridApi.reload();
const handleBack = () => router.push('/system/dict');

const handleDelete = async (row: any) => {
  await deleteDictData(String(row.dictCode));
  message.success($t('page.message.deleteSuccess'));
  gridApi.reload();
};

const handleStatusChange = async (row: any) => {
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.sysTip'),
    content: nextStatus === '1' ? $t('page.system.dict.confirmDisableData') : $t('page.system.dict.confirmEnableData'),
    okText: $t('page.common.confirm'),
    cancelText: $t('page.common.cancel'),
    async onOk() {
      try {
        await changeDictDataStatus({ dictCode: row.dictCode, status: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
      }
    },
  });
};
</script>

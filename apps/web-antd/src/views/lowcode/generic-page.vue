<template>
  <LowcodePage
    :table-code="tableCode"
    :page-type="pageType"
    :page-title="pageTitle"
    :page-desc="pageDesc"
    :crud-prefix="crudPrefix"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LowcodePage from '#/lowcode/LowcodePage.vue';

const route = useRoute();

/** 从 URL query 读取 tableCode，未配置时尝试从 meta 取 */
const tableCode = computed(() => {
  const fromQuery = route.query.tableCode as string | undefined;
  const fromMeta = route.meta.tableCode as string | undefined;
  return fromQuery || fromMeta || '';
});

/** 从 URL query 读取 pageType，未配置时默认 default */
const pageType = computed(() => {
  const fromQuery = (route.query.pageType ?? route.query.pagetype) as string | undefined;
  const fromMeta = route.meta.pageType as string | undefined;
  return fromQuery || fromMeta || 'default';
});

/** 页面标题优先从路由 meta.title 取 */
const pageTitle = computed(() => (route.meta.title as string) || '');

/** 页面描述 */
const pageDesc = computed(() => (route.meta.description as string) || '');

/** 根据 tableCode 自动生成 CRUD 前缀 */
const crudPrefix = computed(() => {
  const code = tableCode.value;
  return code ? `/api/wms/crud/${code}` : '';
});
</script>

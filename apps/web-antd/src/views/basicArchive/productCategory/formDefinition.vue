<template>
  <DynamicFormDefinitionPage
    :fetch-definition="fetchDefinition"
    :params="pageParams"
    :on-cancel="onCancel"
    :on-save="onSave"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import DynamicFormDefinitionPage from '#/components/DynamicFormDefinitionPage.vue';
import {
  getProductCatalogFormDefinition,
  saveProductCatalog,
  updateProductCatalog,
} from '#/api';
import { buildProductCatalogAddPayload } from './utils/buildProductCatalogPayload';
const router = useRouter();
const route = useRoute();
const pageParams = computed(() => ({
  categoryName: '免疫',
  lang: 'zh_cn',
  ...(route.query.id ? { id: route.query.id } : {}),
}));
async function fetchDefinition(params: Record<string, any>) {
  return await getProductCatalogFormDefinition(params);
}
function onCancel() {
  router.back();
}
async function onSave(model: Record<string, any>) {
  const payload = buildProductCatalogAddPayload(model, {
    defaultSourceLang: pageParams.value.lang as string,
  });
  const catalogId = pageParams.value.id;
  try {
    let res: any;
    if (catalogId != null && String(catalogId) !== '') {
      const idNum = Number(catalogId);
      res = await updateProductCatalog({
        id: Number.isFinite(idNum) ? idNum : catalogId,
        ...payload,
      });
    } else {
      res = await saveProductCatalog(payload);
    }

    // 部分接口设置 responseReturn='body'，所以 { code, msg } 不会触发异常，需要手动判断
    if (res && typeof res === 'object' && 'code' in res && res.code !== 200) {
      message.error(res?.msg ?? '操作失败');
      return;
    }

    message.success('保存成功');
    router.back();
  } catch (e: any) {
    message.error(e?.response?.data?.msg ?? e?.data?.msg ?? e?.message ?? '保存失败');
  }
}
</script>

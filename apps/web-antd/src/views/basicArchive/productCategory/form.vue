<template>
  <div class="p-5 bg-white product-category-form-page">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-lg font-semibold">
        {{ pageTitle }}
      </div>
      <Button class="btn-close" @click="handleClose">
        <IconifyIcon icon="ant-design:close-outlined" class="mr-1" />
        关闭
      </Button>
    </div>

    <DynamicFormDefinitionPage
      :key="pageKey"
      :fetch-definition="catalogFetchDefinition"
      :params="formParams"
      :on-cancel="handleClose"
      :on-save="onProductFormSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import DynamicFormDefinitionPage from '#/components/DynamicFormDefinitionPage.vue';
import {
  getProductCatalogFormDefinition,
  saveProductCatalog,
  updateProductCatalog,
} from '#/api';
import { buildProductCatalogAddPayload } from './utils/buildProductCatalogPayload';

const route = useRoute();
const router = useRouter();

const id = computed(() => {
  const v = route.params.id;
  if (v == null) return '';
  return String(v);
});

const lang = computed(() => {
  const q = route.query.lang;
  return typeof q === 'string' && q ? q : 'zh_cn';
});

const categoryName = computed(() => {
  const q = route.query.categoryName;
  return typeof q === 'string' && q ? q : '免疫';
});

const pageTitle = computed(() => (id.value ? '编辑产品目录' : '新增产品目录'));

const pageKey = ref(0);
const formParams = computed(() => ({
  lang: lang.value,
  categoryName: categoryName.value,
  ...(id.value ? { id: id.value } : {}),
}));

async function catalogFetchDefinition(params: Record<string, any>) {
  return getProductCatalogFormDefinition(params);
}

function handleClose() {
  router.back();
}

async function onProductFormSave(model: Record<string, any>) {
  const payload = buildProductCatalogAddPayload(model, {
    defaultSourceLang: lang.value || 'zh_cn',
  });
  try {
    let res: any;
    if (id.value) {
      const idNum = Number(id.value);
      res = await updateProductCatalog({
        id: Number.isFinite(idNum) ? idNum : id.value,
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
    // 返回列表页并触发刷新
    router.back();
  } catch (e: any) {
    message.error(e?.response?.data?.msg ?? e?.data?.msg ?? e?.message ?? '保存失败');
  }
}
</script>

<style scoped>
.btn-close.ant-btn {
  background-color: #faad14;
  border-color: #faad14;
  color: #fff;
}
.btn-close.ant-btn:hover {
  background-color: #ffc53d;
  border-color: #ffc53d;
  color: #fff;
}
</style>


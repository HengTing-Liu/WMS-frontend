<template>
  <div class="p-5 bg-white">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-base font-medium">数据权限</div>
      <Button @click="router.back()">返回</Button>
    </div>

    <div class="rounded border border-gray-100 p-4">
      <div class="text-sm text-gray-600 mb-2">当前角色</div>
      <div class="text-sm">
        <span class="text-gray-700">roleId：</span>
        <span class="font-medium">{{ roleId }}</span>
      </div>
    </div>

    <div class="mt-4 text-sm text-gray-500">
      这里后续可实现：数据范围选择（data_scope）以及按部门树配置自定义权限等。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();

const roleId = computed(() => String(route.params.roleId ?? ''));
</script>

<style scoped></style>


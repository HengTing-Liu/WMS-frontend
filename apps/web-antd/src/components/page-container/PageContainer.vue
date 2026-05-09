<template>
  <Page auto-content-height>
    <!-- 页面头部：标题 + 操作按钮区 -->
    <div v-if="title || $slots.header" class="page-container-header">
      <div class="page-container-title">
        <slot name="header">
          <h2 v-if="title">{{ title }}</h2>
          <Breadcrumb v-if="breadcrumbs && breadcrumbs.length > 0">
            <BreadcrumbItem v-for="(item, index) in breadcrumbs" :key="index">
              <router-link v-if="item.path" :to="item.path">
                {{ item.title }}
              </router-link>
              <span v-else>{{ item.title }}</span>
            </BreadcrumbItem>
          </Breadcrumb>
        </slot>
      </div>
      <div v-if="$slots.actions" class="page-container-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 筛选区 -->
    <div v-if="$slots.filter" class="page-container-filter">
      <slot name="filter"></slot>
    </div>

    <!-- 内容区 -->
    <div class="page-container-content">
      <slot></slot>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { Breadcrumb, BreadcrumbItem } from 'ant-design-vue';

interface BreadcrumbRoute {
  title: string;
  path?: string;
}

withDefaults(
  defineProps<{
    /** 页面标题 */
    title?: string;
    /** 面包屑导航 */
    breadcrumbs?: BreadcrumbRoute[];
  }>(),
  {
    title: '',
    breadcrumbs: () => [],
  }
);
</script>

<style scoped>
.page-container-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
}

.page-container-title {
  flex: 1;
}

.page-container-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.page-container-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.page-container-filter {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
}

.page-container-content {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
</style>

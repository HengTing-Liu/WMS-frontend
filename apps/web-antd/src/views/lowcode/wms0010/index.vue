<!--
  LowcodeWms0010 - 仓库档案（WMS0010）低代码示例页

  本页展示了如何使用 LowcodePage 组件快速搭建档案页面。
  所有字段、按钮配置均来自后端 meta，页面代码零定制。

  对比原有 base/warehouse/index.vue：
  - 原有：~550 行手写代码，字段/按钮写死在代码里
  - 现在：~100 行配置代码，字段/按钮由后端 meta 驱动

  新增/修改档案页面时，只需：
  1. 后端 sys_table_meta + sys_column_meta 配置数据
  2. 前端创建新页面，引用 LowcodePage 即可
-->
<template>
  <LowcodePage
    table-code="WMS0010"
    page-title="WMS0010 仓库档案"
    page-desc="管理仓库基本信息、温区、质检分区等"
    crud-prefix="/api/base/warehouse"
    :show-stats="true"
    :stats-config="statsConfig"
  />
</template>

<script setup lang="ts">
import LowcodePage from '#/lowcode/LowcodePage.vue';
import type { StatsCardConfig } from '#/lowcode/types';

const statsConfig: StatsCardConfig[] = [
  {
    key: 'totalCount',
    label: '总仓库数',
    icon: 'material-symbols:warehouse',
    color: '#1677ff',
    field: 'totalCount',
  },
  {
    key: 'enabledCount',
    label: '已启用',
    icon: 'material-symbols:check-circle',
    color: '#52c41a',
    field: 'enabledCount',
  },
  {
    key: 'totalCapacity',
    label: '总容量',
    icon: 'material-symbols:inventory-2',
    color: '#722ed1',
    field: 'totalCapacity',
    format: (v) => (v ? `${v}㎡` : '0㎡'),
  },
  {
    key: 'avgUsageRate',
    label: '平均使用率',
    icon: 'material-symbols:trending-up',
    color: '#fa8c16',
    field: 'avgUsageRate',
    format: (v) => (v != null ? `${v}%` : '0%'),
  },
];
</script>
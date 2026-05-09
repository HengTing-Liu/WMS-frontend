<template>
  <Page auto-content-height>
    <component :is="Grid">
      <template v-for="(slotFn, name) in $slots" v-slot:[name]="slotProps">
        <slot v-if="slotFn" :name="name" v-bind="slotProps" />
      </template>
    </component>
  </Page>
</template>

<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface Props {
  formOptions: VbenFormProps;
  gridOptions: VxeTableGridOptions<any>;
  gridEvents?: Record<string, any>;
}

const props = defineProps<Props>();

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: props.formOptions,
  gridOptions: props.gridOptions,
  gridEvents: props.gridEvents,
});

defineExpose({
  gridApi,
});
</script>


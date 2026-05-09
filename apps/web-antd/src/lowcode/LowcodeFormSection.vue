<template>
  <div :id="sectionDomId" class="lowcode-form-section">
    <Collapse
      v-if="type === 'collapse'"
      :active-key="activeKeys"
      :bordered="false"
      class="lowcode-form-collapse"
      @change="handleCollapseChange"
    >
      <CollapsePanel :key="title">
        <template #header>
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-index">{{ displayIndex }}</span>
              <div>
                <div class="section-title">{{ title }}</div>
                <div class="section-subtitle">{{ fieldCount }} 个字段</div>
              </div>
            </div>
            <Tag color="blue">Collapse</Tag>
          </div>
        </template>
        <Form />
      </CollapsePanel>
    </Collapse>
    <Card v-else :bordered="false" class="lowcode-form-card">
      <template #title>
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-index">{{ displayIndex }}</span>
            <div>
              <div class="section-title">{{ title }}</div>
              <div class="section-subtitle">{{ fieldCount }} 个字段</div>
            </div>
          </div>
          <Tag>Card</Tag>
        </div>
      </template>
      <Form />
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { Key } from 'ant-design-vue/es/_util/type';
import { Card, Collapse, CollapsePanel, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

import type { VbenFormSchema } from '#/adapter/form';

const props = withDefaults(
  defineProps<{
    title: string;
    sectionKey?: string;
    index?: number;
    type?: 'card' | 'collapse';
    fieldCount?: number;
    defaultOpen?: boolean;
    disabled?: boolean;
    initialValues?: Record<string, any>;
    schema: VbenFormSchema[];
  }>(),
  {
    sectionKey: '',
    index: 1,
    type: 'card',
    fieldCount: 0,
    defaultOpen: true,
    disabled: false,
    initialValues: () => ({}),
  },
);

const activeKeys = ref<string[]>(props.defaultOpen ? [props.title] : []);
const isMounted = ref(true);

onBeforeUnmount(() => {
  isMounted.value = false;
});

const formOptions = reactive({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    disabled: props.disabled,
  },
  layout: 'horizontal',
  showDefaultActions: false,
  wrapperClass: 'grid-cols-12 gap-x-4',
  schema: props.schema,
}) as any;

const [Form, formApi] = useVbenForm(formOptions as any);
const displayIndex = computed(() => String(props.index).padStart(2, '0'));
const sectionDomId = computed(() => `lowcode-group-${props.sectionKey || props.title}`);

watch(
  () => props.schema,
  (schema) => {
    formOptions.schema = schema;
  },
  { deep: true, immediate: true },
);

watch(
  () => props.disabled,
  (disabled) => {
    formOptions.commonConfig = {
      ...(formOptions.commonConfig ?? {}),
      disabled,
    };
  },
  { immediate: true },
);

watch(
  () => props.defaultOpen,
  (defaultOpen) => {
    activeKeys.value = defaultOpen ? [props.title] : [];
  },
  { immediate: true },
);

watch(
  () => props.title,
  (title) => {
    if (props.defaultOpen) {
      activeKeys.value = [title];
    }
  },
);

watch(
  () => props.initialValues,
  async (values) => {
    await nextTick();
    if (!isMounted.value) return;
    formApi.resetForm?.();
    if (values && Object.keys(values).length > 0) {
      if (isMounted.value) {
        formApi.setValues(values);
      }
    }
  },
  { deep: true, immediate: true },
);

const isOpen = computed(() => activeKeys.value.includes(props.title));

function handleCollapseChange(keys: Key | Key[]) {
  if (Array.isArray(keys)) {
    activeKeys.value = keys.map((key) => String(key));
    return;
  }
  activeKeys.value = keys ? [String(keys)] : [];
}

async function validate() {
  return formApi.validate();
}

async function getValues() {
  return (await formApi.getValues?.()) ?? {};
}

async function setValues(values: Record<string, any>) {
  if (!isMounted.value) return;
  await nextTick();
  if (!isMounted.value) return;
  formApi.setValues(values);
}

async function updateSchema(schema: Partial<VbenFormSchema>[]) {
  if (!isMounted.value) return;
  await formApi.updateSchema?.(schema as VbenFormSchema[]);
}

function reset() {
  if (!isMounted.value) return;
  formApi.resetForm?.();
}

defineExpose({
  getValues,
  isOpen,
  reset,
  setValues,
  updateSchema,
  validate,
});
</script>

<style scoped>
.lowcode-form-section {
  scroll-margin-top: 24px;
}

.lowcode-form-card,
.lowcode-form-collapse {
  background: transparent;
}

.lowcode-form-card :deep(.ant-card-head),
.lowcode-form-collapse :deep(.ant-collapse-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.section-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.section-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.section-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.lowcode-form-collapse :deep(.ant-collapse-item) {
  border: 0;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
}

.lowcode-form-collapse :deep(.ant-collapse-header) {
  font-weight: 600;
  font-size: 16px;
  align-items: center;
  padding: 18px 20px;
}

.lowcode-form-collapse :deep(.ant-collapse-content) {
  border-top: 1px solid #e2e8f0;
}

.lowcode-form-collapse :deep(.ant-collapse-content-box),
.lowcode-form-card :deep(.ant-card-body) {
  padding-top: 12px;
}

.lowcode-form-card :deep(.ant-card) {
  border-radius: 16px;
}

.lowcode-form-card :deep(.ant-card-head) {
  min-height: 72px;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 16px 16px 0 0;
}

.lowcode-form-card :deep(.ant-card-body) {
  background: #ffffff;
  border-radius: 0 0 16px 16px;
}

@media (max-width: 768px) {
  .section-header {
    align-items: flex-start;
  }

  .section-title-wrap {
    gap: 10px;
  }

  .section-index {
    width: 30px;
    height: 30px;
  }
}
</style>

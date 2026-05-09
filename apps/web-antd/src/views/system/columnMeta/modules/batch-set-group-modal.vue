<template>
  <Modal
    v-model:open="visible"
    title="批量设置分组"
    :confirm-loading="loading"
    width="520px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem
        label="目标分组"
        name="groupCode"
        :rules="[{ required: true, message: '请选择分组', trigger: 'change' }]"
      >
        <Select
          v-model:value="formData.groupCode"
          placeholder="请选择分组"
          show-search
          option-filter-prop="label"
          :loading="groupLoading"
        >
          <SelectOption
            v-for="group in groupOptions"
            :key="group.groupCode"
            :value="group.groupCode"
            :label="`${group.groupCode} - ${group.groupTitle}`"
          >
            {{ group.groupCode }} - {{ group.groupTitle }}
          </SelectOption>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  Form,
  FormItem,
  Modal,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import { batchUpdateColumnSection } from '#/api/system/columnMeta';
import { getGroupMetaList, type GroupMetaApi } from '#/api/system/groupMeta';

const props = defineProps<{
  tableCode: string;
  selectedIds: number[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });
const loading = ref(false);
const groupLoading = ref(false);
const groupOptions = ref<GroupMetaApi.GroupMeta[]>([]);
const formRef = ref<FormInstance>();

const formData = reactive<{ groupCode: string }>({ groupCode: '' });

async function loadGroups() {
  if (!props.tableCode) return;
  groupLoading.value = true;
  try {
    const res = await getGroupMetaList(props.tableCode);
    groupOptions.value = (res.rows || [])
      .filter((item) => Number(item.status ?? 1) === 1)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  } catch {
    groupOptions.value = [];
  } finally {
    groupLoading.value = false;
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      formData.groupCode = '';
      formRef.value?.clearValidate();
      loadGroups();
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  await formRef.value?.validate();
  const group = groupOptions.value.find((g) => g.groupCode === formData.groupCode);
  if (!group) {
    message.warning('分组不存在');
    return;
  }
  if (props.selectedIds.length === 0) {
    message.warning('没有选中的字段');
    visible.value = false;
    return;
  }
  loading.value = true;
  try {
    await batchUpdateColumnSection({
      ids: props.selectedIds,
      sectionKey: group.groupCode,
      sectionTitle: group.groupTitle,
      sectionOrder: Number(group.sortOrder ?? 0),
      sectionType: group.groupType || 'card',
    });
    message.success('批量设置分组成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '批量设置分组失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}
</script>

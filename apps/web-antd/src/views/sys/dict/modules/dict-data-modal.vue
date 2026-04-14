<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Modal, Form, Input, Select, Switch, InputNumber, message } from 'ant-design-vue';
import { getDictDataDetail, createDictData, updateDictData } from '#/api/sys/dict';

const props = defineProps<{
  open: boolean;
  dictDataId?: number;
  dictTypeOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const formRef = ref();
const formState = ref({
  dictType: '',
  dictLabel: '',
  dictValue: '',
  sortOrder: 0,
  isEnabled: 1,
  remarks: '',
});

const isEdit = computed(() => !!props.dictDataId);
const title = computed(() => isEdit.value ? '编辑字典数据' : '新建字典数据');

const rules = {
  dictType: [{ required: true, message: '请选择所属类型', trigger: 'change' }],
  dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
};

function resetForm() {
  formState.value = { dictType: '', dictLabel: '', dictValue: '', sortOrder: 0, isEnabled: 1, remarks: '' };
  formRef.value?.resetFields();
}

watch(() => props.open, async (val) => {
  if (val) {
    if (props.dictDataId) {
      await loadDetail(props.dictDataId);
    } else {
      resetForm();
    }
  }
});

async function loadDetail(id: number) {
  loading.value = true;
  try {
    const data = await getDictDataDetail(id);
    formState.value = {
      dictType: data.dictType || '',
      dictLabel: data.dictLabel || '',
      dictValue: data.dictValue || '',
      sortOrder: data.sortOrder ?? 0,
      isEnabled: data.isEnabled ?? 1,
      remarks: data.remarks || '',
    };
  } catch (e: any) {
    message.error('加载详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    if (isEdit.value) {
      await updateDictData({ id: props.dictDataId, ...formState.value });
      message.success('更新成功');
    } else {
      await createDictData(formState.value);
      message.success('创建成功');
    }
    emit('update:open', false);
    emit('success');
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  emit('update:open', false);
}

defineExpose({ open: (id: number) => loadDetail(id) });
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    :confirm-loading="loading"
    width="520px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      class="dict-data-form"
    >
      <FormItem label="所属类型" name="dictType">
        <Select
          v-model:value="formState.dictType"
          placeholder="请选择所属字典类型"
          :options="dictTypeOptions"
          show-search
          :filter-option="(input: string, option: any) => option.label.toLowerCase().includes(input.toLowerCase())"
        />
      </FormItem>
      <FormItem label="字典标签" name="dictLabel">
        <Input v-model:value="formState.dictLabel" placeholder="如：男" />
      </FormItem>
      <FormItem label="字典值" name="dictValue">
        <Input v-model:value="formState.dictValue" placeholder="如：1" />
      </FormItem>
      <FormItem label="排序" name="sortOrder">
        <InputNumber v-model:value="formState.sortOrder" :min="0" :max="9999" style="width: 100%" />
      </FormItem>
      <FormItem label="状态" name="isEnabled">
        <Switch
          v-model:checked="formState.isEnabled"
          checked-children="启用"
          un-checked-children="停用"
          :checked-value="1"
          :unchecked-value="0"
        />
      </FormItem>
      <FormItem label="备注" name="remarks">
        <Input v-model:value="formState.remarks" placeholder="请输入备注" :rows="3" type="textarea" />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.dict-data-form {
  margin-top: 16px;
}
</style>

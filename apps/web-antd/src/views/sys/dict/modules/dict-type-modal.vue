<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Modal, Form, Input, Select, Switch, message } from 'ant-design-vue';
import { getDictTypeDetail, createDictType, updateDictType } from '#/api/sys/dict';

const props = defineProps<{
  open: boolean;
  dictTypeId?: number;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const formRef = ref();
const formState = ref({
  dictCode: '',
  dictName: '',
  dictType: 'custom',
  isEnabled: 1,
  remark: '',
});

const isEdit = computed(() => !!props.dictTypeId);
const title = computed(() => isEdit.value ? '编辑字典类型' : '新建字典类型');

const rules = {
  dictCode: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
};

function resetForm() {
  formState.value = { dictCode: '', dictName: '', dictType: 'custom', isEnabled: 1, remark: '' };
  formRef.value?.resetFields();
}

watch(() => props.open, async (val) => {
  if (val) {
    if (props.dictTypeId) {
      await loadDetail(props.dictTypeId);
    } else {
      resetForm();
    }
  }
});

async function loadDetail(id: number) {
  loading.value = true;
  try {
    const data = await getDictTypeDetail(id);
    formState.value = {
      dictCode: data.dictCode || '',
      dictName: data.dictName || '',
      dictType: data.dictType || 'custom',
      isEnabled: data.isEnabled ?? 1,
      remark: data.remark || '',
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
      await updateDictType({ id: props.dictTypeId, ...formState.value });
      message.success('更新成功');
    } else {
      await createDictType(formState.value);
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
      class="dict-type-form"
    >
      <FormItem label="字典编码" name="dictCode">
        <Input
          v-model:value="formState.dictCode"
          placeholder="如：sys_user_sex"
          :disabled="isEdit"
        />
      </FormItem>
      <FormItem label="字典名称" name="dictName">
        <Input v-model:value="formState.dictName" placeholder="如：用户性别" />
      </FormItem>
      <FormItem label="类型" name="dictType">
        <Select v-model:value="formState.dictType" :options="[
          { label: '系统字典', value: 'system' },
          { label: '自定义', value: 'custom' },
        ]" />
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
      <FormItem label="备注" name="remark">
        <Input v-model:value="formState.remark" placeholder="请输入备注" :rows="3" type="textarea" />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.dict-type-form {
  margin-top: 16px;
}
</style>

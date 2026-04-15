<template>
  <Modal
    :title="isEdit ? $t('page.common.edit') : $t('page.common.add')"
    :open="visible"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
    width="600px"
  >
    <Form :model="form" :rules="rules" ref="formRef" layout="vertical">
      <FormItem :label="$t('page.system.dict.dictType')" name="dictType">
        <Input v-model:value="form.dictType" disabled />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.common.dictLabel')" name="dictLabel">
            <Input v-model:value="form.dictLabel" :placeholder="$t('page.system.dict.inputDictLabel')" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.common.dictValue')" name="dictValue">
            <Input v-model:value="form.dictValue" :placeholder="$t('page.system.dict.inputDictValue')" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.dict.showSort')" name="dictSort">
            <InputNumber v-model:value="form.dictSort" :min="0" style="width: 100%" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.dict.languageType')" name="languageType">
            <Select v-model:value="form.languageType" style="width: 100%">
              <SelectOption value="zh_CN">简体中文</SelectOption>
              <SelectOption value="en_US">English</SelectOption>
              <SelectOption value="zh_TW">繁体中文</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.common.status')" name="status">
            <RadioGroup v-model:value="form.status">
              <Radio value="0">{{ $t('page.common.enabled') }}</Radio>
              <Radio value="1">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
      </Row>

      <FormItem :label="$t('page.common.remark')" name="remark">
        <Textarea v-model:value="form.remark" :rows="3" :placeholder="$t('page.common.pleaseInput')" />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Modal, Form, FormItem, Input, InputNumber, RadioGroup, Radio, Textarea, Row, Col, Select, SelectOption, message } from 'ant-design-vue';
import { addDictData, editDictData } from '#/api';

const props = defineProps<{
  dictType: string;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();

const form = reactive({
  dictCode: undefined as number | undefined,
  dictType: '',
  dictLabel: '',
  dictValue: '',
  dictSort: 0,
  status: '0',
  languageType: 'zh_CN',
  remark: '',
});

const rules = {
  dictLabel: [{ required: true, message: () => $t('page.system.dict.inputDictLabel'), trigger: 'blur' }],
  dictValue: [{ required: true, message: () => $t('page.system.dict.inputDictValue'), trigger: 'blur' }],
  dictSort: [{ required: true, message: () => $t('page.system.dict.inputSort'), trigger: 'blur', type: 'number' as const }],
};

watch(() => props.dictType, (val) => {
  form.dictType = val;
}, { immediate: true });

const open = (row?: any) => {
  visible.value = true;
  if (row) {
    isEdit.value = true;
    Object.assign(form, row);
    // 确保语言类型有默认值
    if (!form.languageType) {
      form.languageType = 'zh_CN';
    }
  } else {
    isEdit.value = false;
    resetForm();
  }
};

const resetForm = () => {
  form.dictCode = undefined;
  form.dictLabel = '';
  form.dictValue = '';
  form.dictSort = 0;
  form.status = '0';
  form.languageType = 'zh_CN';
  form.remark = '';
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value) {
      await editDictData(form);
      message.success($t('page.message.editSuccess'));
    } else {
      await addDictData(form);
      message.success($t('page.message.addSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({
  open,
});
</script>

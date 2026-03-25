<template>
  <Modal
    :title="isEdit ? $t('page.system.serial.editTitle') : $t('page.system.serial.addTitle')"
    v-model:open="visible"
    @ok="handleSubmit"
    :confirm-loading="loading"
    width="700px"
  >
    <Form :model="formData" :rules="rules" ref="formRef" layout="vertical">
      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.ruleCode')" name="ruleCode">
            <Input v-model:value="formData.ruleCode" :disabled="isEdit" :placeholder="$t('page.system.serial.ruleCodePlaceholder')" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.ruleName')" name="ruleName">
            <Input v-model:value="formData.ruleName" :placeholder="$t('page.system.serial.ruleNamePlaceholder')" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.prefix')">
            <Input v-model:value="formData.prefix" :placeholder="$t('page.system.serial.prefixPlaceholder')" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.dateFormat')">
            <Select v-model:value="formData.dateFormat" :placeholder="$t('page.system.serial.selectDateFormat')">
              <SelectOption value="">{{ $t('page.system.serial.noDate') }}</SelectOption>
              <SelectOption value="yyyy">{{ $t('page.system.serial.year') }} (yyyy)</SelectOption>
              <SelectOption value="yyyyMM">{{ $t('page.system.serial.yearMonth') }} (yyyyMM)</SelectOption>
              <SelectOption value="yyyyMMdd">{{ $t('page.system.serial.yearMonthDay') }} (yyyyMMdd)</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.seqLength')" name="seqLength">
            <InputNumber v-model:value="formData.seqLength" :min="1" :max="10" style="width: 100%" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.suffix')">
            <Input v-model:value="formData.suffix" :placeholder="$t('page.system.serial.suffixPlaceholder')" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.startSeq')">
            <InputNumber v-model:value="formData.maxSeq" :min="0" style="width: 100%" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.currentSeq')">
            <InputNumber v-model:value="formData.currentSeq" :disabled="true" style="width: 100%" />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.system.serial.resetType')">
            <Select v-model:value="formData.resetType" :placeholder="$t('page.system.serial.selectResetType')">
              <SelectOption value="NEVER">{{ $t('page.system.serial.never') }}</SelectOption>
              <SelectOption value="DAY">{{ $t('page.system.serial.everyDay') }}</SelectOption>
              <SelectOption value="MONTH">{{ $t('page.system.serial.everyMonth') }}</SelectOption>
              <SelectOption value="YEAR">{{ $t('page.system.serial.everyYear') }}</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.common.status')">
            <RadioGroup v-model:value="formData.status">
              <Radio value="0">{{ $t('page.common.enabled') }}</Radio>
              <Radio value="1">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
      </Row>

      <FormItem :label="$t('page.system.serial.description')">
        <Textarea v-model:value="formData.description" :rows="2" />
      </FormItem>

      <!-- 预览 -->
      <div class="preview-section">
        <Divider orientation="left">{{ $t('page.system.serial.preview') }}</Divider>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-label">{{ $t('page.system.serial.example') }}:</span>
            <span class="preview-value font-mono">{{ previewSerialNo }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">{{ $t('page.system.serial.format') }}:</span>
            <span class="preview-value">{{ formatDescription }}</span>
          </div>
        </div>
      </div>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Modal, Form, FormItem, Input, InputNumber, Select, SelectOption,
  RadioGroup, Radio, Textarea, Row, Col, Divider, message
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { addSerialNumber, editSerialNumber } from '#/api';

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();

const formData = reactive({
  id: undefined as number | undefined,
  ruleCode: '',
  ruleName: '',
  prefix: '',
  dateFormat: '',
  seqLength: 3,
  currentSeq: 0,
  maxSeq: 999999,
  suffix: '',
  resetType: 'NEVER',
  status: '0',
  description: '',
});

const rules = {
  ruleName: [{ required: true, message: $t('page.system.serial.ruleNameRequired'), trigger: 'blur' }],
  seqLength: [{ required: true, message: $t('page.system.serial.seqLengthRequired'), trigger: 'blur', type: 'number' as const }],
};

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 预览流水号
const previewSerialNo = computed(() => {
  const dateStr = formData.dateFormat
    ? new Date().toISOString().slice(0, formData.dateFormat.length).replace(/-/g, '')
    : '';
  const seqStr = String(formData.currentSeq || 0).padStart(formData.seqLength || 3, '0');
  return `${formData.prefix || ''}${dateStr}${seqStr}${formData.suffix || ''}`;
});

// 格式说明
const formatDescription = computed(() => {
  const parts = [];
  if (formData.prefix) parts.push($t('page.system.serial.prefixDesc'));
  if (formData.dateFormat) parts.push($t('page.system.serial.dateDesc'));
  parts.push($t('page.system.serial.formatDesc', { length: formData.seqLength }));
  if (formData.suffix) parts.push($t('page.system.serial.suffix'));
  return parts.join(' + ');
});

const open = (row?: any) => {
  visible.value = true;
  isEdit.value = !!row;

  if (row) {
    Object.assign(formData, row);
  } else {
    Object.assign(formData, {
      id: undefined,
      ruleCode: '',
      ruleName: '',
      prefix: '',
      dateFormat: '',
      seqLength: 3,
      currentSeq: 0,
      maxSeq: 999999,
      suffix: '',
      resetType: 'NEVER',
      status: '0',
      description: '',
    });
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value) {
      await editSerialNumber(formData);
      message.success($t('page.message.editSuccess'));
    } else {
      await addSerialNumber(formData);
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

defineExpose({ open });
</script>

<style scoped>
.preview-section {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  color: #666;
  font-size: 14px;
}

.preview-value {
  font-size: 16px;
  font-weight: 500;
  color: #1890ff;
}

.font-mono {
  font-family: 'Courier New', monospace;
}
</style>

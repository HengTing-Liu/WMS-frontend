<template>
  <Modal
    :title="$t('page.system.serial.generateTitle')"
    v-model:open="visible"
    width="600px"
    :footer="null"
  >
    <Form :model="formData" layout="vertical">
      <FormItem :label="$t('page.system.serial.rule')" required>
        <Select v-model:value="formData.ruleName" @change="handleRuleChange">
          <SelectOption v-for="rule in ruleList" :key="rule.ruleCode" :value="rule.ruleName">
            {{ rule.ruleName }} {{ rule.prefix ? `(${rule.prefix})` : '' }}
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem :label="$t('page.system.serial.businessNo')">
        <Input v-model:value="formData.businessNo" :placeholder="$t('page.system.serial.businessNoPlaceholder')" />
      </FormItem>

      <FormItem :label="$t('page.system.serial.businessType')">
        <Input v-model:value="formData.businessType" :placeholder="$t('page.system.serial.businessTypePlaceholder')" />
      </FormItem>

      <FormItem :label="$t('page.system.serial.generateCount')">
        <InputNumber v-model:value="formData.count" :min="1" :max="100" style="width: 100%" />
      </FormItem>

      <div class="flex justify-center gap-4 mt-4">
        <Button type="primary" size="large" @click="handleGenerate" :loading="loading">
          <IconifyIcon icon="mdi:lightning-bolt" />
          {{ $t('page.system.serial.generate') }}
        </Button>
      </div>
    </Form>

    <!-- 生成结果 -->
    <div v-if="results.length > 0" class="result-section">
      <Divider />

      <div class="flex justify-between items-center mb-4">
        <span class="font-medium">{{ $t('page.system.serial.generateResult') }}</span>
        <Button type="link" @click="handleCopyAll">
          <IconifyIcon icon="mdi:content-copy" />
          {{ $t('page.system.serial.copyAll') }}
        </Button>
      </div>

      <div class="result-list">
        <div v-for="(item, index) in results" :key="index" class="result-item">
          <div class="result-no">{{ item.serialNo }}</div>
          <Button type="link" size="small" @click="handleCopy(item.serialNo)">
            {{ $t('page.common.copy') }}
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Form, FormItem, Select, SelectOption, Input, InputNumber, Button, Divider, Modal, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { getSerialNumberList, generateSerialNumber, batchGenerateSerialNumber } from '#/api';

const visible = ref(false);
const loading = ref(false);
const ruleList = ref<any[]>([]);
const results = ref<any[]>([]);

const formData = reactive({
  ruleCode: '',
  ruleName: '',
  businessNo: '',
  businessType: '',
  count: 1,
});

// 加载规则列表
const loadRules = async () => {
  try {
    const res = await getSerialNumberList({ pageSize: 999, status: '0' });
    ruleList.value = res.rows || [];
  } catch (error) {
    console.error($t('page.common.loadRuleFail'), error);
  }
};

const handleRuleChange = () => {
  results.value = [];
};

const open = () => {
  visible.value = true;
  results.value = [];
  Object.assign(formData, {
    ruleCode: '',
    ruleName: '',
    businessNo: '',
    businessType: '',
    count: 1,
  });
  loadRules();
};

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const handleGenerate = async () => {
  if (!formData.ruleName) {
    message.warning($t('page.system.serial.pleaseSelectRule'));
    return;
  }

  loading.value = true;
  try {
    if (formData.count === 1) {
      const res = await generateSerialNumber(
        formData.ruleName,
        formData.businessNo,
        formData.businessType
      );
      results.value = [res];
    } else {
      const res = await batchGenerateSerialNumber(formData.ruleName, formData.count);
      results.value = res;
    }
    message.success($t('page.system.serial.generateSuccess'));
    emit('success');
  } catch (error) {
    message.error($t('page.system.serial.generateFail'));
  } finally {
    loading.value = false;
  }
};

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success($t('page.system.serial.copySuccess'));
  });
};

const handleCopyAll = () => {
  const text = results.value.map((r) => r.serialNo).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    message.success($t('page.system.serial.copyAllSuccess'));
  });
};

defineExpose({ open });
</script>

<style scoped>
.result-section {
  margin-top: 16px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.result-no {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
  letter-spacing: 1px;
}
</style>

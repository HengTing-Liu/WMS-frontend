<template>
  <Page auto-content-height>
    <div class="wms-warehouse-edit-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <Button @click="handleBack" class="back-btn">
            <template #icon><ArrowLeft /></template>
          </Button>
          <div class="header-titles">
            <h1 class="page-title">{{ isEdit ? '缂栬緫浠撳簱妗ｆ' : '鏂板缓浠撳簱妗ｆ' }}</h1>
            <p class="page-subtitle">
              {{ isEdit ? `缂栬緫浠撳簱缂栧彿: ${formData.warehouseCode}` : '濉啓浠撳簱鍩烘湰淇℃伅鍜屾敹璐т汉淇℃伅' }}
            </p>
          </div>
        </div>
        <div class="header-right">
          <Button @click="handleBack">鍙栨秷</Button>
          <Button type="primary" :loading="submitting" @click="handleSubmit">
            <template #icon><Save /></template>
            淇濆瓨
          </Button>
        </div>
      </div>

      <!-- 浠撳簱鍩烘湰淇℃伅 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="section-header">
          <Building2 class="section-icon" />
          <span class="section-title">浠撳簱鍩烘湰淇℃伅</span>
        </div>

        <!-- 缂栬緫鎻愮ず妯箙 -->
        <Alert
          v-if="isEdit"
          type="warning"
          show-icon
          class="edit-warning-alert"
          message="缂栬緫鎻愮ず锛氫粨搴撶紪鐮併€佷粨搴撳悕绉般€佹俯搴﹀垎鍖恒€佽川閲忓垎鍖恒€佹墍灞炲叕鍙搞€佸娉?涓虹郴缁熶繚鎶ゅ瓧娈碉紝鍒涘缓鍚庝笉鍙慨鏀广€傚彲淇敼瀛楁锛氳矗浠讳汉宸ュ彿銆佽矗浠讳汉銆佽矗浠婚儴闂ㄧ紪鍙枫€佽矗浠婚儴闂ㄥ叏璺緞銆佹槸鍚﹀惎鐢ㄣ€?
        />

        <Form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
          class="warehouse-form"
        >
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="浠撳簱缂栫爜" name="warehouseCode">
                <Input
                  v-model:value="formData.warehouseCode"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  maxlength="50"
                  placeholder="璇疯緭鍏ヤ粨搴撶紪鐮?
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="浠撳簱鍚嶇О" name="warehouseName">
                <Input
                  v-model:value="formData.warehouseName"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  maxlength="100"
                  placeholder="璇疯緭鍏ヤ粨搴撳悕绉?
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="娓╁害鍒嗗尯" name="temperatureZone">
                <Select
                  v-model:value="formData.temperatureZone"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :options="temperatureZoneOptions"
                  placeholder="璇烽€夋嫨娓╁害鍒嗗尯"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="璐ㄩ噺鍒嗗尯" name="qualityZone">
                <Select
                  v-model:value="formData.qualityZone"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :options="qualityZoneOptions"
                  placeholder="璇烽€夋嫨璐ㄩ噺鍒嗗尯"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="璐ｄ换浜哄伐鍙? name="employeeCode">
                <Input v-model:value="formData.employeeCode" maxlength="50" placeholder="璇疯緭鍏ヨ矗浠讳汉宸ュ彿" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="璐ｄ换浜? name="employeeName">
                <Input v-model:value="formData.employeeName" maxlength="100" placeholder="璇疯緭鍏ヨ矗浠讳汉" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="璐ｄ换閮ㄩ棬缂栧彿" name="deptCode">
                <Input v-model:value="formData.deptCode" maxlength="50" placeholder="璇疯緭鍏ヨ矗浠婚儴闂ㄧ紪鍙? />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="璐ｄ换閮ㄩ棬鍏ㄨ矾寰? name="deptNameFullPath">
                <Input v-model:value="formData.deptNameFullPath" maxlength="200" placeholder="璇疯緭鍏ヨ矗浠婚儴闂ㄥ叏璺緞" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="鎵€灞炲叕鍙? name="company">
                <Select
                  v-model:value="formData.company"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :options="companyOptions"
                  placeholder="璇烽€夋嫨鎵€灞炲叕鍙?
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="鏄惁鍚敤" name="isEnabled">
                <RadioGroup v-model:value="formData.isEnabled">
                  <Radio :value="1">鍚敤</Radio>
                  <Radio :value="0">鍋滅敤</Radio>
                </RadioGroup>
              </FormItem>
            </Col>
            <Col :span="24">
              <FormItem label="澶囨敞" name="remark" :label-col="{ span: 2 }" :wrapper-col="{ span: 22 }">
                <Input.TextArea
                  v-model:value="formData.remark"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :rows="3"
                  maxlength="500"
                  show-count
                  placeholder="璇疯緭鍏ュ娉?
                />
              </FormItem>
            </Col>
          </Row>
        </Form>

        <!-- 绯荤粺淇℃伅 -->
        <div v-if="isEdit" class="system-info">
          <div class="system-info-row">
            <span class="system-info-label">娣诲姞浜猴細</span>
            <span class="system-info-value">{{ formData.createBy || '-' }}</span>
            <span class="system-info-label ml-6">娣诲姞鏃堕棿锛?/span>
            <span class="system-info-value">{{ formData.createTime || '-' }}</span>
            <span class="system-info-label ml-6">涓婃淇敼浜猴細</span>
            <span class="system-info-value">{{ formData.updateBy || '-' }}</span>
            <span class="system-info-label ml-6">涓婃淇敼鏃堕棿锛?/span>
            <span class="system-info-value">{{ formData.updateTime || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 鏀惰揣浜轰俊鎭?-->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="section-header">
          <User class="section-icon" />
          <span class="section-title">鏀惰揣浜轰俊鎭?/span>
        </div>

        <div v-if="receiverList.length === 0" class="receiver-empty">
          <User class="receiver-empty-icon" />
          <p>鏆傛棤鏀惰揣浜轰俊鎭?/p>
          <p class="receiver-empty-hint">鐐瑰嚮"娣诲姞鏀惰揣浜?鎸夐挳寮€濮嬫坊鍔?/p>
        </div>

        <Table
          v-else
          row-key="id"
          :loading="receiverLoading"
          :columns="receiverColumns"
          :data-source="receiverList"
          :pagination="false"
          :scroll="{ x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'phoneNumber'">
              {{ maskPhone(record.phoneNumber) }}
            </template>
            <template v-else-if="column.key === 'address'">
              {{ record.country || '' }}{{ record.province || '' }}{{ record.city || '' }}{{ record.district || '' }}{{ record.detailedAddress || '' }}
            </template>
            <template v-else-if="column.key === 'isDefault'">
              <Tag v-if="record.isDefault === 1" color="success">
                <template #icon><Check /></template>
                榛樿
              </Tag>
              <Button v-else type="link" size="small" @click="handleSetDefault(record)">璁句负榛樿</Button>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button type="link" size="small" @click="handleEditReceiver(record)">缂栬緫</Button>
                <Popconfirm
                  title="纭鍒犻櫎璇ユ敹璐т汉璁板綍鍚楋紵"
                  ok-text="纭畾"
                  cancel-text="鍙栨秷"
                  @confirm="handleDeleteReceiver(record)"
                >
                  <Button type="link" danger size="small">鍒犻櫎</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>

        <div class="receiver-add-btn-wrap">
          <Button type="primary" @click="handleAddReceiver">
            <template #icon><Plus /></template>
            娣诲姞鏀惰揣浜?          </Button>
        </div>
      </div>

      <!-- 鏀惰揣浜虹紪杈戝脊妗?-->
      <Modal
        v-model:open="receiverFormVisible"
        :title="editingReceiverId ? '缂栬緫鏀惰揣浜? : '娣诲姞鏀惰揣浜?"
        width="640px"
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
      >
        <Form
          ref="receiverFormRef"
          :model="receiverFormData"
          :rules="receiverFormRules"
          layout="vertical"
          class="receiver-form"
        >
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="鏀惰揣浜? name="consignee">
                <Input v-model:value="receiverFormData.consignee" placeholder="璇疯緭鍏ユ敹璐т汉濮撳悕" allow-clear />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="鎵嬫満鍙风爜" name="phoneNumber">
                <Input v-model:value="receiverFormData.phoneNumber" placeholder="璇疯緭鍏ユ墜鏈哄彿鐮? allow-clear maxlength="11" />
              </FormItem>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="鐢佃瘽" name="telephone">
                <Input v-model:value="receiverFormData.telephone" placeholder="璇疯緭鍏ョ數璇? allow-clear maxlength="20" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="鍥藉" name="country">
                <Select v-model:value="receiverFormData.country" disabled placeholder="璇烽€夋嫨鍥藉">
                  <SelectOption value="涓浗">涓浗</SelectOption>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <FormItem label="鍦板尯" required>
            <Row :gutter="8">
              <Col :span="8">
                <FormItem name="province" no-style>
                  <Select
                    v-model:value="receiverFormData.province"
                    placeholder="鐪?
                    @change="handleProvinceChange"
                  >
                    <SelectOption v-for="item in provinceList" :key="item.code" :value="item.name">
                      {{ item.name }}
                    </SelectOption>
                  </Select>
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem name="city" no-style>
                  <Select
                    v-model:value="receiverFormData.city"
                    placeholder="甯?
                    :disabled="!receiverFormData.province"
                    @change="handleCityChange"
                  >
                    <SelectOption v-for="item in cityList" :key="item.code" :value="item.name">
                      {{ item.name }}
                    </SelectOption>
                  </Select>
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem name="district" no-style>
                  <Select
                    v-model:value="receiverFormData.district"
                    placeholder="鍖?鍘?
                    :disabled="!receiverFormData.city"
                  >
                    <SelectOption v-for="item in districtList" :key="item.code" :value="item.name">
                      {{ item.name }}
                    </SelectOption>
                  </Select>
                </FormItem>
              </Col>
            </Row>
          </FormItem>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="璇︾粏鍦板潃" name="detailedAddress">
                <Input.TextArea
                  v-model:value="receiverFormData.detailedAddress"
                  placeholder="璇疯緭鍏ヨ缁嗗湴鍧€"
                  :rows="2"
                  allow-clear
                  show-count
                  :maxlength="500"
                />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="閭紪" name="postalCode">
                <Input v-model:value="receiverFormData.postalCode" placeholder="璇疯緭鍏ラ偖缂? allow-clear maxlength="10" />
              </FormItem>
            </Col>
          </Row>
          <FormItem>
            <Checkbox v-model:checked="receiverFormIsDefault">璁句负榛樿鏀惰揣浜?/Checkbox>
          </FormItem>
        </Form>
        <div class="receiver-form-footer">
          <Button @click="receiverFormVisible = false">鍙栨秷</Button>
          <Button type="primary" :loading="receiverSubmitting" @click="handleSaveReceiver">淇濆瓨</Button>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Page } from '@vben/common-ui';
import { ArrowLeft, Save, Plus, Building2, User, Check } from 'lucide-vue-next';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  Popconfirm,
  message,
} from 'ant-design-vue';
import type { FormInstance, TableColumnsType } from 'ant-design-vue';

import {
  createWarehouse,
  getWarehouseDetail,
  updateWarehouse,
  type WarehouseResult,
} from '#/api/sys/warehouse';
import {
  createWarehouseReceiver,
  deleteWarehouseReceiver,
  getWarehouseReceiverList,
  setDefaultWarehouseReceiver,
  updateWarehouseReceiver,
  type WarehouseReceiverResult,
} from '#/api/sys/warehouse-receiver';
import { regionData } from '#/utils/region-data';

interface WarehouseForm extends Partial<WarehouseResult> {
  id?: number;
}

const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const receiverLoading = ref(false);
const receiverSubmitting = ref(false);
const receiverFormRef = ref<FormInstance>();
const receiverFormVisible = ref(false);
const editingReceiverId = ref<number | undefined>(undefined);

const isEdit = computed(() => !!route.query.id);

const formData = reactive<WarehouseForm>(createDefaultForm());

const receiverFormData = reactive({
  consignee: '',
  phoneNumber: '',
  telephone: '',
  country: '涓浗',
  province: '',
  city: '',
  district: '',
  detailedAddress: '',
  postalCode: '',
  note: '',
  isDefault: 0,
});
const receiverFormIsDefault = ref(false);
const receiverFormRules = {
  consignee: [{ required: true, message: '璇疯緭鍏ユ敹璐т汉', trigger: 'blur' }],
  phoneNumber: [
    { required: true, message: '璇疯緭鍏ユ墜鏈哄彿鐮?, trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '鎵嬫満鍙锋牸寮忎笉姝ｇ‘', trigger: 'blur' },
  ],
};

// 鐪佸競鍖轰笁绾ц仈鍔ㄦ暟鎹?const provinceList = computed(() => regionData);
const cityList = computed(() => {
  const province = provinceList.value.find(
    (p: any) => p.name === receiverFormData.province,
  );
  return province?.children || [];
});
const districtList = computed(() => {
  const city = cityList.value.find((c: any) => c.name === receiverFormData.city);
  return city?.children || [];
});

function handleProvinceChange() {
  receiverFormData.city = '';
  receiverFormData.district = '';
}

function handleCityChange() {
  receiverFormData.district = '';
}

const temperatureZoneOptions = [
  { label: '甯告俯', value: 'NORMAL' },
  { label: '2-8鈩?, value: 'COLD' },
  { label: '-20鈩?, value: 'FREEZE' },
  { label: '-80鈩?, value: 'CONSTANT' },
  { label: '娑叉爱', value: 'LIQUID_NITROGEN' },
];

const qualityZoneOptions = [
  { label: '鍚堟牸鍖?, value: 'QUALIFIED' },
  { label: '寰呮鍖?, value: 'PENDING' },
  { label: '涓嶅悎鏍煎尯', value: 'UNQUALIFIED' },
  { label: '闅旂鍖?, value: 'ISOLATION' },
  { label: '閫€璐у尯', value: 'RETURN' },
];

const companyOptions = [
  { label: '姣嶅叕鍙?, value: 'PARENT' },
  { label: '瀛愬叕鍙窤', value: 'CHILD_A' },
  { label: '瀛愬叕鍙窧', value: 'CHILD_B' },
];

const formRules = {
  warehouseCode: [{ required: true, message: '璇疯緭鍏ヤ粨搴撶紪鐮?, trigger: 'blur' }],
  warehouseName: [{ required: true, message: '璇疯緭鍏ヤ粨搴撳悕绉?, trigger: 'blur' }],
  temperatureZone: [{ required: true, message: '璇烽€夋嫨娓╁害鍒嗗尯', trigger: 'change' }],
  qualityZone: [{ required: true, message: '璇烽€夋嫨璐ㄩ噺鍒嗗尯', trigger: 'change' }],
  company: [{ required: true, message: '璇烽€夋嫨鎵€灞炲叕鍙?, trigger: 'change' }],
  isEnabled: [{ required: true, message: '璇烽€夋嫨鏄惁鍚敤', trigger: 'change' }],
};

const receiverColumns: TableColumnsType<WarehouseReceiverResult> = [
  { title: '鏀惰揣浜?, dataIndex: 'consignee', key: 'consignee', width: 100 },
  { title: '鎵嬫満鍙风爜', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 130 },
  { title: '鍦板潃', key: 'address', width: 280 },
  { title: '閭紪', dataIndex: 'postalCode', key: 'postalCode', width: 100 },
  { title: '榛樿', key: 'isDefault', width: 90, align: 'center' as const },
  { title: '澶囨敞', dataIndex: 'note', key: 'note', width: 120, ellipsis: true },
  { title: '鎿嶄綔', key: 'action', fixed: 'right', width: 140 },
];

const receiverList = ref<WarehouseReceiverResult[]>([]);

function createDefaultForm(): WarehouseForm {
  return {
    warehouseCode: '',
    warehouseName: '',
    temperatureZone: undefined,
    qualityZone: undefined,
    company: undefined,
    employeeCode: '',
    employeeName: '',
    deptCode: '',
    deptNameFullPath: '',
    isEnabled: 1,
    remark: '',
  };
}

function maskPhone(phone: string) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

async function loadWarehouseDetail(id: number) {
  try {
    const detail = await getWarehouseDetail(id);
    Object.assign(formData, detail || {}, { id });
  } catch {
    message.error('浠撳簱璇︽儏鍔犺浇澶辫触');
  }
}

async function loadReceiverList() {
  if (!formData.warehouseCode) return;
  receiverLoading.value = true;
  try {
    const res = await getWarehouseReceiverList({ warehouseCode: formData.warehouseCode });
    receiverList.value = res.rows || res.list || res.data?.rows || [];
  } catch {
    receiverList.value = [];
  } finally {
    receiverLoading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;
    if (isEdit.value) {
      await updateWarehouse(formData as WarehouseResult);
      message.success('淇濆瓨鎴愬姛');
    } else {
      const res = await createWarehouse(formData);
      message.success('鍒涘缓鎴愬姛');
      const createdId = (res as any)?.id || (res as any)?.data?.id;
      if (createdId) {
        router.replace({ path: '/sys/warehouse/edit', query: { id: String(createdId) } });
        Object.assign(formData, { id: createdId });
      }
    }
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error(error?.message || '淇濆瓨澶辫触');
  } finally {
    submitting.value = false;
  }
}

function handleBack() {
  router.push('/sys/warehouse');
}

function handleAddReceiver() {
  if (!formData.warehouseCode) {
    message.warning('璇峰厛淇濆瓨浠撳簱鍩烘湰淇℃伅鍚庡啀娣诲姞鏀惰揣浜?);
    return;
  }
  editingReceiverId.value = undefined;
  receiverFormData.consignee = '';
  receiverFormData.phoneNumber = '';
  receiverFormData.telephone = '';
  receiverFormData.country = '涓浗';
  receiverFormData.province = '';
  receiverFormData.city = '';
  receiverFormData.district = '';
  receiverFormData.detailedAddress = '';
  receiverFormData.postalCode = '';
  receiverFormData.note = '';
  receiverFormIsDefault.value = false;
  receiverFormVisible.value = true;
}

function handleEditReceiver(record: WarehouseReceiverResult) {
  editingReceiverId.value = record.id;
  receiverFormData.consignee = record.consignee || '';
  receiverFormData.phoneNumber = record.phoneNumber || '';
  receiverFormData.telephone = (record as any).telephone || '';
  receiverFormData.country = record.country || '涓浗';
  receiverFormData.province = record.province || '';
  receiverFormData.city = record.city || '';
  receiverFormData.district = record.district || '';
  receiverFormData.detailedAddress = record.detailedAddress || '';
  receiverFormData.postalCode = record.postalCode || '';
  receiverFormData.note = record.note || '';
  receiverFormIsDefault.value = record.isDefault === 1;
  receiverFormVisible.value = true;
}

async function handleSaveReceiver() {
  try {
    await receiverFormRef.value?.validate();
    receiverSubmitting.value = true;
    const data = {
      ...receiverFormData,
      warehouseCode: formData.warehouseCode,
      isDefault: receiverFormIsDefault.value ? 1 : 0,
    };
    if (editingReceiverId.value) {
      await updateWarehouseReceiver(editingReceiverId.value, data);
      message.success('缂栬緫鎴愬姛');
    } else {
      await createWarehouseReceiver(data);
      message.success('娣诲姞鎴愬姛');
    }
    receiverFormVisible.value = false;
    await loadReceiverList();
  } catch (error) {
    // validation failed
  } finally {
    receiverSubmitting.value = false;
  }
}

async function handleDeleteReceiver(record: WarehouseReceiverResult) {
  try {
    await deleteWarehouseReceiver(record.id);
    message.success('鍒犻櫎鎴愬姛');
    await loadReceiverList();
  } catch (error: any) {
    message.error(error?.message || '鍒犻櫎澶辫触');
  }
}

async function handleSetDefault(record: WarehouseReceiverResult) {
  try {
    await setDefaultWarehouseReceiver(record.id);
    message.success('璁剧疆榛樿鍦板潃鎴愬姛');
    await loadReceiverList();
  } catch (error: any) {
    message.error(error?.message || '璁剧疆澶辫触');
  }
}

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    await loadWarehouseDetail(Number(id));
    await loadReceiverList();
  }
});
</script>

<style scoped>
.wms-warehouse-edit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 80px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 16px 0;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.back-btn {
  margin-top: 2px;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

/* Edit Warning Alert */
.edit-warning-alert {
  margin-bottom: 16px;
}

/* Warehouse Form */
.warehouse-form {
  padding-top: 8px;
}

/* System Info */
.system-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.system-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.system-info-label {
  color: #9ca3af;
}

.system-info-value {
  color: #374151;
}

.ml-6 {
  margin-left: 24px;
}

/* Receiver Section */
.receiver-empty {
  text-align: center;
  padding: 32px 0;
  color: #9ca3af;
  font-size: 14px;
}

.receiver-empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: #d1d5db;
}

.receiver-empty-hint {
  font-size: 12px;
  margin-top: 4px;
}

.receiver-add-btn-wrap {
  margin-top: 16px;
}

/* Receiver Form */
.receiver-form {
  padding-top: 8px;
}

.receiver-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}
</style>

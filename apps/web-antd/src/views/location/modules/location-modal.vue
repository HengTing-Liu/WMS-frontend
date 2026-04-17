<template>
  <Modal
    :title="modalTitle"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="500px"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 17 }"
    >
      <!-- 新建存储类型模式 -->
      <template v-if="mode === 'storageType'">
        <FormItem :label="$t('page.location.warehouse')" name="warehouseCode">
          <Select
            v-model:value="formData.warehouseCode"
            :placeholder="$t('page.location.selectWarehouse')"
            :options="warehouseOptions"
            :loading="warehouseLoading"
          />
        </FormItem>

        <FormItem :label="$t('page.location.storageType')" name="locationType">
          <Select
            v-model:value="formData.locationType"
            :placeholder="$t('page.location.selectStorageType')"
          >
            <SelectOption value="冰箱">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:kitchen" />
                {{ $t('page.location.type.refrigerator') }}
              </span>
            </SelectOption>
            <SelectOption value="货架">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:shelves" />
                {{ $t('page.location.type.shelf') }}
              </span>
            </SelectOption>
            <SelectOption value="地堆">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:inventory-2" />
                {{ $t('page.location.type.ground') }}
              </span>
            </SelectOption>
            <SelectOption value="托盘">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:square" />
                {{ $t('page.location.type.pallet') }}
              </span>
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem :label="$t('page.location.containerName')" name="locationName">
          <Input
            v-model:value="formData.locationName"
            :placeholder="$t('page.location.enterName')"
            :maxlength="50"
            show-count
          />
        </FormItem>

        <FormItem :label="$t('page.location.containerCode')" name="locationNo">
          <Input
            v-model:value="formData.locationNo"
            :placeholder="$t('page.location.enterCode')"
            :maxlength="50"
            show-count
          >
            <template #suffix>
              <Button type="link" size="small" :loading="suggestLoading" @click="handleSuggestCode">
                {{ $t('page.location.autoGenerate') }}
              </Button>
            </template>
          </Input>
        </FormItem>
      </template>

      <!-- 新建存储分区模式 -->
      <template v-else-if="mode === 'partition'">
        <FormItem :label="$t('page.location.parentNode')">
          <Input :value="parentNodeName" disabled />
        </FormItem>

        <FormItem :label="$t('page.location.storageType')" name="locationType">
          <Select
            v-model:value="formData.locationType"
            :placeholder="$t('page.location.selectStorageType')"
          >
            <SelectOption value="层">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:layers" />
                {{ $t('page.location.type.layer') }}
              </span>
            </SelectOption>
            <SelectOption value="架">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:view-column" />
                {{ $t('page.location.type.rack') }}
              </span>
            </SelectOption>
            <SelectOption value="行">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:format-line-spacing" />
                {{ $t('page.location.type.row') }}
              </span>
            </SelectOption>
            <SelectOption value="列">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:view-week" />
                {{ $t('page.location.type.column') }}
              </span>
            </SelectOption>
            <SelectOption value="格">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:grid-on" />
                {{ $t('page.location.type.cell') }}
              </span>
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem :label="$t('page.location.quantity')" name="quantity">
          <InputNumber
            v-model:value="formData.quantity"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </FormItem>

        <FormItem :label="$t('page.location.prefix')" name="prefix">
          <Input
            v-model:value="formData.prefix"
            :placeholder="$t('page.location.enterPrefix')"
            :maxlength="20"
          />
        </FormItem>

        <FormItem :label="$t('page.location.startSerial')" name="startSerial">
          <InputNumber
            v-model:value="formData.startSerial"
            :min="1"
            :max="9999"
            style="width: 100%"
          />
        </FormItem>

        <FormItem :label="$t('page.location.preview')">
          <div class="preview-box">
            <Tag v-for="i in Math.min(formData.quantity || 1, 5)" :key="i" color="blue">
              {{ formData.prefix || 'LAYER' }}{{ String((formData.startSerial || 1) + i - 1).padStart(3, '0') }}
            </Tag>
            <span v-if="(formData.quantity || 1) > 5" class="more-count">...</span>
          </div>
        </FormItem>
      </template>

      <!-- 新建存储容器模式 -->
      <template v-else-if="mode === 'container'">
        <FormItem :label="$t('page.location.parentNode')">
          <Input :value="parentNodeName" disabled />
        </FormItem>

        <FormItem :label="$t('page.location.containerType')" name="locationType">
          <Select
            v-model:value="formData.locationType"
            :placeholder="$t('page.location.selectContainerType')"
          >
            <SelectOption value="盒">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:inbox" />
                {{ $t('page.location.type.box') }}
              </span>
            </SelectOption>
            <SelectOption value="箱">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:inventory" />
                {{ $t('page.location.type.case') }}
              </span>
            </SelectOption>
            <SelectOption value="笼">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:deployed-code" />
                {{ $t('page.location.type.cage') }}
              </span>
            </SelectOption>
            <SelectOption value="抽屉">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:draw" />
                {{ $t('page.location.type.drawer') }}
              </span>
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem :label="$t('page.location.storageMode')" name="storageMode">
          <Select
            v-model:value="formData.storageMode"
            :placeholder="$t('page.location.selectStorageMode')"
          >
            <SelectOption value="Exclusive">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:lock" />
                {{ $t('page.location.storageMode.exclusive') }}
              </span>
            </SelectOption>
            <SelectOption value="Shared">
              <span class="type-option">
                <IconifyIcon icon="material-symbols:share" />
                {{ $t('page.location.storageMode.shared') }}
              </span>
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem :label="$t('page.location.quantity')" name="quantity">
          <InputNumber
            v-model:value="formData.quantity"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </FormItem>

        <FormItem :label="$t('page.location.specification')" name="specification">
          <Select
            v-model:value="formData.specification"
            :placeholder="$t('page.location.selectSpecification')"
            :disabled="formData.storageMode !== 'Exclusive'"
            :allowClear="formData.storageMode === 'Exclusive'"
          >
            <SelectOption value="2x2">
              2x2 ({{ $t('page.location.spec4holes') }})
            </SelectOption>
            <SelectOption value="4x4">
              4x4 (16 {{ $t('page.location.specHoles') }})
            </SelectOption>
            <SelectOption value="6x6">
              6x6 (36 {{ $t('page.location.specHoles') }})
            </SelectOption>
            <SelectOption value="8x12">
              8x12 (96 {{ $t('page.location.specHoles') }})
            </SelectOption>
            <SelectOption value="9x9">
              9x9 (81 {{ $t('page.location.specHoles') }})
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem :label="$t('page.location.prefix')" name="prefix">
          <Input
            v-model:value="formData.prefix"
            :placeholder="$t('page.location.enterPrefix')"
            :maxlength="20"
          />
        </FormItem>

        <FormItem :label="$t('page.location.startSerial')" name="startSerial">
          <InputNumber
            v-model:value="formData.startSerial"
            :min="1"
            :max="9999"
            style="width: 100%"
          />
        </FormItem>

        <!-- 预览区域 -->
        <FormItem :label="$t('page.location.preview')">
          <div class="preview-container">
            <div class="preview-title">{{ $t('page.location.containerPreview') }}:</div>
            <div class="preview-content">
              <div v-for="boxIdx in Math.min(formData.quantity || 1, 3)" :key="boxIdx" class="preview-box-item">
                <Tag color="blue">
                  {{ formData.prefix || 'BOX' }}{{ String((formData.startSerial || 1) + boxIdx - 1).padStart(3, '0') }}
                </Tag>
                <div v-if="formData.storageMode === 'Exclusive' && formData.specification" class="preview-positions">
                  <Tag v-for="pos in getPreviewPositions(boxIdx)" :key="pos" color="green" size="small">
                    {{ pos }}
                  </Tag>
                  <span v-if="getTotalPositions() > 12" class="more-positions">
                    ... ({{ getTotalPositions() }} {{ $t('page.location.specHoles') }})
                  </span>
                </div>
                <span v-else-if="formData.storageMode === 'Shared'" class="shared-mode">
                  ({{ $t('page.location.storageMode.shared') }}: 1 {{ $t('page.location.specHole') }})
                </span>
              </div>
              <span v-if="(formData.quantity || 1) > 3" class="more-count">
                ... {{ (formData.quantity || 1) - 3 }} {{ $t('page.location.moreContainers') }}
              </span>
            </div>
          </div>
        </FormItem>
      </template>

      <!-- 编辑模式 -->
      <template v-else-if="mode === 'edit'">
        <!-- 绑定状态提示 -->
        <Alert v-if="bindStatus.isBound" :message="$t('page.location.boundWarning')" type="warning" show-icon style="margin-bottom: 16px" />

        <!-- 不可修改字段 -->
        <FormItem :label="$t('page.location.warehouse')">
          <Input :value="formData.warehouseCode" disabled />
        </FormItem>

        <FormItem :label="$t('page.location.parentNode')">
          <Input :value="parentNodeName" disabled />
        </FormItem>

        <FormItem :label="$t('page.location.containerCode')">
          <Input :value="formData.locationNo" disabled />
        </FormItem>

        <FormItem :label="$t('page.location.containerType')">
          <Input :value="formData.locationType" disabled />
        </FormItem>

        <!-- 可修改字段 -->
        <FormItem :label="$t('page.location.containerName')" name="locationName">
          <Input
            v-model:value="formData.locationName"
            :placeholder="$t('page.location.enterName')"
            :maxlength="50"
            show-count
          />
        </FormItem>

        <!-- 存储容器可修改的字段 -->
        <template v-if="isContainerType && !bindStatus.isBound">
          <FormItem :label="$t('page.location.storageMode')" name="storageMode">
            <Select v-model:value="formData.storageMode">
              <SelectOption value="Exclusive">
                {{ $t('page.location.storageMode.exclusive') }}
              </SelectOption>
              <SelectOption value="Shared">
                {{ $t('page.location.storageMode.shared') }}
              </SelectOption>
            </Select>
          </FormItem>

          <FormItem :label="$t('page.location.specification')" name="specification">
            <Select
              v-model:value="formData.specification"
              :disabled="formData.storageMode !== 'Exclusive'"
              :allowClear="formData.storageMode === 'Exclusive'"
            >
              <SelectOption value="2x2">2x2 (4孔)</SelectOption>
              <SelectOption value="4x4">4x4 (16孔)</SelectOption>
              <SelectOption value="6x6">6x6 (36孔)</SelectOption>
              <SelectOption value="8x12">8x12 (96孔)</SelectOption>
              <SelectOption value="9x9">9x9 (81孔)</SelectOption>
            </Select>
          </FormItem>
        </template>

        <!-- 存储容器已绑定时灰显 -->
        <template v-if="isContainerType && bindStatus.isBound">
          <FormItem :label="$t('page.location.storageMode')">
            <Input :value="formData.storageMode" disabled />
          </FormItem>

          <FormItem :label="$t('page.location.specification')">
            <Input :value="formData.specification || '-'" disabled />
          </FormItem>
        </template>

        <!-- 备注 -->
        <FormItem :label="$t('page.common.remarks')" name="remarks">
          <Textarea
            v-model:value="formData.remarks"
            :rows="2"
            :placeholder="$t('page.common.remarksPlaceholder')"
            :maxlength="200"
            show-count
          />
        </FormItem>
      </template>

      <!-- 通用备注 -->
      <FormItem v-if="mode !== 'partition'" :label="$t('page.common.remarks')" name="remarks">
        <Textarea
          v-model:value="formData.remarks"
          :rows="2"
          :placeholder="$t('page.common.remarksPlaceholder')"
          :maxlength="200"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  SelectOption,
  Textarea,
  Button,
  Tag,
  Alert,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  add as createLocation,
  batchCreate as batchCreateLocation,
  suggestCode as suggestLocationCode,
  checkBind as checkLocationBind,
  updateLocationById,
  getDetail as getLocationDetail,
  type LocationTreeNode,
} from '#/api/wms/location';
import { listWarehousePage } from '#/api/sys/warehouse';

// 弹窗模式
type ModalMode = 'storageType' | 'partition' | 'container' | 'edit';

interface Props {
  locationTree?: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 弹窗状态
const visible = ref(false);
const loading = ref(false);
const suggestLoading = ref(false);
const mode = ref<ModalMode>('storageType');

// 表单数据
const formData = reactive<{
  warehouseCode: string;
  parentId: number | null;
  locationType: string;
  locationName: string;
  locationNo: string;
  quantity: number;
  prefix: string;
  startSerial: number;
  storageMode: string;
  specification: string;
  remarks: string;
}>({
  warehouseCode: '',
  parentId: null,
  locationType: '',
  locationName: '',
  locationNo: '',
  quantity: 1,
  prefix: '',
  startSerial: 1,
  storageMode: '',
  specification: '',
  remarks: '',
});

// 仓库选项
const warehouseOptions = ref<Array<{ label: string; value: string }>>([]);
const warehouseLoading = ref(false);

// 上级节点名称
const parentNodeName = ref('');

// 绑定状态
const bindStatus = reactive({
  isBound: false,
  boundType: '',
  boundMaterialName: '',
});

// 当前编辑的行数据
const currentRow = ref<any>(null);

// 是否为容器类型（盒/箱/笼/抽屉）
const containerTypes = ['盒', '箱', '笼', '抽屉'];
const isContainerType = computed(() => containerTypes.includes(formData.locationType));

// 弹窗标题
const modalTitle = computed(() => {
  switch (mode.value) {
    case 'storageType':
      return $t('page.location.addStorageType');
    case 'partition':
      return $t('page.location.addPartition');
    case 'container':
      return $t('page.location.addContainer');
    case 'edit':
      return $t('page.location.editTitle');
    default:
      return $t('page.location.addTitle');
  }
});

// 表单校验
const rules = computed(() => {
  const baseRules: any = {};

  if (mode.value === 'storageType') {
    Object.assign(baseRules, {
      warehouseCode: [{ required: true, message: $t('page.location.selectWarehouse'), trigger: 'change' }],
      locationType: [{ required: true, message: $t('page.location.selectStorageType'), trigger: 'change' }],
      locationName: [
        { required: true, message: $t('page.location.enterName'), trigger: 'blur' },
        { min: 1, max: 50, message: $t('page.location.nameLength'), trigger: 'blur' },
      ],
      locationNo: [
        { required: true, message: $t('page.location.enterCode'), trigger: 'blur' },
      ],
    });
  } else if (mode.value === 'partition') {
    Object.assign(baseRules, {
      locationType: [{ required: true, message: $t('page.location.selectStorageType'), trigger: 'change' }],
      quantity: [{ required: true, message: $t('page.location.enterQuantity'), trigger: 'blur' }],
    });
  } else if (mode.value === 'container') {
    Object.assign(baseRules, {
      locationType: [{ required: true, message: $t('page.location.selectContainerType'), trigger: 'change' }],
      storageMode: [{ required: true, message: $t('page.location.selectStorageMode'), trigger: 'change' }],
      quantity: [{ required: true, message: $t('page.location.enterQuantity'), trigger: 'blur' }],
      specification: formData.storageMode === 'Exclusive'
        ? [{ required: true, message: $t('page.location.selectSpecification'), trigger: 'change' }]
        : [],
    });
  } else if (mode.value === 'edit') {
    Object.assign(baseRules, {
      locationName: [
        { required: true, message: $t('page.location.enterName'), trigger: 'blur' },
        { min: 1, max: 50, message: $t('page.location.nameLength'), trigger: 'blur' },
      ],
    });
  }

  return baseRules;
});

const formRef = ref();

// 加载仓库列表
const loadWarehouseOptions = async () => {
  warehouseLoading.value = true;
  try {
    const res = await listWarehousePage({ pageNum: 1, pageSize: 1000 });
    const list = res?.rows || [];
    warehouseOptions.value = list.map((r: any) => ({
      label: r.warehouseName || r.warehouseCode,
      value: r.warehouseCode,
    }));
  } catch (error) {
    console.error('加载仓库列表失败:', error);
    warehouseOptions.value = [];
  } finally {
    warehouseLoading.value = false;
  }
};

// 自动生成编码
const handleSuggestCode = async () => {
  if (!formData.warehouseCode) {
    message.warning($t('page.location.selectWarehouseFirst'));
    return;
  }

  suggestLoading.value = true;
  try {
    const result = await suggestLocationCode({
      warehouseCode: formData.warehouseCode,
      parentId: formData.parentId || undefined,
      locationType: formData.locationType,
    });
    formData.locationNo = result.suggestedCode;

    // 如果前缀为空，自动设置
    if (!formData.prefix && result.codePrefix) {
      formData.prefix = result.codePrefix;
    }
  } catch (error) {
    console.error('获取建议编码失败:', error);
  } finally {
    suggestLoading.value = false;
  }
};

// 规格解析：返回 { rows, cols }
const parseSpecification = (spec: string): { rows: number; cols: number } => {
  const match = spec.match(/(\d+)x(\d+)/i);
  if (match) {
    return { rows: parseInt(match[1]), cols: parseInt(match[2]) };
  }
  return { rows: 1, cols: 1 };
};

// 获取总孔位数
const getTotalPositions = (): number => {
  if (!formData.specification) return 0;
  const { rows, cols } = parseSpecification(formData.specification);
  return rows * cols;
};

// 获取预览孔位列表
const getPreviewPositions = (boxIndex: number): string[] => {
  if (!formData.specification) return [];
  const { rows, cols } = parseSpecification(formData.specification);
  const positions: string[] = [];
  const maxShow = 12; // 最多显示12个

  for (let r = 0; r < rows && positions.length < maxShow; r++) {
    for (let c = 0; c < cols && positions.length < maxShow; c++) {
      const rowChar = String.fromCharCode(65 + r); // A, B, C...
      positions.push(`${rowChar}${String(c + 1).padStart(2, '0')}`);
    }
  }

  return positions;
};

// 监听存储模式变化
watch(() => formData.storageMode, (val) => {
  if (val === 'Shared') {
    formData.specification = '';
  }
});

// 打开弹窗
const open = async (options: {
  mode?: ModalMode;
  parentId?: number;
  parentName?: string;
  warehouseCode?: string;
  id?: number;
  row?: any;
} = {}) => {
  visible.value = true;
  mode.value = options.mode || 'storageType';
  currentRow.value = options.row;

  // 重置表单
  Object.assign(formData, {
    warehouseCode: options.warehouseCode || '',
    parentId: options.parentId || null,
    locationType: '',
    locationName: '',
    locationNo: '',
    quantity: 1,
    prefix: '',
    startSerial: 1,
    storageMode: '',
    specification: '',
    remarks: '',
  });

  // 重置绑定状态
  bindStatus.isBound = false;
  bindStatus.boundType = '';
  bindStatus.boundMaterialName = '';

  // 加载仓库列表
  if (mode.value === 'storageType') {
    loadWarehouseOptions();
  }

  // 编辑模式：加载数据
  if (mode.value === 'edit' && options.id) {
    loading.value = true;
    try {
      // 查询详情
      const detail = await getLocationDetail(options.id.toString());

      // 查询占用状态
      const occupancy = await checkLocationBind(options.id);

      parentNodeName.value = options.parentName || detail.parentName || '';
      Object.assign(formData, {
        warehouseCode: detail.warehouseCode || options.warehouseCode || '',
        parentId: detail.parentId || null,
        locationType: detail.locationType || '',
        locationName: detail.locationName || '',
        locationNo: detail.locationNo || '',
        storageMode: detail.storageMode || '',
        specification: detail.specification || '',
        remarks: detail.remarks || '',
      });

      // 设置绑定状态
      bindStatus.isBound = occupancy.isBound;
      bindStatus.boundType = occupancy.boundType || '';
      bindStatus.boundMaterialName = occupancy.boundMaterialName || '';
    } catch (error) {
      console.error('加载库位详情失败:', error);
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  } else if (mode.value === 'edit' && options.row) {
    // 直接从行数据获取
    parentNodeName.value = options.row.parentName || '';
    Object.assign(formData, {
      warehouseCode: options.row.warehouseCode || options.warehouseCode || '',
      parentId: options.row.parentId || null,
      locationType: options.row.locationType || '',
      locationName: options.row.locationName || '',
      locationNo: options.row.locationNo || '',
      storageMode: options.row.storageMode || '',
      specification: options.row.specification || '',
      remarks: options.row.remarks || '',
    });

    // 检查是否已绑定（根据 isUse 字段）
    bindStatus.isBound = options.row.isUse === 1;
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (mode.value === 'storageType') {
      // 新建存储类型
      await createLocation({
        warehouseCode: formData.warehouseCode,
        parentId: null,
        locationType: formData.locationType,
        locationName: formData.locationName,
        locationNo: formData.locationNo,
        remarks: formData.remarks,
      });
      message.success($t('page.message.addSuccess'));
    } else if (mode.value === 'partition') {
      // 新建存储分区（批量）
      const data: any = {
        parentId: formData.parentId!,
        locationType: formData.locationType,
        quantity: formData.quantity,
        codeRule: 'SEQUENCE',
        startSerialNo: formData.startSerial,
        locationNoPrefix: formData.prefix,
        locationNamePrefix: formData.prefix,
      };

      await batchCreateLocation(data);
      message.success($t('page.message.addSuccess'));
    } else if (mode.value === 'container') {
      // 新建存储容器（批量）
      const totalPositions = getTotalPositions();
      const data: any = {
        parentId: formData.parentId!,
        locationType: formData.locationType,
        locationGrade: 'Container',
        quantity: formData.quantity,
        storageMode: formData.storageMode,
        specification: formData.storageMode === 'Exclusive' ? formData.specification : '1x1',
        codeRule: 'SEQUENCE',
        startSerialNo: formData.startSerial,
        locationNoPrefix: formData.prefix,
        locationNamePrefix: formData.prefix,
        // 独占模式需要同时创建子节点
        createChildren: formData.storageMode === 'Exclusive',
        childrenQuantity: totalPositions,
        childrenType: '孔',
      };

      await batchCreateLocation(data);
      message.success($t('page.message.addSuccess'));
    } else if (mode.value === 'edit') {
      // 编辑库位
      const updateData: Record<string, any> = {
        id: currentRow.value?.id,
        locationName: formData.locationName,
        remarks: formData.remarks,
      };

      // 仅容器类型可修改存储模式和规格
      if (isContainerType.value && !bindStatus.isBound) {
        updateData.storageMode = formData.storageMode;
        updateData.specification = formData.storageMode === 'Exclusive' ? formData.specification : '';
      }

      await updateLocationById(currentRow.value?.id, updateData);
      message.success($t('page.message.editSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error($t('page.message.addFail'));
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  formRef.value?.resetFields();
};

// 监听仓库变化
watch(() => formData.warehouseCode, (val) => {
  if (val && mode.value === 'storageType') {
    // 仓库变化时，可以自动生成编码
    handleSuggestCode();
  }
});

defineExpose({ open });
</script>

<style scoped lang="less">
.type-option {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(svg) {
    font-size: 18px;
  }
}

.preview-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  min-height: 40px;

  .more-count {
    color: #999;
    font-size: 12px;
    line-height: 24px;
  }
}

.preview-container {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;

  .preview-title {
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-box-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 8px;
    border-left: 2px solid #d9d9d9;

    .preview-positions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding-left: 12px;
      margin-top: 4px;

      .more-positions {
        font-size: 12px;
        color: #999;
        line-height: 20px;
      }
    }

    .shared-mode {
      font-size: 12px;
      color: #666;
      padding-left: 12px;
      margin-top: 4px;
    }
  }

  .more-count {
    color: #999;
    font-size: 12px;
    padding-left: 8px;
  }
}
</style>

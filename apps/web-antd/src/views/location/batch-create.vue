<template>
  <Page auto-content-height :title="$t('page.location.batchCreateTitle')">
    <div class="batch-create-page">
      <Row :gutter="24">
        <!-- 左侧配置表单 -->
        <Col :span="10">
          <Card :title="$t('page.location.createConfig')" :bordered="false">
            <Form
              ref="formRef"
              :model="formData"
              :rules="formRules"
              layout="vertical"
            >
              <!-- 父节点选择 -->
              <FormItem :label="$t('page.location.parentNode')" name="parentId">
                <TreeSelect
                  v-model:value="formData.parentId"
                  :tree-data="treeData"
                  :field-names="{ label: 'locationName', value: 'id', children: 'children' }"
                  :placeholder="$t('page.location.selectParent')"
                  allow-clear
                  tree-default-expand-all
                  style="width: 100%"
                  @change="handleParentChange"
                />
              </FormItem>

              <!-- 容器类型 -->
              <FormItem :label="$t('page.location.containerType')" name="type">
                <Select
                  v-model:value="formData.type"
                  :placeholder="$t('page.location.selectType')"
                  :disabled="!formData.parentId"
                >
                  <SelectOption
                    v-for="opt in availableTypes"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    <div class="type-option">
                      <IconifyIcon :icon="opt.icon" />
                      <span>{{ opt.label }}</span>
                    </div>
                  </SelectOption>
                </Select>
              </FormItem>

              <Divider />

              <!-- 命名规则 -->
              <FormItem :label="$t('page.location.namingPatternLabel')" name="namingPattern">
                <RadioGroup v-model:value="formData.namingPattern">
                  <Radio value="sequential">{{ $t('page.location.namingPattern.sequential') }}</Radio>
                  <Radio value="coordinate">{{ $t('page.location.namingPattern.coordinate') }}</Radio>
                </RadioGroup>
              </FormItem>

              <!-- 名称前缀 -->
              <FormItem :label="$t('page.location.namePrefix')" name="prefix">
                <Input
                  v-model:value="formData.prefix"
                  :placeholder="$t('page.location.prefixPlaceholder')"
                  allow-clear
                />
              </FormItem>

              <!-- 起始编号 -->
              <FormItem
                v-if="formData.namingPattern === 'sequential'"
                :label="$t('page.location.startNumber')"
                name="startNum"
              >
                <InputNumber
                  v-model:value="formData.startNum"
                  :min="1"
                  :max="9999"
                  style="width: 100%"
                />
              </FormItem>

              <!-- 创建数量 -->
              <FormItem :label="$t('page.location.createCount')" name="count">
                <InputNumber
                  v-model:value="formData.count"
                  :min="1"
                  :max="100"
                  style="width: 100%"
                />
              </FormItem>

              <Divider />

              <!-- 尺寸配置（仅货架、货位） -->
              <template v-if="showDimensions">
                <FormItem :label="$t('page.location.gridRows')" name="dimensions.rows"
                >
                  <InputNumber
                    v-model:value="formData.dimensions.rows"
                    :min="1"
                    :max="50"
                    style="width: 100%"
                    :placeholder="$t('page.location.forCoordinate')"
                  />
                </FormItem>

                <FormItem :label="$t('page.location.gridCols')" name="dimensions.cols"
                >
                  <InputNumber
                    v-model:value="formData.dimensions.cols"
                    :min="1"
                    :max="50"
                    style="width: 100%"
                    :placeholder="$t('page.location.forCoordinate')"
                  />
                </FormItem>
              </template>

              <!-- 冻存盒网格配置（仅最后一级类型） -->
              <template v-if="isLastLevelType">
                <FormItem :label="$t('page.location.boxGridSpec')">
                  <Select v-model:value="boxGridSize">
                    <SelectOption value="8x12">8 × 12 ({{ $t('page.location.gridSpecs.8x12') }})</SelectOption>
                    <SelectOption value="9x9">9 × 9 ({{ $t('page.location.gridSpecs.9x9') }})</SelectOption>
                    <SelectOption value="10x10">10 × 10 ({{ $t('page.location.gridSpecs.10x10') }})</SelectOption>
                  </Select>
                </FormItem>
              </template>

              <FormItem>
                <Button type="primary" block :loading="submitting" @click="handleSubmit"
                >
                  <IconifyIcon icon="material-symbols:add" />
                  {{ $t('page.location.batchCreate') }}
                </Button>
              </FormItem>
            </Form>
          </Card>
        </Col>

        <!-- 右侧实时预览 -->
        <Col :span="14">
          <Card :title="$t('page.location.preview')" :bordered="false">
            <div class="preview-content">
              <Empty
                v-if="previewList.length === 0"
                :description="$t('page.location.previewEmpty')"
                image="simple"
              />

              <template v-else>
                <div class="preview-stats">
                  <Alert
                    :message="$t('page.location.previewFormat', { count: previewList.length, format: previewFormat })"
                    type="info"
                    show-icon
                  />
                </div>

                <div class="preview-grid">
                  <div
                    v-for="(item, index) in previewList"
                    :key="index"
                    class="preview-item"
                    :class="`type-${formData.type}`"
                  >
                    <div class="item-icon">
                      <IconifyIcon :icon="getTypeIcon(formData.type)" />
                    </div>
                    <div class="item-info">
                      <div class="item-name">{{ item.name }}</div>
                      <div class="item-code">{{ item.code }}</div>
                    </div>
                  </div>
                </div>

                <!-- 如果是最后一级类型，显示网格预览 -->
                <div v-if="isLastLevelType" class="box-preview">
                  <Divider>{{ $t('page.location.boxGridPreview') }}</Divider>
                  <div class="mini-grid">
                    <div
                      v-for="row in boxGridRows"
                      :key="row"
                      class="mini-row"
                    >
                      <div
                        v-for="col in boxGridCols"
                        :key="col"
                        class="mini-cell"
                        :class="{ 'occupied': Math.random() > 0.7 }"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Row,
  Select,
  SelectOption,
  TreeSelect,
  message,
} from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { getLocationTree, batchCreateContainers } from '#/api';
import { getEnumItemList } from '#/api/system/enum';

const router = useRouter();
const formRef = ref();
const submitting = ref(false);
const treeData = ref<any[]>([]);
const boxGridSize = ref('8x12');

// 表单数据
const formData = ref({
  parentId: undefined as string | undefined,
  type: '' as string,
  namingPattern: 'sequential' as 'sequential' | 'coordinate',
  prefix: '',
  startNum: 1,
  count: 10,
  dimensions: {
    rows: 5,
    cols: 10,
  },
});

// 从枚举获取的容器类型数据
const containerTypeEnum = ref<Array<{ value: string; label: string; icon: string; sortOrder: number }>>([]);
const typeOrder = ref<string[]>([]);

// 图标映射
const iconMap: Record<string, string> = {
  refrigerator: 'material-symbols:kitchen',
  layer: 'material-symbols:layers',
  shelf: 'material-symbols:shelves',
  row: 'material-symbols:view-week',
  box: 'material-symbols:box',
  hole: 'material-symbols:grid-on',
};

// 加载枚举数据
const loadContainerTypeEnum = async () => {
  try {
    const res = await getEnumItemList({ enumCode: 'container_type' });
    const items = (res as any)?.data?.rows || (res as any)?.rows || [];
    
    // 建立中文到英文的映射
    const typeValueMap: Record<string, string> = {};
    items.forEach((item: any) => {
      const key = item.itemKey;
      const value = item.itemValue;
      if (key && value) {
        typeValueMap[value] = key;
      }
    });
    console.log('[DEBUG] type mapping:', typeValueMap);
    
    // 直接使用所有数据，不过滤
    // 按 sortOrder 排序
    const sortedItems = [...items].sort((a: any, b: any) => 
      (a.sortOrder || 0) - (b.sortOrder || 0)
    );
    
    typeOrder.value = sortedItems.map((item: any) => item.itemKey);
    
    // 存储中文和英文的映射
    containerTypeEnum.value = sortedItems.map((item: any) => ({
      value: item.itemKey,
      label: item.itemValue,
      icon: iconMap[item.itemKey] || 'material-symbols:folder',
      sortOrder: item.sortOrder || 0,
    }));
    console.log('[DEBUG] sorted typeOrder:', typeOrder.value);
  } catch (error) {
    console.error($t('page.location.loadEnumFail'), error);
  }
};

// parent node debug
const parentNodeType = ref<string | null>(null);

// 计算属性
const availableTypes = computed(() => {
  // parent node selection debug
  if (!parentNodeType.value) {
    return [];
  }
  
  // parent node debug
  let parentTypeKey = parentNodeType.value;
  
  // 从 containerTypeEnum 中查找对应的英文 key
  const parentEnum = containerTypeEnum.value.find(t => t.label === parentTypeKey || t.value === parentTypeKey);
  if (parentEnum) {
    parentTypeKey = parentEnum.value;
  }
  
  const parentIndex = typeOrder.value.indexOf(parentTypeKey);
  
  // 如果找不到匹配或已经是最后一级，显示所有类型
  if (parentIndex === -1 || parentIndex >= typeOrder.value.length - 1) {
    console.log('[DEBUG] no match or last level, show all types');
    return containerTypeEnum.value;
  }
  
  // parent node debug
  return containerTypeEnum.value.filter((t) => {
    const idx = typeOrder.value.indexOf(t.value);
    return idx > parentIndex;
  });
});

// 查找树节点
const findNodeInTree = (nodes: any[], id: any): any => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const showDimensions = computed(() => {
  return formData.value.namingPattern === 'coordinate' && 
         !isLastLevelType.value;
});

const boxGridRows = computed(() => {
  const [rows] = boxGridSize.value.split('x').map(Number);
  return rows;
});

const boxGridCols = computed(() => {
  const [, cols] = boxGridSize.value.split('x').map(Number);
  return cols;
});

// 是否为最后一级类型
const isLastLevelType = computed(() => {
  const keys = typeOrder.value;
  return keys.indexOf(formData.value.type) === keys.length - 1;
});

// 预览列表
const previewList = computed(() => {
  const list: Array<{ name: string; code: string }> = [];
  
  if (!formData.value.prefix || !formData.value.count || formData.value.count <= 0) {
    return list;
  }

  const { namingPattern, prefix, startNum, count, dimensions } = formData.value;

  if (namingPattern === 'sequential') {
    // 顺序编号
    for (let i = 0; i < count; i++) {
      const num = (startNum || 1) + i;
      list.push({
        name: `${prefix}${num}`,
        code: `${prefix}${num}`.toUpperCase(),
      });
    }
  } else if (namingPattern === 'coordinate') {
    // 坐标编号
    const rows = dimensions.rows || 1;
    const cols = dimensions.cols || 1;
    
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (list.length >= count) break;
        const rowLabel = String.fromCharCode(64 + r); // A, B, C...
        list.push({
          name: `${prefix}${rowLabel}-${c}`,
          code: `${prefix}${rowLabel}${c}`.toUpperCase(),
        });
      }
      if (list.length >= count) break;
    }
  }

  return list;
});

const previewFormat = computed(() => {
  if (previewList.value.length === 0) return '';
  const first = previewList.value[0]!;
  const last = previewList.value[previewList.value.length - 1]!;
  return `${first.name} ~ ${last.name}`;
});

// 表单规则
const formRules = {
  parentId: [{ required: true, message: $t('page.location.selectParent'), trigger: 'change' }],
  type: [{ required: true, message: $t('page.location.selectType'), trigger: 'change' }],
  prefix: [{ required: true, message: $t('page.location.prefixRequired'), trigger: 'blur' }],
  count: [{ required: true, message: $t('page.location.countRequired'), trigger: 'blur' }],
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  return containerTypeEnum.value.find((t) => t.value === type)?.icon || 'material-symbols:folder';
};

// 加载树数据
const loadTreeData = async () => {
  try {
    const res = await getLocationTree();
    treeData.value = res || [];
  } catch (error) {
    message.error($t('page.location.loadTreeFail'));
  }
};

// parent node debug
const handleParentChange = (value: string) => {
  console.log('[DEBUG] selecting parent node:', value);
  
  // parent node debug
  const parentNode = findNodeInTree(treeData.value, value);
  console.log('[DEBUG] parent node:', parentNode);
  
  // parent node debug
  parentNodeType.value = parentNode?.locationType || parentNode?.type;
  console.log('[DEBUG] parent node type:', parentNodeType.value);
  
  // 重置类型选择
  if (availableTypes.value.length > 0) {
    formData.value.type = availableTypes.value[0].value;
  } else {
    formData.value.type = '';
  }
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    // parent node debug
    const parentNode = findNodeInTree(treeData.value, formData.value.parentId!);

    // 【紧急修复】构建后端需要的参数 - 对齐后端 BatchCreateLocationDTO
    // 后端字段名是 quantity，不是 count！
    const params = {
      parentId: Number(formData.value.parentId!), // convert to number
      warehouseCode: parentNode?.warehouseCode || '', // parent node debug
      locationGrade: formData.value.type, // location grade
      locationType: formData.value.type, // location type
      quantity: formData.value.count ?? 10, // fix: use quantity with default value
      storageMode: 'Exclusive', // default storage mode
      // 根据命名模式设置规格
      specification: formData.value.namingPattern === 'coordinate'
        ? `${formData.value.dimensions.rows}x${formData.value.dimensions.cols}`
        : undefined,
    };
    console.log('[DEBUG] submit params:', JSON.stringify(params, null, 2));

    await batchCreateContainers(params);
    message.success($t('page.location.createSuccess', { count: formData.value.count }));
    // 【修复】成功后跳转到库位总览页（使用命名路由避免路径错误）
    router.push({ name: 'LocationOverview' });
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

// 监听类型变化，设置默认前缀
watch(
  () => formData.value.type,
  (type) => {
    if (type && !formData.value.prefix) {
      // 动态生成前缀：取类型前2-3个字母大写
      formData.value.prefix = type.substring(0, 3).toUpperCase() + '-';
    }
  }
);

// 初始化
onMounted(() => {
  loadTreeData();
  loadContainerTypeEnum();
});
</script>

<style scoped lang="less">
.batch-create-page {
  padding: 16px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(svg) {
    font-size: 18px;
  }
}

.preview-content {
  min-height: 500px;
}

.preview-stats {
  margin-bottom: 16px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow: auto;
  padding: 4px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid #1890ff;

  &.type-warehouse {
    border-left-color: #1890ff;
  }

  &.type-area {
    border-left-color: #13c2c2;
  }

  &.type-shelf {
    border-left-color: #722ed1;
  }

  &.type-slot {
    border-left-color: #fa8c16;
  }

  &.type-box {
    border-left-color: #52c41a;
  }

  .item-icon {
    font-size: 20px;
    color: #666;
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-name {
      font-size: 13px;
      font-weight: 500;
      color: #1f1f1f;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-code {
      font-size: 11px;
      color: #999;
    }
  }
}

.box-preview {
  margin-top: 24px;

  .mini-grid {
    display: inline-block;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    padding: 8px;
    background: #fafafa;

    .mini-row {
      display: flex;
    }

    .mini-cell {
      width: 16px;
      height: 16px;
      border: 1px solid #e8e8e8;
      margin: 1px;
      background: #fff;
      border-radius: 2px;

      &.occupied {
        background: #ff4d4f;
      }
    }
  }
}
</style>

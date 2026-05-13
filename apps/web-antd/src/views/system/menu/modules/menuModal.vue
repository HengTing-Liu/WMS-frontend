<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { IconPicker, useVbenModal } from '@vben/common-ui';
import { Form, Input, InputNumber, Radio, TreeSelect, Spin, message } from 'ant-design-vue';
import {
  getMenuDetail,
  getMenuList,
  getMenuTreeselect,
  addMenu,
  updateMenu,
  type MenuItem,
} from '#/api';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

/** Ant Design Vue 4 TreeSelect：label / value / children；key 与 value 一致便于展开与搜索 */
interface MenuTreeOption {
  label: string;
  value: number;
  key: number;
  children?: MenuTreeOption[];
}

const data = ref<{
  isEdit?: boolean;
  menuId?: number;
  parentRow?: MenuItem;
  onSuccess?: () => void;
}>();

const title = ref('');
const loading = ref(false);

const isEdit = computed(() => !!data.value?.isEdit && data.value?.menuId != null);

// 表单数据（完全对齐若依字段）
const form = reactive({
  menuId: undefined as number | undefined,
  parentId: 0,
  menuType: 'M',
  icon: 'carbon:logo-github',
  orderNum: 0,
  menuName: '',
  routeName: '',
  isFrame: '1',
  path: '',
  component: '',
  perms: '',
  query: '',
  isCache: '0',
  visible: '0',
  status: '0',
});

const menuTreeOptions = ref<MenuTreeOption[]>([]);
/** 树数据更新后强制重挂 TreeSelect，保证 defaultExpandAll 对异步数据生效 */
const parentTreeSelectKey = ref(0);

function resetForm(parentId: number | string = 0) {
  form.menuId = undefined;
  const pid =
    parentId === '' || parentId === null || parentId === undefined
      ? 0
      : Number(parentId);
  form.parentId = Number.isFinite(pid) ? pid : 0;
  form.menuType = 'M';
  form.icon = 'carbon:logo-github';
  form.orderNum = 0;
  form.menuName = '';
  form.routeName = '';
  form.isFrame = '1';
  form.path = '';
  form.component = '';
  form.perms = '';
  form.query = '';
  form.isCache = '0';
  form.visible = '0';
  form.status = '0';
}

/** 与菜单列表页一致，兼容若依 R.ok({ data: { rows, total } }) 等返回体 */
function extractMenuListFromResponse(res: any): MenuItem[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.rows)) return res.rows;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.rows)) return res.data.rows;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

/** 编辑时不能选自己或子节点为上级，否则成环 */
function collectSelfAndDescendantIds(flat: MenuItem[], selfId: number): Set<number> {
  const ids = new Set<number>([selfId]);
  const queue = [selfId];
  while (queue.length) {
    const pid = queue.shift()!;
    for (const m of flat) {
      const mid = m.menuId == null ? NaN : Number(m.menuId);
      if (Number.isNaN(mid)) continue;
      if (Number(m.parentId) === pid && !ids.has(mid)) {
        ids.add(mid);
        queue.push(mid);
      }
    }
  }
  return ids;
}

/** 解析 /api/menu/treeselect 经 request 返回后的结构（data 直出数组或少数包装形态） */
function extractTreeselectList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.rows)) return res.rows;
  if (Array.isArray(res?.data?.rows)) return res.data.rows;
  return [];
}

/** 后端 TreeSelect：id(string)、label、children */
function convertTreeselect(nodes: any[]): MenuTreeOption[] {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .map((n) => {
      const val = Number(n?.id);
      if (!Number.isFinite(val)) {
        return null;
      }
      const rawChildren = n.children;
      const children =
        Array.isArray(rawChildren) && rawChildren.length > 0 ? convertTreeselect(rawChildren) : undefined;
      return {
        label: String(n.label ?? ''),
        value: val,
        key: val,
        ...(children && children.length > 0 ? { children } : {}),
      };
    })
    .filter((x): x is MenuTreeOption => x != null);
}

function pruneTreeByOmit(nodes: MenuTreeOption[], omit: Set<number>): MenuTreeOption[] {
  return nodes
    .filter((n) => !omit.has(n.value))
    .map((n) => {
      const nextChildren =
        n.children && n.children.length > 0 ? pruneTreeByOmit(n.children, omit) : undefined;
      return {
        label: n.label,
        value: n.value,
        key: n.key,
        ...(nextChildren && nextChildren.length > 0 ? { children: nextChildren } : {}),
      };
    });
}

async function loadMenuTree() {
  const [treeRes, listRes] = await Promise.all([getMenuTreeselect(), getMenuList()]);
  let children = convertTreeselect(extractTreeselectList(treeRes));
  const editingId = isEdit.value ? data.value?.menuId : undefined;
  if (editingId != null) {
    const flat = extractMenuListFromResponse(listRes).filter((item) => item.menuType !== 'F');
    const omit = collectSelfAndDescendantIds(flat, Number(editingId));
    children = pruneTreeByOmit(children, omit);
  }
  menuTreeOptions.value = [
    { label: '根目录（无上级）', value: 0, key: 0, children },
  ];
  parentTreeSelectKey.value += 1;
}

const [Modal, modalApi] = useVbenModal({
  footerClass: 'justify-center',
  showCancelButton: true,
  showConfirmButton: true,
  openAutoFocus: false,
  destroyOnClose: true,
  centered: true,
  class: 'w-[720px]',
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<typeof data.value>();
    data.value = payload ?? {};
    title.value = isEdit.value ? '修改菜单' : '添加菜单';
    loading.value = true;
    try {
      await loadMenuTree();
      if (isEdit.value && data.value?.menuId != null) {
        const res = (await getMenuDetail(data.value.menuId)) as any;
        const detail = res?.data ?? res;
        resetForm(detail.parentId ?? 0);
        form.menuId = detail.menuId;
        form.menuType = detail.menuType ?? 'M';
        form.icon = detail.icon ?? 'carbon:logo-github';
        form.orderNum = detail.orderNum ?? 0;
        form.menuName = detail.menuName ?? '';
        form.routeName = detail.routeName ?? '';
        form.isFrame = detail.isFrame ?? '1';
        form.path = detail.path ?? '';
        form.component = detail.component ?? '';
        form.perms = detail.perms ?? '';
        form.query = detail.query ?? '';
        form.isCache = detail.isCache ?? '0';
        form.visible = detail.visible ?? '0';
        form.status = detail.status ?? '0';
      } else {
        const parentRow = data.value?.parentRow;
        const parentId = parentRow?.menuId ?? 0;
        resetForm(parentId);
        if (parentRow && parentRow.menuType === 'M') {
          form.menuType = 'C';
        }
      }
    } catch (e: any) {
      message.error(e?.message ?? '加载菜单信息失败');
    } finally {
      loading.value = false;
    }
  },
});

async function handleSubmit() {
  loading.value = true;
  try {
    const rawPid = form.parentId;
    const parentNum =
      rawPid === '' || rawPid === null || rawPid === undefined ? NaN : Number(rawPid);
    const payload: Record<string, any> = {
      parentId: Number.isFinite(parentNum) ? parentNum : 0,
      menuName: form.menuName,
      orderNum: form.orderNum,
      menuType: form.menuType,
      icon: form.icon,
      isFrame: form.isFrame,
      path: form.path,
      component: form.component,
      perms: form.perms,
      query: form.query,
      isCache: form.isCache,
      visible: form.visible,
      status: form.status,
      routeName: form.routeName,
    };
    let res: any;
    if (isEdit.value && form.menuId != null) {
      payload.menuId = form.menuId;
      res = await updateMenu(payload);
    } else {
      res = await addMenu(payload);
    }
    // 调用成功（若依后端异常会直接抛错到 catch），这里统一视为成功
    message.success(res?.msg ?? '操作成功');
    // 通知父组件刷新菜单列表
    emit('success');
    if (data.value?.onSuccess) {
      await Promise.resolve(data.value.onSuccess());
    }
    modalApi.close();
    // 自动刷新整页，使侧边栏菜单和路由立即生效
    window.location.reload();
  } catch (e: any) {
    message.error(e?.message ?? '操作失败');
  } finally {
    loading.value = false;
  }
}

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="title">
    <Spin :spinning="loading">
      <Form
        layout="horizontal"
        :label-col="{ style: { width: '100px' } }"
        :wrapper-col="{ style: { flex: 1 } }"
        class="menu-form grid grid-cols-2 gap-x-6"
      >
        <!-- 上级菜单 -->
        <Form.Item label="上级菜单" class="col-span-2">
          <TreeSelect
            :key="parentTreeSelectKey"
            v-model:value="form.parentId"
            :tree-data="menuTreeOptions"
            :field-names="{ label: 'label', value: 'value', children: 'children' }"
            show-search
            tree-node-filter-prop="label"
            :tree-default-expand-all="true"
            allow-clear
            placeholder="选择上级菜单"
            class="w-full"
          />
        </Form.Item>

        <!-- 菜单类型 -->
        <Form.Item label="菜单类型" class="col-span-2">
          <Radio.Group v-model:value="form.menuType">
            <Radio value="M">目录</Radio>
            <Radio value="C">菜单</Radio>
            <Radio v-if="form.menuType === 'F'" value="F">按钮</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 菜单图标（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="菜单图标"
        >
          <IconPicker v-model:modelValue="form.icon" />
        </Form.Item>

        <!-- 显示排序（当菜单类型为“按钮”时必填） -->
        <Form.Item
          label="显示排序"
          :rules="form.menuType === 'F' ? [{ required: true, message: '显示排序不能为空' }] : []"
        >
          <InputNumber v-model:value="form.orderNum" :min="0" class="w-full" />
        </Form.Item>

        <!-- 菜单名称 -->
        <Form.Item label="菜单名称" required>
          <Input v-model:value="form.menuName" placeholder="请输入菜单名称" />
        </Form.Item>

        <!-- 路由名称（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="路由名称"
        >
          <Input v-model:value="form.routeName" placeholder="请输入路由名称" />
        </Form.Item>

        <!-- 是否外链（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="是否外链"
        >
          <Radio.Group v-model:value="form.isFrame">
            <Radio value="0">是</Radio>
            <Radio value="1">否</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 路由地址（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="路由地址"
        >
          <Input v-model:value="form.path" placeholder="请输入路由地址" />
        </Form.Item>

        <!-- 组件路径（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="组件路径"
        >
          <Input v-model:value="form.component" placeholder="请输入组件路径" />
        </Form.Item>

        <!-- 权限字符（菜单、按钮） -->
        <Form.Item
          v-if="form.menuType !== 'M'"
          label="权限字符"
        >
          <Input v-model:value="form.perms" placeholder="请输入权限标识" />
        </Form.Item>

        <!-- 路由参数（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="路由参数"
        >
          <Input v-model:value="form.query" placeholder="请输入路由参数" />
        </Form.Item>

        <!-- 是否缓存（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="是否缓存"
        >
          <Radio.Group v-model:value="form.isCache">
            <Radio value="0">缓存</Radio>
            <Radio value="1">不缓存</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 显示状态（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="显示状态"
        >
          <Radio.Group v-model:value="form.visible">
            <Radio value="0">显示</Radio>
            <Radio value="1">隐藏</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 菜单状态（所有类型） -->
        <Form.Item label="菜单状态">
          <Radio.Group v-model:value="form.status">
            <Radio value="0">正常</Radio>
            <Radio value="1">停用</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>

<style scoped>
.menu-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.menu-form :deep(.ant-form-item-label > label) {
  font-size: 13px;
}

.menu-form :deep(.ant-radio-group),
.menu-form :deep(.ant-input),
.menu-form :deep(.ant-input-number),
.menu-form :deep(.ant-select),
.menu-form :deep(.ant-tree-select) {
  width: 100%;
}
</style>

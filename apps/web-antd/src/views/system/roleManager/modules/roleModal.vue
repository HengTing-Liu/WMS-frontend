<script lang="ts" setup>
import { ref, computed, provide } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm, z } from '#/adapter/form';
import { addRole, editRole, getMenuTree, getRoleMenuTreeSelect } from '#/api';
import type { RoleApi, MenuApi, RoleSaveBody } from '#/api';

type RoleItem = RoleApi.RoleItem;
type MenuItem = MenuApi.MenuItem;

const data = ref<{
  record?: RoleItem;
  roles?: RoleItem[];
  onSuccess?: () => void;
}>();

const title = ref('');
const isEdit = computed(() => !!data.value?.record);

const menuTree = ref<MenuItem[]>([]);

// 菜单权限 Tree：树形数据、展开键、选中键、父子联动
const menuTreeData = ref<{ title: string; key: number; children?: any[] }[]>([]);
const expandedKeys = ref<number[]>([]);
const checkedKeys = ref<number[]>([]);
const linkParentChild = ref(true);
const expandAllChecked = ref(false);
const checkAllChecked = ref(false);
const allMenuIds = ref<number[]>([]);
const menuParentMap = ref<Record<number, number | null>>({});

// 历史数据，用于做“不能重复”的校验
const existingRoleNames = ref<string[]>([]);
const existingRoleKeys = ref<string[]>([]);
const existingRoleSorts = ref<number[]>([]);

// 按照 parentId 把后端的扁平数组组装成真正的树（根节点 parentId=0）
function buildMenuTree(list: MenuItem[]): MenuItem[] {
  if (!Array.isArray(list) || !list.length) return [];
  const map = new Map<number, MenuItem & { children: MenuItem[] }>();

  list.forEach((item) => {
    map.set(item.menuId, { ...item, children: [] });
  });

  const roots: (MenuItem & { children: MenuItem[] })[] = [];

  map.forEach((item) => {
    if (!item.parentId || !map.has(item.parentId)) {
      // 顶级菜单：parentId 为 0 或父级不在当前数组里
      roots.push(item);
    } else {
      map.get(item.parentId)!.children.push(item);
    }
  });

  return roots;
}

function collectAllKeys(nodes: { key: number; children?: any[] }[]): number[] {
  const ids: number[] = [];
  function walk(list: { key: number; children?: any[] }[]) {
    list.forEach((n) => {
      ids.push(n.key);
      if (n.children?.length) walk(n.children);
    });
  }
  walk(nodes);
  return ids;
}

function toTreeData(nodes: MenuItem[], parentId: number | null = null): { title: string; key: number; children?: any[] }[] {
  return nodes.map((node) => {
    menuParentMap.value[node.menuId] = parentId;
    return {
      title: node.menuName,
      key: node.menuId,
      children: node.children?.length ? toTreeData(node.children as MenuItem[], node.menuId) : undefined,
    };
  });
}

const [Modal, modalApi] = useVbenModal({
  footerClass: 'justify-center',
  showCancelButton: true,
  showConfirmButton: true,
  openAutoFocus: false,
  destroyOnClose: true,
  centered: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await formApi.validateAndSubmitForm();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    modalApi.setState({ loading: true });
    try {
      data.value = modalApi.getData<{ record?: RoleItem; roles?: RoleItem[]; onSuccess?: () => void }>() ?? undefined;
      title.value = isEdit.value ? '修改角色' : '新增角色';
      formApi.resetForm();

      // 先准备唯一性校验所需的历史记录（排除当前编辑行）
      const roles = data.value?.roles ?? [];
      const currentId = data.value?.record?.roleId;
      const others = roles.filter((r) => r.roleId !== currentId);
      existingRoleNames.value = others.map((r) => r.roleName);
      existingRoleKeys.value = others.map((r) => r.roleKey);
      existingRoleSorts.value = others.map((r) => r.roleSort);

      const record = data.value?.record;

      if (record && record.roleId != null) {
        // 编辑角色：使用 /api/menu/roleMenuTreeselect/{roleId} 回显菜单树和勾选状态
        const menuRes = (await getRoleMenuTreeSelect(record.roleId)) as any;
        const menusData =
          (menuRes?.menus as any[]) ??
          (menuRes?.data?.menus as any[]) ??
          [];

        // 该接口返回的就是树形结构：{ id, label, children }
        function toTreeFromRoleMenu(nodes: any[], parentId: number | null = null): { title: string; key: number; children?: any[] }[] {
          return (nodes || []).map((node) => {
            menuParentMap.value[node.id] = parentId;
            return {
              title: node.label,
              key: node.id,
              children: node.children && node.children.length ? toTreeFromRoleMenu(node.children, node.id) : undefined,
            };
          });
        }

        menuParentMap.value = {};
        const treeData = toTreeFromRoleMenu(menusData);
        menuTreeData.value = treeData;
        allMenuIds.value = collectAllKeys(treeData);

        expandedKeys.value = [];
        expandAllChecked.value = false;
        linkParentChild.value = true;

        const checkedFromApi: number[] =
          (menuRes?.checkedKeys as number[]) ??
          (menuRes?.data?.checkedKeys as number[]) ??
          [];
        checkedKeys.value = Array.isArray(checkedFromApi) ? checkedFromApi : [];
        checkAllChecked.value = checkedKeys.value.length === allMenuIds.value.length;

        formApi.setValues({
          roleName: record.roleName,
          roleKey: record.roleKey,
          roleSort: record.roleSort,
          status: record.status ?? '0',
          dataScope: record.dataScope ?? '1',
          remarks: record.remarks ?? '',
        });
      } else {
        // 新增角色：加载完整菜单树（/api/menu/list）
        const menus = (await getMenuTree()) as MenuItem[] | { data?: MenuItem[] };
        const flatList = Array.isArray(menus) ? menus : (menus as any)?.data ?? [];
        menuParentMap.value = {};
        menuTree.value = buildMenuTree(flatList);
        const treeData = toTreeData(menuTree.value);
        menuTreeData.value = treeData;
        allMenuIds.value = collectAllKeys(treeData);

        expandedKeys.value = [];
        expandAllChecked.value = false;
        linkParentChild.value = true;
        checkedKeys.value = [];
        checkAllChecked.value = false;

        formApi.setValues({
          roleSort: 1,
          status: '0',
          dataScope: '1',
        });
      }
    } finally {
      modalApi.setState({ loading: false });
    }
  },
});

function onExpandCollapseChange(e: { target: { checked: boolean } }) {
  expandAllChecked.value = e.target.checked;
  expandedKeys.value = e.target.checked ? [...allMenuIds.value] : [];
}

function onCheckAllChange(e: { target: { checked: boolean } }) {
  checkAllChecked.value = e.target.checked;
  checkedKeys.value = e.target.checked ? [...allMenuIds.value] : [];
}

function onLinkParentChildChange(e: { target: { checked: boolean } }) {
  linkParentChild.value = e.target.checked;
}

function onTreeCheck(keys: number[] | { checked: number[]; halfChecked: number[] }) {
  let list: number[];
  if (Array.isArray(keys)) {
    list = keys;
  } else {
    // 父子联动时，需要把半选中的父节点也计入已选集合
    const merged = new Set<number>([...keys.checked, ...keys.halfChecked]);
    list = Array.from(merged);
  }
  checkedKeys.value = list;
  checkAllChecked.value = list.length === allMenuIds.value.length;
}

function onTreeExpand(keys: (string | number)[]) {
  expandedKeys.value = keys as number[];
  expandAllChecked.value = keys.length === allMenuIds.value.length;
}

// 供 RoleMenuPermissionBlock 通过 inject 使用
provide('roleMenuPermissionContext', {
  menuTreeData,
  expandedKeys,
  checkedKeys,
  linkParentChild,
  expandAllChecked,
  checkAllChecked,
  onExpandCollapseChange,
  onCheckAllChange,
  onLinkParentChildChange,
  onTreeCheck,
  onTreeExpand,
});

const onSubmit = async (values: Record<string, any>) => {
  const rawMenuIds: number[] = Array.isArray(checkedKeys.value) ? [...checkedKeys.value] : [];
  if (!rawMenuIds.length) {
    message.error('请至少选择一项菜单权限');
    return;
  }

  // 父子联动时：若只勾选了子级未勾选父级，需把子级对应的所有父级 ID 一并传给后端
  const menuIdSet = new Set<number>(rawMenuIds);
  if (linkParentChild.value) {
    for (const id of rawMenuIds) {
      let current: number | null = id;
      while (current != null) {
        const parentId = menuParentMap.value[current];
        if (parentId == null) break;
        if (menuIdSet.has(parentId)) break;
        menuIdSet.add(parentId);
        current = parentId;
      }
    }
  }
  const menuIds = Array.from(menuIdSet);

  modalApi.lock();
  try {
    const body: RoleSaveBody = {
      roleName: values.roleName?.trim(),
      roleKey: values.roleKey?.trim(),
      roleSort: Number(values.roleSort ?? 1),
      status: values.status ?? '0',
      dataScope: values.dataScope ?? '1',
      remarks: values.remarks || undefined,
      menuIds,
    };
    if (isEdit.value && data.value?.record) {
      body.roleId = data.value.record.roleId;
    }

    const res = (await (isEdit.value ? editRole(body) : addRole(body))) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '操作成功');
      data.value?.onSuccess?.();
      modalApi.close();
    } else {
      message.error(res?.msg ?? '操作失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '操作失败');
  } finally {
    modalApi.unlock();
  }
};

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  commonConfig: { componentProps: { class: 'w-full' } },
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-1',
  schema: [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: '角色名称',
      formItemClass: 'col-span-2',
      rules: z
        .string()
        .max(30, { message: '角色名称不能超过30个字符' })
        .superRefine((val, ctx) => {
          const name = val.trim();
          if (!name) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '请填写名称' });
            return;
          }
          if (existingRoleNames.value.includes(name)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '名称不能重复' });
          }
        }),
      componentProps: { placeholder: '请输入角色名称', maxlength: 30, showCount: true },
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: '角色权限字符',
      formItemClass: 'col-span-2',
      rules: z
        .string()
        .max(30, { message: '权限字符不能超过30个字符' })
        .superRefine((val, ctx) => {
          const key = val.trim();
          if (!key) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '请填写编码' });
            return;
          }
          if (existingRoleKeys.value.includes(key)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '编码不能重复' });
          }
        }),
      componentProps: { placeholder: '请输入权限字符', maxlength: 30, showCount: true },
    },
    {
      component: 'InputNumber',
      fieldName: 'roleSort',
      label: '角色顺序',
      formItemClass: 'col-span-2',
      rules: z
        .number({ invalid_type_error: '请填写角色顺序' })
        .refine((val) => !existingRoleSorts.value.includes(val), {
          message: '角色顺序不能重复',
        }),
      componentProps: { min: 1, placeholder: '1' },
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      formItemClass: 'col-span-2',
      componentProps: {
        options: [
          { label: '正常', value: '0' },
          { label: '停用', value: '1' },
        ],
      },
    },
    {
      component: 'RoleMenuPermissionBlock',
      fieldName: '_menuPermissionBlock',
      label: ' ', /* 标题在区块内与 dataScopeModal 一致：菜单权限 + 展开/折叠、全选/全不选、父子联动 */
      formItemClass: 'col-span-2',
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      formItemClass: 'col-span-2',
      componentProps: { placeholder: '请输入备注', rows: 3 },
    },
  ],
});
</script>

<template>
  <Modal :title="title" class="w-[700px]">
    <div class="role-modal-form-with-menu">
      <Form />
    </div>
  </Modal>
</template>

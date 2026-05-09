<template>
    <div class="p-5 bg-white">
        <!-- 搜索区 -->
        <div class="mb-4 flex flex-wrap items-end gap-4">
            <div class="flex items-center gap-2">
                <span class="search-label">菜单名称</span>
                <Input v-model:value="queryParams.menuName" placeholder="请输入菜单名称" allow-clear class="w-[220px]" />
            </div>
            <div class="flex items-center gap-2">
                <span class="search-label">状态</span>
                <Select v-model:value="queryParams.status" placeholder="菜单状态" allow-clear class="w-[160px]"
                    :options="statusOptions" />
            </div>
            <Button type="primary" class="btn-search" @click="handleSearch">
                <IconifyIcon icon="ant-design:search-outlined" class="mr-1" />
                搜索
            </Button>
            <Button class="btn-reset" @click="handleReset">
                <IconifyIcon icon="ant-design:reload-outlined" class="mr-1" />
                重置
            </Button>
        </div>
        <!-- 工具栏 -->
        <div class="mb-4 flex items-center gap-2">
            <Button class="btn-add" @click="handleAdd()">
                <IconifyIcon icon="material-symbols:add" class="mr-1" />
                新增
            </Button>
            <Button class="btn-expand" @click="toggleExpandAll">
                <IconifyIcon icon="mingcute:align-justify-fill" class="mr-1" />
                展开/折叠
            </Button>
        </div>
        <!-- 菜单表格（树形） -->
        <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="menuId" :pagination="false"
            :expanded-row-keys="expandedRowKeys" class="menu-table" @expand="onRowExpand">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'icon'">
                    <IconifyIcon
                        :icon="record.icon || 'mdi:checkbox-blank-circle-outline'" />
                </template>
                <template v-else-if="column.key === 'menuType'">
                    <Tag :color="record.menuType === 'M' ? 'blue' : 'green'">
                        {{ record.menuType === 'M' ? '目录' : record.menuType === 'C' ? '菜单' : record.menuType === 'F' ? '按钮' : record.menuType }}
                    </Tag>
                </template>
                <template v-else-if="column.key === 'status'">
                    <Tag :color="record.status === '0' ? 'processing' : 'default'">
                        {{ record.status === '0' ? '正常' : '停用' }}
                    </Tag>
                </template>
                <template v-else-if="column.key === 'action'">
                    <span class="cell-action">
                        <Button type="link" class="p-0 link-edit" @click="handleEdit(record)">编辑</Button>
                        <Button v-if="record.menuType !== 'C'" type="link" class="p-0 link-add" @click="handleAdd(record)">新增</Button>
                        <Button type="link" class="p-0" @click="handleButtons(record)">按钮</Button>
                        <Popconfirm
                            title="是否确认删除该菜单及子菜单？"
                            ok-text="确认"
                            cancel-text="取消"
                            @confirm="handleDelete(record)"
                        >
                            <Button type="link" danger class="p-0 link-delete">删除</Button>
                        </Popconfirm>
                    </span>
                </template>
            </template>
        </Table>

        <MenuModal ref="menuModalRef" @success="loadMenuList" />
        <ButtonManagerDrawer ref="buttonDrawerRef" @success="loadMenuList" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Table, Input, Select, Button, Tag, Popconfirm } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { message } from 'ant-design-vue';
import { getMenuList, deleteMenu, type MenuItem } from '#/api';
import MenuModal from './modules/menuModal.vue';
import ButtonManagerDrawer from './modules/button-manager-drawer.vue';

const loading = ref(false);
const rawList = ref<MenuItem[]>([]);

const queryParams = ref<{
    menuName?: string;
    status?: string;
}>({
    menuName: '',
    status: undefined,
});

const statusOptions = [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' },
];

const columns = [
    { title: '菜单名称', dataIndex: 'menuName', key: 'menuName', width: 200 },
    { title: '类型', dataIndex: 'menuType', key: 'menuType', width: 80, align: 'center' as const },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 80, align: 'center' as const },
    { title: '排序', dataIndex: 'orderNum', key: 'orderNum', width: 80, align: 'center' as const },
    { title: '权限标识', dataIndex: 'perms', key: 'perms', width: 200 },
    { title: '组件路径', dataIndex: 'component', key: 'component', width: 260 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 160, align: 'center' as const },
];

// 将后端 data 扁平列表组装成树（根据 parentId）
function buildTree(list: MenuItem[]): MenuItem[] {
    const map = new Map<number, MenuItem & { children: MenuItem[] }>();
    list.forEach((item) => {
        map.set(item.menuId, { ...item, children: [] });
    });
    const roots: (MenuItem & { children: MenuItem[] })[] = [];
    map.forEach((item) => {
        if (!item.parentId || !map.has(item.parentId)) {
            roots.push(item);
        } else {
            map.get(item.parentId)!.children.push(item);
        }
    });
    return roots;
}

const dataList = computed(() => buildTree(filteredList.value));

const filteredList = computed(() => {
    const name = queryParams.value.menuName?.trim();
    const status = queryParams.value.status;
    return rawList.value.filter((item) => {
        if (name && !item.menuName.includes(name)) return false;
        if (status && item.status !== status) return false;
        return true;
    });
});

const expandAll = ref(true);
const expandedRowKeys = ref<(string | number)[]>([]);

function collectAllMenuIds(nodes: MenuItem[]): (string | number)[] {
    const ids: (string | number)[] = [];
    function walk(list: MenuItem[]) {
        list.forEach((item) => {
            ids.push(item.menuId);
            if (item.children?.length) {
                walk(item.children);
            }
        });
    }
    walk(buildTree(rawList.value));
    return ids;
}

function toggleExpandAll() {
    expandAll.value = !expandAll.value;
    expandedRowKeys.value = expandAll.value ? collectAllMenuIds(rawList.value) : [];
}

function onRowExpand(expanded: boolean, record: MenuItem) {
    const id = record.menuId;
    if (expanded) {
        if (!expandedRowKeys.value.includes(id)) {
            expandedRowKeys.value = [...expandedRowKeys.value, id];
        }
    } else {
        expandedRowKeys.value = expandedRowKeys.value.filter((key) => key !== id);
    }
}

async function loadMenuList() {
    loading.value = true;
    try {
        const res = (await getMenuList()) as any;
        let list: MenuItem[] = [];
        if (Array.isArray(res)) {
            list = res;
        } else if (Array.isArray(res?.rows)) {
            list = res.rows;
        } else if (Array.isArray(res?.data)) {
            list = res.data;
        } else if (Array.isArray(res?.data?.rows)) {
            list = res.data.rows;
        } else if (Array.isArray(res?.data?.data)) {
            list = res.data.data;
        }
        rawList.value = (list ?? []).filter((item) => item.menuType !== 'F');
    } catch (e: any) {
        message.error(e?.message ?? '加载菜单列表失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    loadMenuList();
}

function handleReset() {
    queryParams.value = { menuName: '', status: undefined };
    loadMenuList();
}

const menuModalRef = ref<InstanceType<typeof MenuModal> | null>(null);
const buttonDrawerRef = ref<InstanceType<typeof ButtonManagerDrawer> | null>(null);

function handleAdd(parentRow?: MenuItem) {
    // 使用 setData + open，确保 onSuccess 等回调在 modal 内部能正确拿到
    menuModalRef.value?.modalApi
        ?.setData({
            isEdit: false,
            parentRow,
            onSuccess: () => loadMenuList(),
        })
        .open();
}

function handleEdit(record: MenuItem) {
    menuModalRef.value?.modalApi
        ?.setData({
            isEdit: true,
            menuId: record.menuId,
            onSuccess: () => loadMenuList(),
        })
        .open();
}

async function handleDelete(record: MenuItem) {
    try {
        const res = (await deleteMenu(record.menuId)) as { code?: number; msg?: string };
        if (res?.code === 200) {
            message.success(res?.msg ?? '删除成功');
            loadMenuList();
        } else {
            message.error(res?.msg ?? '删除失败');
        }
    } catch (e: any) {
        message.error(e?.message ?? '删除失败');
    }
}

function handleButtons(record: MenuItem) {
    buttonDrawerRef.value?.open(record);
}

onMounted(() => {
    loadMenuList();
});
</script>

<style scoped>
.tab-btn.ant-btn {
    border-radius: 0;
    border-color: #d9d9d9;
}

.tab-btn.active.ant-btn-primary {
    background-color: #1890ff;
    border-color: #1890ff;
}

.search-label {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
}

.btn-search.ant-btn-primary {
    background-color: #1890ff;
    border-color: #1890ff;
    color: #fff;
}

.btn-search.ant-btn-primary:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
    color: #fff;
}

.btn-reset.ant-btn {
    background: #fff;
    border-color: #d9d9d9;
    color: rgba(0, 0, 0, 0.65);
}

.btn-reset.ant-btn:hover {
    border-color: #40a9ff;
    color: #40a9ff;
}

.btn-add.ant-btn {
    background-color: #40a9ff;
    border-color: #40a9ff;
    color: #fff;
}

.btn-add.ant-btn:hover {
    background-color: #69c0ff;
    border-color: #69c0ff;
    color: #fff;
}

.btn-expand.ant-btn {
    background-color: #fff;
    border-color: #d9d9d9;
    color: rgba(0, 0, 0, 0.65);
}

.btn-expand.ant-btn:hover {
    border-color: #40a9ff;
    color: #40a9ff;
}

.menu-table :deep(.ant-table-thead > tr > th),
.menu-table :deep(.ant-table-tbody > tr > td) {
    padding: 12px 16px;
    color: rgba(0, 0, 0, 0.65);
}

.menu-table :deep(.ant-table-thead > tr > th) {
    font-weight: 600;
    background: #fafafa;
}

.cell-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.link-edit.ant-btn-link {
    color: #1890ff;
}

.link-edit.ant-btn-link:hover {
    color: #40a9ff;
}

.link-delete.ant-btn-link {
    color: #ff4d4f;
}

.link-delete.ant-btn-link:hover {
    color: #ff7875;
}

.link-add.ant-btn-link {
    color: #1890ff;
}

.link-add.ant-btn-link:hover {
    color: #40a9ff;
}
</style>
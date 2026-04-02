<template>
    <div class="p-5 bg-white">
        <!-- 搜索区 -->
        <div class="mb-4 flex flex-wrap items-end gap-4">
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-700">部门名称</span>
                <Input v-model:value="searchForm.deptName" placeholder="请输入部门名称" allow-clear class="w-[200px]" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-700">状态</span>
                <Select v-model:value="searchForm.status" placeholder="部门状态" allow-clear class="w-[140px]"
                    :options="statusOptions" />
            </div>
            <Button type="primary" @click="handleSearch">
                <IconifyIcon icon="ant-design:search-outlined" class="mr-1" />
                搜索
            </Button>
            <Button @click="handleReset">
                <IconifyIcon icon="ant-design:reload-outlined" class="mr-1" />
                重置
            </Button>
        </div>

        <!-- 工具栏 -->
        <div class="mb-4 flex items-center gap-2">
            <Button type="primary" class="btn-add-dept" @click="handleAdd">
                <IconifyIcon icon="material-symbols:add" class="mr-1" />
                新增
            </Button>
            <Button class="btn-expand-toggle" @click="toggleExpandAll">
                <IconifyIcon v-if="expandAll" icon="ant-design:down-outlined" class="mr-1" />
                <IconifyIcon v-else icon="ant-design:right-outlined" class="mr-1" />
                展开/折叠
            </Button>
        </div>

        <!-- 树形表格 -->
        <Table :columns="columns" :data-source="treeData" :loading="loading" row-key="deptId" :pagination="false"
            :expanded-row-keys="expandedRowKeys" @expand="onExpand" :expand-row-by-click="false"
            class="dept-manager-table">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'deptName'">
                    <span class="cell-content">{{ record.deptName }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                    <span class="cell-content">
                        <Tag :color="record.status === '0' ? 'processing' : 'default'">
                            {{ record.status === '0' ? '正常' : '停用' }}
                        </Tag>
                    </span>
                </template>
                <template v-else-if="column.key === 'action'">
                    <span class="cell-content cell-action">
                        <Button type="link" class="p-0" @click="handleEdit(record as DeptTreeNode)">
                            <IconifyIcon icon="ep:edit" class="mr-1 align-middle" />
                            修改
                        </Button>
                        <Button type="link" class="p-0" @click="handleAddChild(record as DeptTreeNode)">
                            <IconifyIcon icon="material-symbols:add" class="mr-1 align-middle" />
                            新增
                        </Button>
                        <Popconfirm title="是否确认删除该部门?" ok-text="确认" cancel-text="取消"
                            @confirm="handleDelete(record as DeptTreeNode)">
                            <Button danger type="link" class="p-0">
                                <IconifyIcon icon="material-symbols:delete-outline" class="mr-1 align-middle" />
                                删除
                            </Button>
                        </Popconfirm>
                    </span>
                </template>
            </template>
        </Table>
        <DeptModal />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { Table, Input, Select, Button, Tag, Popconfirm } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { useVbenModal } from '@vben/common-ui';
import { getDeptList, deleteDept } from '#/api';
import type { DeptApi } from '#/api';
import deptModal from './modules/deptModal.vue';

const [DeptModal, modalApi] = useVbenModal({
    connectedComponent: deptModal,
});

type DeptItem = DeptApi.DeptItem;
type DeptTreeNode = DeptApi.DeptTreeNode;

const loading = ref(false);
const rawList = ref<DeptItem[]>([]);
const expandedRowKeys = ref<number[]>([]);
const expandAll = ref(true);

/** 当前查询条件（用于搜索、删除后刷新） */
const lastQueryParams = ref<{ deptName?: string; status?: string }>({});

const searchForm = ref({
    deptName: '',
    status: undefined as string | undefined,
});

const statusOptions = [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' },
];

/** 将扁平列表转为树形。根节点 = parentId===0 或 其父节点不在当前列表中（搜索时后端只返回匹配节点） */
function buildTree(list: DeptItem[]): DeptTreeNode[] {
    if (!list.length) return [];
    const idSet = new Set(list.map((i) => i.deptId));
    const roots = list
        .filter((item) => item.parentId === 0 || !idSet.has(item.parentId))
        .sort((a, b) => a.orderNum - b.orderNum);
    function attachChildren(parentId: number): DeptTreeNode[] {
        const children = list
            .filter((item) => item.parentId === parentId)
            .sort((a, b) => a.orderNum - b.orderNum)
            .map((item) => ({
                ...item,
                children: attachChildren(item.deptId),
            }));
        return children.map((node) => ({
            ...node,
            children: node.children!.length > 0 ? node.children : undefined,
        }));
    }
    return roots.map((node) => {
        const children = attachChildren(node.deptId);
        return {
            ...node,
            children: children.length > 0 ? children : undefined,
        };
    });
}

/** 表格数据：接口返回的扁平列表转树形 */
const treeData = computed(() => buildTree(rawList.value));

/** 收集所有可展开节点的 key（有 children 的节点） */
function getAllExpandableKeys(nodes: DeptTreeNode[]): number[] {
    const keys: number[] = [];
    function walk(items: DeptTreeNode[]) {
        for (const node of items) {
            if (node.children && node.children.length > 0) {
                keys.push(node.deptId);
                walk(node.children);
            }
        }
    }
    walk(nodes);
    return keys;
}

function toggleExpandAll() {
    expandAll.value = !expandAll.value;
    if (expandAll.value) {
        expandedRowKeys.value = getAllExpandableKeys(treeData.value);
    } else {
        expandedRowKeys.value = [];
    }
}

function onExpand(expanded: boolean, record: DeptTreeNode) {
    if (expanded) {
        expandedRowKeys.value = [...expandedRowKeys.value, record.deptId];
    } else {
        expandedRowKeys.value = expandedRowKeys.value.filter((k) => k !== record.deptId);
    }
}

const columns = [
    { title: '部门名称', dataIndex: 'deptName', key: 'deptName', width: 260, align: 'center' as const },
    { title: '排序', dataIndex: 'orderNum', key: 'orderNum', width: 100, align: 'center' as const },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120, align: 'center' as const },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 200, align: 'center' as const },
    { title: '操作', key: 'action', width: 240, fixed: 'right' as const, align: 'center' as const },
];

async function loadList(params?: { deptName?: string; status?: string }) {
    loading.value = true;
    try {
        const data = await getDeptList(params);
        const list = Array.isArray(data) ? data : ((data as any)?.rows ?? (data as any)?.data ?? []);
        rawList.value = Array.isArray(list) ? list : [];
        if (expandAll.value) {
            expandedRowKeys.value = getAllExpandableKeys(buildTree(rawList.value));
        }
    } catch (e: any) {
        message.error(e?.message || '加载部门列表失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    lastQueryParams.value = {
        deptName: searchForm.value.deptName?.trim() || undefined,
        status: searchForm.value.status,
    };
    loadList(lastQueryParams.value);
}

function handleReset() {
    searchForm.value = { deptName: '', status: undefined };
    lastQueryParams.value = {};
    loadList();
}

// 顶部“新增”：打开弹框，上级部门在弹框内可选（可操作的下拉）
function handleAdd() {
    modalApi.setData({
        addType: 'top',
        deptTreeOptions: treeData.value,
        onSuccess: () => loadList(lastQueryParams.value),
    });
    modalApi.open();
}

// 行内“新增”：当前行作为上级部门，弹框内上级部门为禁用下拉
function handleAddChild(parent: DeptTreeNode) {
    modalApi.setData({
        addType: 'row',
        parent,
        deptTreeOptions: treeData.value,
        onSuccess: () => loadList(lastQueryParams.value),
    });
    modalApi.open();
}

function handleEdit(record: DeptTreeNode) {
    modalApi.setData({
        record,
        deptTreeOptions: treeData.value,
        onSuccess: () => loadList(lastQueryParams.value),
    });
    modalApi.open();
}

async function handleDelete(record: DeptTreeNode) {
    try {
        const res = await deleteDept(record.deptId) as { code?: number; msg?: string };
        if (res?.code === 200) {
            message.success(res?.msg ?? '删除成功');
            await loadList(lastQueryParams.value);
        } else {
            message.error(res?.msg ?? '删除失败');
        }
    } catch (e: any) {
        message.error(e?.message ?? '删除失败');
    }
}

onMounted(() => {
    loadList();
});
</script>

<style scoped>
/* 顶部「新增」：浅蓝色主按钮 */
.btn-add-dept.ant-btn-primary {
    background-color: #40a9ff;
    border-color: #40a9ff;
}

.btn-add-dept.ant-btn-primary:hover {
    background-color: #69c0ff;
    border-color: #69c0ff;
}

/* 顶部「展开/折叠」：灰色次要按钮 */
.btn-expand-toggle.ant-btn {
    color: rgba(0, 0, 0, 0.65);
    border-color: #d9d9d9;
    background: #fff;
}

.btn-expand-toggle.ant-btn:hover {
    color: #40a9ff;
    border-color: #40a9ff;
    background: #fff;
}

/* 表格单元格间距与居中 */
.dept-manager-table :deep(.ant-table-thead > tr > th),
.dept-manager-table :deep(.ant-table-tbody > tr > td) {
    padding: 14px 20px;
    text-align: center;
}

.dept-manager-table :deep(.ant-table-thead > tr > th) {
    font-weight: 600;
    background: #fafafa;
}

.cell-content {
    display: inline-block;
    text-align: center;
}

.cell-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}
</style>

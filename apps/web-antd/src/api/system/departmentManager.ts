import { requestClient } from '#/api/request';

export namespace DeptApi {
  /** 部门项（接口返回的扁平结构） */
  export interface DeptItem {
    deptId: number;
    parentId: number;
    ancestors?: string;
    deptName: string;
    orderNum: number;
    leader?: string;
    phone?: string;
    email?: string;
    status: string;
    delFlag?: string;
    createBy?: string;
    createTime: string;
    updateBy?: string | null;
    updateTime?: string | null;
    remarks?: string | null;
    parentName?: string | null;
    children?: DeptTreeNode[];
  }

  /** 树节点（含 children 用于表格树形展示） */
  export interface DeptTreeNode extends DeptItem {
    children?: DeptTreeNode[];
  }
}

/**
 * 获取部门列表（支持按部门名称、状态筛选）
 * GET /api/dept/list，可选参数：deptName、status
 */
async function getDeptList(params?: { deptName?: string; status?: string }) {
  return requestClient.get<DeptApi.DeptItem[]>('/api/dept/list', { params });
}

/**
 * 删除部门
 * DELETE /api/dept/{deptId}
 */
async function deleteDept(deptId: number) {
  return requestClient.delete(`/api/dept/${deptId}`, { responseReturn: 'body' });
}

/** 新增/编辑请求体：与列表字段一致，树形通过 parentId 关联（新增不传 deptId，编辑必传） */
export interface DeptSaveBody {
  deptId?: number;
  parentId: number;
  deptName: string;
  orderNum?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status?: string;
  remarks?: string;
  /** 后端可能用，可选 */
  ancestors?: string;
  parentName?: string;
  [key: string]: any;
}

/** 新增部门 POST /api/dept/add，parentId=0 表示顶级 */
async function addDept(body: DeptSaveBody) {
  return requestClient.post('/api/dept/add', body, { responseReturn: 'body' });
}

/** 编辑部门 PUT /api/dept/edit，需传 deptId */
async function editDept(body: DeptSaveBody) {
  return requestClient.put('/api/dept/edit', body, { responseReturn: 'body' });
}

/**
 * 获取部门详情
 * GET /api/dept/{deptId}
 */
async function getDeptById(deptId: number | string) {
  return requestClient.get<DeptApi.DeptItem>(`/api/dept/${deptId}`, {
    responseReturn: 'body',
  });
}

export { getDeptList, deleteDept, addDept, editDept, getDeptById };

import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

// 模拟真实的部门数据结构
function generateMockDataList() {
  return [
    {
      deptId: 1,
      parentId: 0,
      ancestors: '0',
      deptName: '总公司',
      orderNum: 1,
      leader: '总经理',
      phone: '13800138000',
      email: 'admin@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 2,
      parentId: 1,
      ancestors: '0,1',
      deptName: '仓储中心',
      orderNum: 1,
      leader: '仓储经理',
      phone: '13800138001',
      email: 'warehouse@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 3,
      parentId: 1,
      ancestors: '0,1',
      deptName: '运营中心',
      orderNum: 2,
      leader: '运营经理',
      phone: '13800138002',
      email: 'operation@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 4,
      parentId: 1,
      ancestors: '0,1',
      deptName: '财务中心',
      orderNum: 3,
      leader: '财务经理',
      phone: '13800138003',
      email: 'finance@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 5,
      parentId: 1,
      ancestors: '0,1',
      deptName: '质量中心',
      orderNum: 4,
      leader: '质量经理',
      phone: '13800138004',
      email: 'qc@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 6,
      parentId: 2,
      ancestors: '0,1,2',
      deptName: '入库组',
      orderNum: 1,
      leader: '入库主管',
      phone: '13800138005',
      email: 'inbound@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 7,
      parentId: 2,
      ancestors: '0,1,2',
      deptName: '出库组',
      orderNum: 2,
      leader: '出库主管',
      phone: '13800138006',
      email: 'outbound@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 8,
      parentId: 2,
      ancestors: '0,1,2',
      deptName: '库存组',
      orderNum: 3,
      leader: '库存主管',
      phone: '13800138007',
      email: 'inventory@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 9,
      parentId: 3,
      ancestors: '0,1,3',
      deptName: '订单组',
      orderNum: 1,
      leader: '订单主管',
      phone: '13800138008',
      email: 'order@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
    {
      deptId: 10,
      parentId: 3,
      ancestors: '0,1,3',
      deptName: '客服组',
      orderNum: 2,
      leader: '客服主管',
      phone: '13800138009',
      email: 'service@wms.com',
      status: '0',
      createTime: '2026-03-12 00:53:48',
    },
  ];
}

const mockData = generateMockDataList();

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const listData = structuredClone(mockData);

  // 返回符合前端期望的格式 {total, rows}
  return useResponseSuccess({
    total: listData.length,
    rows: listData,
  });
});

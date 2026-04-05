import { e as eventHandler, u as unAuthorizedResponse, a as useResponseSuccess } from '../../../../nitro/nitro.mjs';
import { v as verifyAccessToken } from '../../../../_/jwt-utils.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'jsonwebtoken';
import '../../../../_/mock-data.mjs';

function generateMockDataList() {
  return [
    {
      deptId: 1,
      parentId: 0,
      ancestors: "0",
      deptName: "\u603B\u516C\u53F8",
      orderNum: 1,
      leader: "\u603B\u7ECF\u7406",
      phone: "13800138000",
      email: "admin@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 2,
      parentId: 1,
      ancestors: "0,1",
      deptName: "\u4ED3\u50A8\u4E2D\u5FC3",
      orderNum: 1,
      leader: "\u4ED3\u50A8\u7ECF\u7406",
      phone: "13800138001",
      email: "warehouse@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 3,
      parentId: 1,
      ancestors: "0,1",
      deptName: "\u8FD0\u8425\u4E2D\u5FC3",
      orderNum: 2,
      leader: "\u8FD0\u8425\u7ECF\u7406",
      phone: "13800138002",
      email: "operation@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 4,
      parentId: 1,
      ancestors: "0,1",
      deptName: "\u8D22\u52A1\u4E2D\u5FC3",
      orderNum: 3,
      leader: "\u8D22\u52A1\u7ECF\u7406",
      phone: "13800138003",
      email: "finance@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 5,
      parentId: 1,
      ancestors: "0,1",
      deptName: "\u8D28\u91CF\u4E2D\u5FC3",
      orderNum: 4,
      leader: "\u8D28\u91CF\u7ECF\u7406",
      phone: "13800138004",
      email: "qc@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 6,
      parentId: 2,
      ancestors: "0,1,2",
      deptName: "\u5165\u5E93\u7EC4",
      orderNum: 1,
      leader: "\u5165\u5E93\u4E3B\u7BA1",
      phone: "13800138005",
      email: "inbound@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 7,
      parentId: 2,
      ancestors: "0,1,2",
      deptName: "\u51FA\u5E93\u7EC4",
      orderNum: 2,
      leader: "\u51FA\u5E93\u4E3B\u7BA1",
      phone: "13800138006",
      email: "outbound@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 8,
      parentId: 2,
      ancestors: "0,1,2",
      deptName: "\u5E93\u5B58\u7EC4",
      orderNum: 3,
      leader: "\u5E93\u5B58\u4E3B\u7BA1",
      phone: "13800138007",
      email: "inventory@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 9,
      parentId: 3,
      ancestors: "0,1,3",
      deptName: "\u8BA2\u5355\u7EC4",
      orderNum: 1,
      leader: "\u8BA2\u5355\u4E3B\u7BA1",
      phone: "13800138008",
      email: "order@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    },
    {
      deptId: 10,
      parentId: 3,
      ancestors: "0,1,3",
      deptName: "\u5BA2\u670D\u7EC4",
      orderNum: 2,
      leader: "\u5BA2\u670D\u4E3B\u7BA1",
      phone: "13800138009",
      email: "service@wms.com",
      status: "0",
      createTime: "2026-03-12 00:53:48"
    }
  ];
}
const mockData = generateMockDataList();
const list = eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const listData = structuredClone(mockData);
  return useResponseSuccess({
    total: listData.length,
    rows: listData
  });
});

export { list as default };
//# sourceMappingURL=list.mjs.map

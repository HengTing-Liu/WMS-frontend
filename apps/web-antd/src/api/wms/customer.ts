/**
 * 客户管理 API (WMS 模块)
 * 暂用 sys 模块 API，后续可替换为 wms 专用接口
 */
export {
  listCustomerPage,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  exportCustomer,
  type CustomerQuery,
  type CustomerResult,
} from '#/api/sys/customer';

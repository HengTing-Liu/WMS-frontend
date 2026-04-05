import type { RouteRecordRaw } from 'vue-router';

import adjustRoutes from './adjust';
import sysRoutes from './sys';
import deliveryRoutes from './delivery';
import foreignRoutes from './foreign';
import inboundRoutes from './inbound';
import outboundRoutes from './outbound';
import outOrderRoutes from './out-order';
import pickupRoutes from './pickup';
import qcRoutes from './qc';
import queryRoutes from './query';
import transitRoutes from './transit';

const routes: RouteRecordRaw[] = [
  ...sysRoutes,
  ...queryRoutes,
  ...inboundRoutes,
  ...outboundRoutes,
  ...adjustRoutes,
  ...qcRoutes,
  ...pickupRoutes,
  ...outOrderRoutes,
  ...transitRoutes,
  ...foreignRoutes,
  ...deliveryRoutes,
];

export default routes;

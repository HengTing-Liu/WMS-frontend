import { e as eventHandler, c as unAuthorizedResponse, f as useResponseSuccess } from '../../../_/nitro.mjs';
import { v as verifyAccessToken } from '../../../_/jwt-utils.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:url';
import 'node:path';
import 'node:crypto';
import 'jsonwebtoken';
import '../../../_/mock-data.mjs';

const info = eventHandler((event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  return useResponseSuccess(userinfo);
});

export { info as default };
//# sourceMappingURL=info.mjs.map

import { e as eventHandler, o as getQuery, h as setResponseStatus, i as useResponseError } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:url';
import 'node:path';
import 'node:crypto';

const status = eventHandler((event) => {
  const { status } = getQuery(event);
  setResponseStatus(event, Number(status));
  return useResponseError(`${status}`);
});

export { status as default };
//# sourceMappingURL=status.mjs.map

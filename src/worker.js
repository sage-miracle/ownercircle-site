import { handleSubmit, handleOptions as handleSubmitOptions } from '../functions/api/submit.js';
import { handleApply, handleOptions as handleApplyOptions } from '../functions/api/apply.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/submit') {
      if (request.method === 'OPTIONS') {
        return handleSubmitOptions(request);
      }
      return handleSubmit(request, env);
    }

    if (url.pathname === '/api/apply') {
      if (request.method === 'OPTIONS') {
        return handleApplyOptions(request);
      }
      return handleApply(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

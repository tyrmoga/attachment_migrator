import Odoo from 'odoo-xmlrpc';

export function createClient(config) {
  const client = new Odoo(config);

  client.connect((err) => {
    if (err) {
      console.error(`Failed to connect to Odoo at ${config.url} — server will run without Odoo connectivity`, err);
    } else {
      console.log(`Connected to Odoo at ${config.url}`);
    }
  });

  function executeOdoo(model, method, params, kwargs) {
    const mergedParams = kwargs ? [...params, kwargs] : params;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(Object.assign(new Error('Odoo request timed out'), { code: 'ODOO_TIMEOUT' }));
      }, 25_000);

      client.execute_kw(model, method, mergedParams, (err, result) => {
        clearTimeout(timer);
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  async function executeOdooWithRetry(model, method, params, kwargs, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await executeOdoo(model, method, params, kwargs);
      } catch (err) {
        const isRetryable = err.code === 'ODOO_TIMEOUT' || err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED';
        if (!isRetryable || attempt === retries) throw err;
        const base = Math.pow(2, attempt - 1) * 1000;
        const jitter = base * 0.2 * (Math.random() * 2 - 1);
        await new Promise(r => setTimeout(r, base + jitter));
      }
    }
  }

  return { client, executeOdoo, executeOdooWithRetry };
}

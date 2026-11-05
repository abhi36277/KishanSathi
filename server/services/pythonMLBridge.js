import http from 'http';

const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://localhost:8000';

/**
 * Communicates with the Python ML FastAPI microservice on port 8000
 */
export async function callPythonML(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(PYTHON_ML_URL + path);
      const reqHeaders = { 'Content-Type': 'application/json' };
      let postData = null;

      if (body) {
        postData = JSON.stringify(body);
        reqHeaders['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request({
        hostname: url.hostname,
        port: url.port || 8000,
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
        timeout: 4000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ success: true, data: JSON.parse(data) });
            } catch (e) {
              resolve({ success: false, error: 'JSON parse error' });
            }
          } else {
            resolve({ success: false, status: res.statusCode });
          }
        });
      });

      req.on('error', () => {
        resolve({ success: false, offline: true });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, timeout: true });
      });

      if (postData) req.write(postData);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

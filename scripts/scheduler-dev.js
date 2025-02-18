const http = require('http');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSchedulerLoop() {
  while (true) {
    try {
      const req = http.get('http://localhost:3000/api/scheduler', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(new Date().toISOString(), '- Scheduler check:', data);
        });
      });

      req.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          console.log('Waiting for dev server to start...');
        } else {
          console.error('Scheduler error:', error);
        }
      });

      await sleep(60000); // Wait 1 minute
    } catch (error) {
      console.error('Loop error:', error);
      await sleep(5000); // Wait 5 seconds on error before retrying
    }
  }
}

runSchedulerLoop(); 
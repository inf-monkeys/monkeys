const yaml = require('yaml');
const fs = require('fs');
const path = require('path');
const { configure, getLogger } = require('log4js');
const httpProxy = require('http-proxy');
const http = require('http');
const { fork, exec } = require('child_process');
const util = require('util');

const proxy = httpProxy.createProxyServer({});
const execAsync = util.promisify(exec);

configure({
  appenders: {
    stdout: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: '[%d{ISO8601_WITH_TZ_OFFSET}] %p %c %f:%l  %m',
      },
    },
  },
  categories: { default: { appenders: ['stdout'], level: 'ALL' } },
});

const logger = getLogger('default');

const MONKEYS_DIST_FOLDER = process.env.MONKEYS_DIST_FOLDER || 'dist';

// Read configuration from `config.yaml`
let config;
try {
  config = yaml.parse(fs.readFileSync(path.join(__dirname, './config.yaml'), 'utf8'));
} catch (e) {
  console.error('Failed to load configuration:', e);
  process.exit(1);
}

const servers = config.servers;
if (!servers.length) {
  console.error('No servers found in configuration');
  process.exit(1);
}

// Generate configuration files for each server
const serverHostToPortMap = {};
const startPort = 8000;
const serverConfigYamls = servers.map((server, index) => {
  const { appId, host, ...rest } = server;
  const port = startPort + index;
  serverHostToPortMap[host] = port;
  return yaml.stringify({
    ...config,
    server: {
      appId,
      port,
      ...rest,
    },
    servers: undefined,
  });
});
serverConfigYamls.map((yaml, index) => {
  fs.writeFileSync(path.resolve(__dirname, `./server-${index}.yaml`), yaml);
});

const appProcessList = [];
const status = {
  running: true,
};

async function runCommand(path, command, envVars = {}) {
  try {
    // 合并当前进程环境变量和传入的环境变量
    const env = { ...process.env, ...envVars };

    // 设置执行路径和环境变量，并执行命令行指令
    const { stdout, stderr } = await execAsync(command, { cwd: path, env });

    // 如果 stderr 不为空，则返回错误信息
    if (stderr) {
      return `Error: ${stderr}`;
    }

    // 返回正常输出结果
    return stdout;
  } catch (error) {
    // 如果出现错误，返回错误信息
    return `Execution Error: ${error.message}`;
  }
}

// Start servers
const startServers = async () => {
  logger.info('Starting servers with config: %s', JSON.stringify(servers));
  for (let i = 0; i < serverConfigYamls.length; i++) {
    // Get configuration file
    const configFile = path.resolve(__dirname, `./server-${i}.yaml`);

    // Run migration
    const migrationResult = await runCommand(MONKEYS_DIST_FOLDER, `yarn migration:run`, {
      MONKEYS_CONFIG_FILE: configFile,
    });
    logger.info(`Migration result for app ${i}: ${migrationResult}`);

    // Start server
    const script = `${MONKEYS_DIST_FOLDER}/main`;
    const args = ['--config', configFile];
    let child = fork(script, args, {});
    const autoRestart = (code, signal) => {
      if (!status.running) {
        return;
      }
      logger.info(`App ${i} exited with code ${code} and signal ${signal}`);
      const index = appProcessList.indexOf(child);
      if (index !== -1) {
        appProcessList.splice(index, 1);
      }
      child = fork(script, args, {});
      child.on('exit', autoRestart);
      appProcessList.push(child);
    };
    child.on('exit', autoRestart);
  }
  signalHandler = () => {
    status.running = false;
    for (const appProcess of appProcessList) {
      appProcess.kill('SIGTERM');
    }
    process.exit(0);
  };
  process.on('SIGTERM', signalHandler);
  process.on('SIGINT', signalHandler);
};

// Run proxy server
const runPorxyServer = (port) => {
  const httpServer = http.createServer((req, res) => {
    const host = req.headers.host;
    const targetServerPort = serverHostToPortMap[host];
    if (!targetServerPort) {
      logger.warn(`Domain not found in configuration: ${host}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const serverUrl = `http://127.0.0.1:${targetServerPort}`;
    logger.info(`Request for ${host} ${req.url} -> ${serverUrl}`);
    // 转发 http 请求
    proxy.web(req, res, { target: serverUrl }, (err, req, res) => {
      logger.warn(err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('');
    });
  });
  httpServer.listen(port);
};

const main = async () => {
  startServers();
  runPorxyServer(3000);
};

main()
  .then(() => {
    console.log('All servers started.');
  })
  .catch((e) => {
    console.error('Failed to start servers:', e);
    process.exit(1);
  });

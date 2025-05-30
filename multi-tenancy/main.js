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
let configFilePath = path.join(__dirname, './config.yaml');
if (fs.existsSync(configFilePath)) {
  configFilePath = configFilePath;
} else if (fs.existsSync('/etc/monkeys/config.yaml')) {
  configFilePath = '/etc/monkeys/config.yaml';
} else {
  console.error('Configuration file not found');
  process.exit(1);
}

let config;
try {
  config = yaml.parse(fs.readFileSync(configFilePath, 'utf8'));
} catch (e) {
  console.error('Failed to load configuration:', e);
  process.exit(1);
}

const port = process.env.PORT || config.port || 3000;

const servers = config.servers;
if (!servers.length) {
  console.error('No servers found in configuration');
  process.exit(1);
}

// Generate configuration files for each server
const serverHostToPortMap = {};
const startPort = 8000;
const serverConfigYamls = servers.map((server, index) => {
  const { appId, host, auth, paymentServer, ...rest } = server;
  const port = startPort + index;
  serverHostToPortMap[host] = port;
  const serverConfig = {
    ...config,
    server: {
      appId,
      port,
      ...rest,
    },
    servers: undefined,
  };

  // Override auth configuration
  if (auth) {
    serverConfig.auth = auth;
  }

  if (paymentServer) {
    serverConfig.paymentServer = paymentServer;
  }

  return yaml.stringify(serverConfig);
});
serverConfigYamls.map((yaml, index) => {
  fs.writeFileSync(path.resolve(__dirname, `./server-${index}.yaml`), yaml);
});

const appProcessList = [];
const status = {
  running: true,
};

async function runCommand(path, command, envVars = {}) {
  return new Promise((resolve, reject) => {
    // 分解命令为主命令和参数
    const [cmd, ...args] = command.split(' ');
    
    // 设置环境变量，添加调试相关的环境变量
    const env = {
      ...process.env,
      ...envVars,
      TYPEORM_LOGGING: "all",
      TYPEORM_LOGGER: "advanced-console",
      DEBUG: "typeorm:*,typeorm-model-shim",
      NODE_DEBUG: "typeorm,postgres"
    };

    logger.info(`Executing command: ${command} in path: ${path}`);
    logger.debug(`Environment variables:`, env);

    // 使用 spawn 替代 exec 以获取实时输出
    const childProcess = require('child_process').spawn(cmd, args, {
      cwd: path,
      env,
      shell: true,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    // 捕获标准输出
    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      logger.info(`[Command Output] ${output.trim()}`);
    });

    // 捕获标准错误
    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      logger.error(`[Command Error] ${output.trim()}`);
    });

    // 进程结束时的处理
    childProcess.on('close', (code) => {
      if (code === 0) {
        logger.info(`Command completed successfully`);
        resolve({
          success: true,
          stdout,
          stderr,
          code
        });
      } else {
        logger.error(`Command failed with code ${code}`);
        reject({
          success: false,
          stdout,
          stderr,
          code,
          error: new Error(`Command failed with code ${code}`)
        });
      }
    });

    // 处理进程错误
    childProcess.on('error', (error) => {
      logger.error(`Command execution error:`, error);
      reject({
        success: false,
        stdout,
        stderr,
        error
      });
    });
  });
}

// Start servers
const startServers = async () => {
  logger.info('Starting servers with config: %s', JSON.stringify(servers));
  for (let i = 0; i < serverConfigYamls.length; i++) {
    try {
      // 获取配置文件
      const configFile = path.resolve(__dirname, `./server-${i}.yaml`);
      logger.info(`Processing server ${i} with config file: ${configFile}`);

      // 运行迁移
      logger.info(`Starting migration for server ${i}...`);
      try {
        const migrationResult = await runCommand(
          MONKEYS_DIST_FOLDER, 
          `yarn migration:run --verbose`, // 添加 --verbose 参数
          {
            MONKEYS_CONFIG_FILE: configFile,
          }
        );
        
        // 详细记录迁移结果
        if (migrationResult.success) {
          logger.info(`Migration successful for app ${i}`);
          logger.debug(`Migration output:\n${migrationResult.stdout}`);
        } else {
          logger.error(`Migration failed for app ${i}`);
          logger.error(`Migration error output:\n${migrationResult.stderr}`);
        }
      } catch (migrationError) {
        logger.error(`Migration error for app ${i}:`, migrationError);
        logger.error(`Migration stdout:\n${migrationError.stdout}`);
        logger.error(`Migration stderr:\n${migrationError.stderr}`);
        // 如果迁移失败，继续处理下一个服务器
        continue;
      }

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
    } catch (error) {
      logger.error(`Error processing server ${i}:`, error);
    }
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
  runPorxyServer(port);
};

main()
  .then(() => {
    console.log('All servers started.');
  })
  .catch((e) => {
    console.error('Failed to start servers:', e);
    process.exit(1);
  });

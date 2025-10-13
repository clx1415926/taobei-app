// Jest测试环境设置
const database = require('../src/config/database');

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局测试设置
beforeAll(async () => {
  // 确保使用测试数据库
  await database.connect();
});

afterAll(async () => {
  // 清理测试数据库连接
  await database.close();
});

// 增加测试超时时间
jest.setTimeout(10000);

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 抑制控制台输出（可选）
if (process.env.SUPPRESS_LOGS === 'true') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
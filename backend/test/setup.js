const path = require('path');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(__dirname, '../database/test.db');
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// 测试超时设置
jest.setTimeout(10000);

// 全局测试钩子
beforeAll(async () => {
  // 初始化测试数据库
  console.log('Setting up test database...');
});

afterAll(async () => {
  // 清理测试数据库
  console.log('Cleaning up test database...');
});

beforeEach(async () => {
  // 每个测试前的清理工作
});

afterEach(async () => {
  // 每个测试后的清理工作
  const Database = require('better-sqlite3');
  const path = require('path');
  
  const dbPath = path.join(__dirname, '../database/test.db');
  const db = new Database(dbPath);
  
  try {
    // 按照外键依赖关系的正确顺序删除数据
    db.exec('DELETE FROM user_sessions');
    db.exec('DELETE FROM login_failures');
    db.exec('DELETE FROM verification_codes');
    db.exec('DELETE FROM users');
  } catch (error) {
    // 忽略清理错误
    console.log('清理数据时出错:', error.message);
  } finally {
    db.close();
  }
});
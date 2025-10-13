const User = require('../../src/models/User');
const database = require('../../src/config/database');

describe('User Model', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    const db = database.getDatabase();
    await db.run('DELETE FROM users');
  });

  describe('findByPhone', () => {
    test('应该能够根据手机号找到已注册的用户', async () => {
      // 准备测试数据：创建一个用户
      const testPhone = '13800138000';
      const testUser = await User.create(testPhone);
      expect(testUser).not.toBeNull();

      // 测试查找功能
      const foundUser = await User.findByPhone(testPhone);
      
      // 验证返回的用户信息
      expect(foundUser).not.toBeNull();
      expect(foundUser.phoneNumber).toBe(testPhone);
      expect(foundUser.id).toBeDefined();
    });

    test('查找不存在的手机号应该返回null', async () => {
      const nonExistentPhone = '13999999999';
      
      const result = await User.findByPhone(nonExistentPhone);
      
      expect(result).toBeNull();
    });

    test('应该能够处理无效的手机号格式', async () => {
      const invalidPhone = 'invalid-phone';
      
      const result = await User.findByPhone(invalidPhone);
      
      expect(result).toBeNull();
    });

    test('应该能够处理空值输入', async () => {
      const result1 = await User.findByPhone(null);
      const result2 = await User.findByPhone(undefined);
      const result3 = await User.findByPhone('');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('create', () => {
    test('应该能够创建新用户', async () => {
      const testPhone = '13800138001';
      
      const newUser = await User.create(testPhone);
      
      expect(newUser).not.toBeNull();
      expect(newUser.phoneNumber).toBe(testPhone);
      expect(newUser.id).toBeDefined();
      
      // 验证用户确实被保存到数据库
      const foundUser = await User.findByPhone(testPhone);
      expect(foundUser).not.toBeNull();
      expect(foundUser.phoneNumber).toBe(testPhone);
    });

    test('不应该允许创建重复手机号的用户', async () => {
      const testPhone = '13800138002';
      
      // 创建第一个用户
      const firstUser = await User.create(testPhone);
      expect(firstUser).not.toBeNull();
      
      // 尝试创建相同手机号的用户应该失败
      await expect(User.create(testPhone)).rejects.toThrow();
    });
  });
});
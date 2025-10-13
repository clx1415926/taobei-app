const VerificationCode = require('../../src/models/VerificationCode');
const database = require('../../src/config/database');

describe('VerificationCode Model', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    const db = database.getDatabase();
    await db.run('DELETE FROM verification_codes');
  });

  describe('store', () => {
    test('应该能够存储验证码并设置60秒过期时间', async () => {
      const testPhone = '13800138000';
      const testCode = '123456';
      
      const result = await VerificationCode.store(testPhone, testCode);
      
      expect(result).toBe(true);
      
      // 验证验证码确实被存储
      const db = database.getDatabase();
      const stored = await db.get(
        'SELECT * FROM verification_codes WHERE phone_number = ?',
        [testPhone]
      );
      
      expect(stored).not.toBeNull();
      expect(stored.code).toBe(testCode);
      expect(stored.phone_number).toBe(testPhone);
      
      // 验证过期时间设置正确（应该是当前时间+60秒）
      const now = Date.now();
      const expiresAt = new Date(stored.expires_at).getTime();
      const timeDiff = expiresAt - now;
      expect(timeDiff).toBeGreaterThan(55000); // 至少55秒
      expect(timeDiff).toBeLessThan(65000); // 最多65秒
    });

    test('存储新验证码应该覆盖同一手机号的旧验证码', async () => {
      const testPhone = '13800138001';
      const oldCode = '111111';
      const newCode = '222222';
      
      // 存储第一个验证码
      await VerificationCode.store(testPhone, oldCode);
      
      // 存储第二个验证码
      await VerificationCode.store(testPhone, newCode);
      
      // 验证只有最新的验证码存在
      const db = database.getDatabase();
      const codes = await db.all(
        'SELECT * FROM verification_codes WHERE phone_number = ?',
        [testPhone]
      );
      
      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe(newCode);
    });

    test('应该能够处理无效输入', async () => {
      const result1 = await VerificationCode.store(null, '123456');
      const result2 = await VerificationCode.store('13800138000', null);
      const result3 = await VerificationCode.store('', '123456');
      const result4 = await VerificationCode.store('13800138000', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      expect(result4).toBe(false);
    });
  });

  describe('verify', () => {
    test('应该能够验证正确且未过期的验证码', async () => {
      const testPhone = '13800138002';
      const testCode = '654321';
      
      // 先存储验证码
      await VerificationCode.store(testPhone, testCode);
      
      // 验证验证码
      const result = await VerificationCode.verify(testPhone, testCode);
      
      expect(result).toBe(true);
    });

    test('验证错误的验证码应该返回false', async () => {
      const testPhone = '13800138003';
      const correctCode = '123456';
      const wrongCode = '654321';
      
      // 存储正确的验证码
      await VerificationCode.store(testPhone, correctCode);
      
      // 验证错误的验证码
      const result = await VerificationCode.verify(testPhone, wrongCode);
      
      expect(result).toBe(false);
    });

    test('验证不存在的手机号应该返回false', async () => {
      const nonExistentPhone = '13999999999';
      const testCode = '123456';
      
      const result = await VerificationCode.verify(nonExistentPhone, testCode);
      
      expect(result).toBe(false);
    });

    test('验证过期的验证码应该返回false', async () => {
      const testPhone = '13800138004';
      const testCode = '789012';
      
      // 手动插入一个过期的验证码
      const db = database.getDatabase();
      const expiredTime = new Date(Date.now() - 1000); // 1秒前过期
      await db.run(
        'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES (?, ?, ?)',
        [testPhone, testCode, expiredTime.toISOString()]
      );
      
      // 验证过期的验证码
      const result = await VerificationCode.verify(testPhone, testCode);
      
      expect(result).toBe(false);
    });

    test('应该能够处理无效输入', async () => {
      const result1 = await VerificationCode.verify(null, '123456');
      const result2 = await VerificationCode.verify('13800138000', null);
      const result3 = await VerificationCode.verify('', '123456');
      const result4 = await VerificationCode.verify('13800138000', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      expect(result4).toBe(false);
    });
  });

  describe('generateCode', () => {
    test('应该生成6位数字验证码', () => {
      const code = VerificationCode.generateCode();
      
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    test('生成的验证码应该是随机的', () => {
      const codes = new Set();
      
      // 生成100个验证码，应该有很高的概率不重复
      for (let i = 0; i < 100; i++) {
        codes.add(VerificationCode.generateCode());
      }
      
      // 至少应该有90%的验证码是不同的
      expect(codes.size).toBeGreaterThan(90);
    });
  });
});
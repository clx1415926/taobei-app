const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/config/database');
const User = require('../../src/models/User');
const VerificationCode = require('../../src/models/VerificationCode');

describe('Auth Routes', () => {
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
    await db.run('DELETE FROM verification_codes');
  });

  describe('POST /api/auth/send-verification-code', () => {
    test('应该能够为有效手机号发送验证码', async () => {
      const testPhone = '13800138000';
      
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: testPhone })
        .expect(200);
      
      expect(response.body).toHaveProperty('message', '验证码发送成功');
      expect(response.body).toHaveProperty('expiresIn', 60);
      
      // 验证验证码确实被存储到数据库
      const db = database.getDatabase();
      const stored = await db.get(
        'SELECT * FROM verification_codes WHERE phone_number = ?',
        [testPhone]
      );
      expect(stored).not.toBeNull();
      expect(stored.code).toMatch(/^\d{6}$/);
    });

    test('应该拒绝无效的手机号格式', async () => {
      const invalidPhones = [
        'invalid-phone',
        '123',
        '1234567890123',
        '',
        null
      ];
      
      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({ phoneNumber: phone })
          .expect(400);
        
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
      }
    });

    test('应该能够覆盖同一手机号的旧验证码', async () => {
      const testPhone = '13800138001';
      
      // 发送第一个验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: testPhone })
        .expect(200);
      
      // 发送第二个验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: testPhone })
        .expect(200);
      
      // 验证只有一个验证码记录
      const db = database.getDatabase();
      const codes = await db.all(
        'SELECT * FROM verification_codes WHERE phone_number = ?',
        [testPhone]
      );
      expect(codes).toHaveLength(1);
    });

    test('缺少phoneNumber参数应该返回400错误', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
    });
  });

  describe('POST /api/auth/login', () => {
    test('应该能够让已注册用户使用正确验证码登录', async () => {
      const testPhone = '13800138002';
      const testCode = '123456';
      
      // 创建用户
      const user = await User.create(testPhone);
      
      // 存储验证码
      await VerificationCode.store(testPhone, testCode);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: testPhone,
          verificationCode: testCode
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('userId', user.id);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    test('未注册的手机号应该返回404错误', async () => {
      const unregisteredPhone = '13999999999';
      const testCode = '123456';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: unregisteredPhone,
          verificationCode: testCode
        })
        .expect(404);
      
      expect(response.body).toHaveProperty('error', '该手机号未注册，请先完成注册');
    });

    test('错误的验证码应该返回400错误', async () => {
      const testPhone = '13800138003';
      const correctCode = '123456';
      const wrongCode = '654321';
      
      // 创建用户
      await User.create(testPhone);
      
      // 存储正确的验证码
      await VerificationCode.store(testPhone, correctCode);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: testPhone,
          verificationCode: wrongCode
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', '验证码错误或已过期');
    });

    test('过期的验证码应该返回400错误', async () => {
      const testPhone = '13800138004';
      const testCode = '789012';
      
      // 创建用户
      await User.create(testPhone);
      
      // 手动插入过期的验证码
      const db = database.getDatabase();
      const expiredTime = new Date(Date.now() - 1000);
      await db.run(
        'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES (?, ?, ?)',
        [testPhone, testCode, expiredTime.toISOString()]
      );
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: testPhone,
          verificationCode: testCode
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', '验证码错误或已过期');
    });

    test('无效的手机号格式应该返回400错误', async () => {
      const invalidPhone = 'invalid-phone';
      const testCode = '123456';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: invalidPhone,
          verificationCode: testCode
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
    });

    test('缺少必要参数应该返回400错误', async () => {
      // 缺少phoneNumber
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ verificationCode: '123456' })
        .expect(400);
      
      expect(response1.body).toHaveProperty('error');
      
      // 缺少verificationCode
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber: '13800138000' })
        .expect(400);
      
      expect(response2.body).toHaveProperty('error');
      
      // 两个参数都缺少
      const response3 = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);
      
      expect(response3.body).toHaveProperty('error');
    });
  });
});
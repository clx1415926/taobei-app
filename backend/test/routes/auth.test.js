const request = require('supertest');
const app = require('../../src/app');

describe('Authentication API', () => {
  describe('POST /api/auth/send-verification-code', () => {
    it('应该验证手机号格式的正确性', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '123',
          type: 'login'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请输入正确的手机号码');
    });

    it('应该成功发送验证码给有效手机号', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          type: 'login'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('验证码已发送');
      expect(response.body.countdown).toBe(60);
    });

    it.skip('应该检查当日验证码获取次数限制（50次）', async () => {
      // 模拟已达到当日限制
      for (let i = 0; i < 51; i++) {
        await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '13800138099',
            type: 'login'
          });
      }

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138099',
          type: 'login'
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('今日获取验证码次数已达上限，请明天再试');
    });

    it.skip('应该检查IP访问频率限制', async () => {
      // 清理数据库确保测试环境干净
      const Database = require('better-sqlite3');
      const path = require('path');
      const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/test.db');
      const db = new Database(dbPath);
      
      // 确保表存在
      db.exec(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id TEXT PRIMARY KEY,
          phone_number TEXT NOT NULL,
          code TEXT NOT NULL,
          type TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT
        )
      `);
      
      db.exec('DELETE FROM verification_codes');
      db.close();

      // 第一个请求应该成功
      const firstResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138002',
          type: 'login'
        });

      console.log('First response status:', firstResponse.status);
      console.log('First response body:', firstResponse.body);
      expect(firstResponse.status).toBe(200);

      // 立即发送第二个请求应该被限制
      const secondResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138003', // 使用不同的手机号
          type: 'login'
        });
      console.log('Second response status:', secondResponse.status);
      console.log('Second response body:', secondResponse.body);
      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body.error).toBe('请求过于频繁，请稍后再试');
    });

    it('应该生成6位数字验证码并存储到数据库', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138003',
          type: 'login'
        });

      expect(response.status).toBe(200);
      // 验证码应该在数据库中存储，这里需要检查数据库记录
      // TODO: 添加数据库验证逻辑
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 先注册用户
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138020',
          type: 'register'
        });
      
      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138020',
          verificationCode: '123456',
          agreeToTerms: true
        });
      
      // 为登录测试准备验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138020',
          type: 'login'
        });
    });

    it('应该验证手机号和验证码的有效性', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '',
          verificationCode: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请输入手机号');
    });

    it('应该验证验证码不为空', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138020',
          verificationCode: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请输入验证码');
    });

    it('应该检查用户是否已注册', async () => {
      // 为未注册的手机号发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138999',
          type: 'login'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138999', // 未注册的手机号
          verificationCode: '123456'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('该手机号未注册，请先完成注册');
      expect(response.body.redirectUrl).toBe('/register');
    });

    it('应该验证验证码错误', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138020',
          type: 'login'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138020',
          verificationCode: '000000' // 错误的验证码
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('验证码错误或已过期，请重新获取');
    });

    it('应该成功登录并生成JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138020',
          verificationCode: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.userId).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.redirectUrl).toBe('/');
    });

    it.skip('应该实施IP登录失败次数限制', async () => {
      // 为注册发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          type: 'register'
        });

      // 先注册一个用户
      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '123456',
          agreeToTerms: true
        });

      // 多次失败登录
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '13800138000',
            type: 'login'
          });
          
        await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13800138000',
            verificationCode: '000000' // 错误的验证码
          });
      }

      // 再次尝试登录应该被限制
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          type: 'login'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '123456' // 即使是正确的验证码也应该被限制
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('登录失败次数过多，请15分钟后再试');
    });
  });

  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      // 为测试准备验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          type: 'register'
        });
      
      // 为新用户注册测试准备验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138001',
          type: 'register'
        });
      
      // 为过期验证码测试准备验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138002',
          type: 'register'
        });
    });

    it('应该验证所有必填字段的完整性', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '',
          verificationCode: '',
          agreeToTerms: false
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请输入正确的手机号码');
    });

    it('应该验证用户协议同意状态', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '123456',
          agreeToTerms: false
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请同意用户协议');
    });

    it('应该检查手机号是否已注册，如果已注册则直接登录', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138030',
          type: 'register'
        });

      // 先注册一次
      const firstRegisterResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138030',
          verificationCode: '123456',
          agreeToTerms: true
        });
      
      // 确保第一次注册成功
      expect(firstRegisterResponse.status).toBe(201);

      // 为第二次注册重新发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138030',
          type: 'register'
        });

      // 再次注册相同手机号
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138030',
          verificationCode: '123456',
          agreeToTerms: true
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('该手机号已注册，将直接为您登录');
      expect(response.body.userId).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.redirectUrl).toBe('/');
    });

    it('应该成功创建新用户并自动登录', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138040',
          type: 'register'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138040',
          verificationCode: '123456',
          agreeToTerms: true
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.userId).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.redirectUrl).toBe('/');
    });

    it('应该验证验证码已过期', async () => {
      // 直接在数据库中插入过期的验证码
      const Database = require('better-sqlite3');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../database/test.db');
      const db = new Database(dbPath);
      
      const { v4: uuidv4 } = require('uuid');
      const expiredTime = new Date(Date.now() - 10 * 60 * 1000); // 10分钟前过期
      
      db.prepare(`
        INSERT INTO verification_codes (id, phone_number, code, type, expires_at, used, created_at, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        '13800138003',
        '123456',
        'register',
        expiredTime.toISOString(),
        0,
        new Date().toISOString(),
        '127.0.0.1'
      );
      
      db.close();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138003',
          verificationCode: '123456',
          agreeToTerms: true
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('验证码错误或已过期，请重新获取');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // 先登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '123456'
        });
      authToken = loginResponse.body.token;
    });

    it('应该验证用户登录状态', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('未授权访问');
    });

    it('应该成功退出登录', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('退出登录成功');
    });
  });
});
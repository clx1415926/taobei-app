const request = require('supertest');
const app = require('../../src/app');

describe('Password Authentication API Tests', () => {
  
  // 在每个测试前创建测试用户
  beforeEach(async () => {
    // 发送验证码
    await request(app)
      .post('/api/auth/send-verification-code')
      .send({
        phoneNumber: '13800138000',
        type: 'register'
      });

    // 注册用户
    await request(app)
      .post('/api/auth/register')
      .send({
        phoneNumber: '13800138000',
        verificationCode: '123456',
        agreeToTerms: true
      });
  });
  
  // 测试用例1: API-POST-SetPassword - 密码设置功能
  describe('POST /api/auth/set-password', () => {
    it('应该成功设置用户密码', async () => {
      const response = await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      // 根据acceptanceCriteria，应该返回成功状态
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '密码设置成功');
    });

    it('应该拒绝弱密码', async () => {
      const response = await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('密码长度至少8位');
    });

    it('应该拒绝密码不一致的请求', async () => {
      const response = await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('两次输入的密码不一致');
    });
  });

  // 测试用例2: API-POST-LoginPassword - 密码登录功能
  describe('POST /api/auth/login-password', () => {
    beforeEach(async () => {
      // 在每个密码登录测试前先设置密码
      await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });
    });

    it('应该支持密码登录', async () => {
      const response = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!'
        });

      // 根据acceptanceCriteria，应该返回登录成功信息
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('phoneNumber', '13800138000');
    });

    it('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('密码错误');
    });

    it('应该在多次失败后锁定账户', async () => {
      // 连续5次错误密码尝试
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login-password')
          .send({
            phoneNumber: '13800138000',
            password: 'WrongPassword123!'
          });
      }

      const response = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(423);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('账户已被锁定');
    });
  });

  // 测试用例3: API-POST-ResetPassword - 密码重置功能
  describe('POST /api/auth/reset-password', () => {
    it('应该支持通过验证码重置密码', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          type: 'reset'
        });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '123456',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '密码重置成功');
    });

    it('应该验证验证码的有效性', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '000000',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('验证码无效');
    });
  });

  // 测试用例4: API-PUT-ChangePassword - 密码修改功能
  describe('PUT /api/auth/change-password', () => {
    it('应该支持修改现有密码', async () => {
      // 先设置密码
      await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '密码修改成功');
    });

    it('应该验证当前密码的正确性', async () => {
      // 先设置密码
      await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongCurrentPassword',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('当前密码错误');
    });

    it('应该防止使用历史密码', async () => {
      // 先设置密码
      await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'TestPassword123!', // 与当前密码相同
          confirmPassword: 'TestPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('新密码不能与历史密码相同');
    });
  });

  // 测试用例5: API-GET-PasswordStatus - 密码状态查询功能
  describe('GET /api/auth/password-status', () => {
    it('应该返回用户密码状态信息', async () => {
      // 先设置密码
      const setPasswordResponse = await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      console.log('Set password response status:', setPasswordResponse.status);
      console.log('Set password response body:', setPasswordResponse.body);

      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: '13800138000',
          password: 'TestPassword123!'
        });

      console.log('Login response status:', loginResponse.status);
      console.log('Login response body:', loginResponse.body);

      const token = loginResponse.body.token;
      console.log('Token:', token);

      const response = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${token}`);

      console.log('Password status response status:', response.status);
      console.log('Password status response body:', response.body);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPassword');
      expect(response.body).toHaveProperty('passwordSetTime');
      expect(response.body).toHaveProperty('passwordUpdateTime');
      expect(response.body).toHaveProperty('needPasswordUpdate');
    });

    it('应该正确识别未设置密码的用户', async () => {
      // 通过验证码登录获取token
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          type: 'login'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          verificationCode: '123456'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPassword', false);
      expect(response.body).toHaveProperty('passwordSetTime', null);
      expect(response.body).toHaveProperty('needPasswordUpdate', false);
    });
  });
});
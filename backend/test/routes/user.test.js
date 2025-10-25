const request = require('supertest');
const app = require('../../src/app');

describe('User API', () => {
  let authToken;

  beforeEach(async () => {
    // 为每个测试准备登录状态
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '13800138000',
        verificationCode: '123456'
      });
    
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
    }
  });

  describe('GET /api/user/profile', () => {
    it('应该验证用户登录状态', async () => {
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('未授权访问');
    });

    it('应该返回用户基本信息', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBeDefined();
      expect(response.body.phoneNumber).toBeDefined();
      expect(response.body.registerTime).toBeDefined();
      expect(response.body.lastLoginTime).toBeDefined();
      
      expect(typeof response.body.userId).toBe('string');
      expect(typeof response.body.phoneNumber).toBe('string');
      expect(typeof response.body.registerTime).toBe('string');
    });

    it('应该对手机号进行脱敏处理', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.phoneNumber).toBeDefined();
      
      // 检查手机号是否已脱敏（例如：138****8000）
      const phoneNumber = response.body.phoneNumber;
      expect(phoneNumber).toMatch(/^\d{3}\*{4}\d{4}$/);
    });

    it('应该返回有效的时间格式', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // 验证时间格式是否为有效的ISO字符串
      const registerTime = new Date(response.body.registerTime);
      expect(registerTime).toBeInstanceOf(Date);
      expect(isNaN(registerTime.getTime())).toBe(false);
      
      if (response.body.lastLoginTime) {
        const lastLoginTime = new Date(response.body.lastLoginTime);
        expect(lastLoginTime).toBeInstanceOf(Date);
        expect(isNaN(lastLoginTime.getTime())).toBe(false);
      }
    });

    it('应该处理无效的token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('未授权访问');
    });

    it('应该处理过期的token', async () => {
      // 这个测试需要模拟过期的token
      // 在实际实现中，可能需要使用mock来模拟过期token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('未授权访问');
    });

    it('应该处理缺少Authorization头的请求', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', '');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('未授权访问');
    });

    it('应该处理错误格式的Authorization头', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('未授权访问');
    });
  });
});
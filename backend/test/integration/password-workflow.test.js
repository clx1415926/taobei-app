const request = require('supertest');
const app = require('../../src/app');

describe('Password Workflow Integration Tests', () => {
  
  // 测试用例10: 完整的密码设置和使用流程集成测试
  describe('Complete Password Workflow', () => {

    it('应该支持完整的密码设置和登录流程', async () => {
      const testPhoneNumber = '13800138001';
      let userToken;

      // 首先注册一个新用户
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: testPhoneNumber,
          type: 'register'
        });

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: testPhoneNumber,
          verificationCode: '123456',
          agreeToTerms: true
        });

      userToken = registerResponse.body.token;

      // 1. 检查初始密码状态
      const statusResponse = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.hasPassword).toBe(false);

      // 2. 设置密码
      const setPasswordResponse = await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      expect(setPasswordResponse.status).toBe(200);
      expect(setPasswordResponse.body.success).toBe(true);

      // 3. 验证密码状态已更新
      const updatedStatusResponse = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(updatedStatusResponse.status).toBe(200);
      expect(updatedStatusResponse.body.hasPassword).toBe(true);
      expect(updatedStatusResponse.body.passwordSetTime).toBeTruthy();

      // 4. 使用密码登录
      const loginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'TestPassword123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeTruthy();
      expect(loginResponse.body.user.phoneNumber).toBe(testPhoneNumber);

      // 5. 修改密码
      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        });

      expect(changePasswordResponse.status).toBe(200);
      expect(changePasswordResponse.body.success).toBe(true);

      // 6. 使用新密码登录
      const newLoginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'NewPassword456!'
        });

      expect(newLoginResponse.status).toBe(200);
      expect(newLoginResponse.body.success).toBe(true);

      // 7. 验证旧密码不能再使用
      const oldPasswordResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'TestPassword123!'
        });

      expect(oldPasswordResponse.status).toBe(401);
      expect(oldPasswordResponse.body.error).toContain('密码错误');
    });

    it('应该支持完整的密码重置流程', async () => {
      const testPhoneNumber = '13800138002';
      let userToken;

      // 首先注册一个新用户
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: testPhoneNumber,
          type: 'register'
        });

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: testPhoneNumber,
          verificationCode: '123456',
          agreeToTerms: true
        });

      userToken = registerResponse.body.token;

      // 先设置一个初始密码
      await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'InitialPassword123!',
          confirmPassword: 'InitialPassword123!'
        });

      // 1. 发送重置验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: testPhoneNumber,
          type: 'reset'
        });

      expect(sendCodeResponse.status).toBe(200);

      // 2. 使用验证码重置密码
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          phoneNumber: testPhoneNumber,
          verificationCode: '123456',
          newPassword: 'ResetPassword789!',
          confirmPassword: 'ResetPassword789!'
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.success).toBe(true);

      // 3. 使用重置后的密码登录
      const loginResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'ResetPassword789!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);

      // 4. 验证之前的密码不能使用
      const oldPasswordResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'InitialPassword123!'
        });

      expect(oldPasswordResponse.status).toBe(401);
    });

    it('应该正确处理账户锁定和解锁机制', async () => {
      const testPhoneNumber = '13800138003';
      let userToken;

      // 首先注册一个新用户
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: testPhoneNumber,
          type: 'register'
        });

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: testPhoneNumber,
          verificationCode: '123456',
          agreeToTerms: true
        });

      userToken = registerResponse.body.token;

      // 首先设置密码
      const setPasswordResponse = await request(app)
        .post('/api/auth/set-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      expect(setPasswordResponse.status).toBe(200);

      // 连续5次错误密码尝试
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post('/api/auth/login-password')
          .send({
            phoneNumber: testPhoneNumber,
            password: 'WrongPassword123!'
          });
        
        expect(response.status).toBe(401);
      }

      // 第5次尝试应该触发锁定
      const fifthAttempt = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'WrongPassword123!'
        });
      
      expect(fifthAttempt.status).toBe(423);
      expect(fifthAttempt.body.error).toBe('账户已被锁定');

      // 第6次尝试应该被锁定
      const lockedResponse = await request(app)
        .post('/api/auth/login-password')
        .send({
          phoneNumber: testPhoneNumber,
          password: 'TestPassword123!' // 即使是正确密码也应该被拒绝
        });

      expect(lockedResponse.status).toBe(423);
      expect(lockedResponse.body.error).toContain('账户已被锁定');

      // 验证密码状态API也应该反映锁定状态
      const statusResponse = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.isLocked).toBe(true);
    });
  });
});
const request = require('supertest');
const app = require('../../src/app');

describe('Homepage API', () => {
  describe('GET /api/homepage', () => {
    it('应该返回热门商品列表（至少8个）', async () => {
      const response = await request(app)
        .get('/api/homepage');

      expect(response.status).toBe(200);
      expect(response.body.hotProducts).toBeDefined();
      expect(Array.isArray(response.body.hotProducts)).toBe(true);
      expect(response.body.hotProducts.length).toBeGreaterThanOrEqual(8);
    });

    it('应该返回商品分类信息', async () => {
      const response = await request(app)
        .get('/api/homepage');

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it('应该支持限制商品数量参数', async () => {
      const response = await request(app)
        .get('/api/homepage?limit=5');

      expect(response.status).toBe(200);
      expect(response.body.hotProducts).toBeDefined();
      expect(response.body.hotProducts.length).toBeLessThanOrEqual(5);
    });

    it('如果用户已登录，应该返回用户基本信息', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138060',
          type: 'register'
        });

      // 注册用户
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138060',
          verificationCode: '123456',
          agreeToTerms: true
        });

      // 再次发送验证码用于登录
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138060',
          type: 'login'
        });

      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138060',
          verificationCode: '123456'
        });

      const authToken = loginResponse.body.token;

      const response = await request(app)
        .get('/api/homepage')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userInfo).toBeDefined();
      expect(response.body.userInfo.phoneNumber).toBeDefined();
    });

    it('应该支持商品图片懒加载URL', async () => {
      const response = await request(app)
        .get('/api/homepage');

      expect(response.status).toBe(200);
      expect(response.body.hotProducts).toBeDefined();
      
      if (response.body.hotProducts.length > 0) {
        const product = response.body.hotProducts[0];
        expect(product.image).toBeDefined();
        expect(typeof product.image).toBe('string');
      }
    });

    it('应该处理服务不可用的情况', async () => {
      // 这个测试需要模拟数据库连接失败等情况
      // 在实际实现中，可能需要使用mock来模拟错误
      // TODO: 添加服务不可用的模拟测试
    });
  });

  describe('GET /api/products/search', () => {
    it('应该支持关键词模糊搜索', async () => {
      const keyword = encodeURIComponent('手机');
      const response = await request(app)
        .get(`/api/products/search?keyword=${keyword}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toBeDefined();
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(typeof response.body.total).toBe('number');
    });

    it('应该验证搜索关键词不能为空', async () => {
      const response = await request(app)
        .get('/api/products/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请输入搜索关键词');
    });

    it('应该支持分页查询', async () => {
      const keyword = encodeURIComponent('手机');
      const response = await request(app)
        .get(`/api/products/search?keyword=${keyword}&page=2&limit=10`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.products.length).toBeLessThanOrEqual(10);
      expect(response.body.totalPages).toBeDefined();
    });

    it('应该支持多种排序方式', async () => {
      const keyword = encodeURIComponent('手机');
      
      // 测试按价格排序
      const priceResponse = await request(app)
        .get(`/api/products/search?keyword=${keyword}&sortBy=price`);

      expect(priceResponse.status).toBe(200);
      expect(priceResponse.body.products).toBeDefined();

      // 测试按销量排序
      const salesResponse = await request(app)
        .get(`/api/products/search?keyword=${keyword}&sortBy=sales`);

      expect(salesResponse.status).toBe(200);
      expect(salesResponse.body.products).toBeDefined();

      // 测试按相关度排序
      const relevanceResponse = await request(app)
        .get(`/api/products/search?keyword=${keyword}&sortBy=relevance`);

      expect(relevanceResponse.status).toBe(200);
      expect(relevanceResponse.body.products).toBeDefined();
    });

    it('应该返回搜索结果统计信息', async () => {
      const keyword = encodeURIComponent('手机');
      const response = await request(app)
        .get(`/api/products/search?keyword=${keyword}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
      expect(response.body.totalPages).toBeDefined();
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.totalPages).toBe('number');
    });

    it('应该处理搜索服务不可用的情况', async () => {
      // TODO: 添加搜索服务不可用的模拟测试
      // 这需要模拟数据库查询失败等情况
    });
  });

  describe('GET /api/categories', () => {
    it('应该返回所有可用的商品分类', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it('应该包含分类ID、名称、图标等信息', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      
      if (response.body.categories.length > 0) {
        const category = response.body.categories[0];
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
      }
    });

    it('应该支持层级分类结构', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      
      // 检查是否有层级结构（可选字段）
      if (response.body.categories.length > 0) {
        const category = response.body.categories[0];
        // parentId 和 children 是可选的层级字段
        if (category.parentId !== undefined) {
          expect(typeof category.parentId).toBe('string');
        }
        if (category.children !== undefined) {
          expect(Array.isArray(category.children)).toBe(true);
        }
      }
    });

    it('应该处理服务不可用的情况', async () => {
      // TODO: 添加服务不可用的模拟测试
    });
  });
});
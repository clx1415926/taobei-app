const express = require('express');
const { query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

const productModel = new Product();

// API-GET-Homepage
router.get('/', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // 获取热门商品
    const hotProducts = productModel.getHotProducts(limit);
    
    // 获取商品分类
    const categories = productModel.getCategories();
    
    // 模拟轮播图数据
    const banners = [
      {
        id: '1',
        title: '双11大促销',
        imageUrl: '/images/banner1.jpg',
        linkUrl: '/search?keyword=促销'
      },
      {
        id: '2', 
        title: '新品上市',
        imageUrl: '/images/banner2.jpg',
        linkUrl: '/search?keyword=新品'
      }
    ];

    const response = {
      hotProducts: hotProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        imageUrl: product.image_url,
        sales: product.sales_count,
        categoryName: product.category_name
      })),
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        productCount: category.product_count
      })),
      banners
    };

    // 如果用户已登录，添加用户信息
    if (req.user) {
      response.userInfo = {
        userId: req.user.userId,
        phoneNumber: req.user.phoneNumber
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API-GET-SearchProducts
router.get('/search', [
  query('keyword').notEmpty().withMessage('请输入搜索关键词'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码参数无效'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量参数无效'),
  query('sortBy').optional().isIn(['relevance', 'price_asc', 'price_desc', 'sales']).withMessage('排序参数无效')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: '请输入搜索关键词' });
  }

  try {
    const { keyword, page = 1, limit = 20, sortBy = 'sales' } = req.query;
    
    const result = productModel.searchProducts(
      keyword, 
      parseInt(page), 
      parseInt(limit), 
      sortBy
    );

    const response = {
      products: result.products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.original_price,
        imageUrl: product.image_url,
        sales: product.sales_count,
        categoryName: product.category_name
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      keyword
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '搜索服务暂时不可用' });
  }
});

// API-GET-Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = productModel.getCategories();
    
    const response = {
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        productCount: category.product_count
      }))
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '获取分类信息失败' });
  }
});

module.exports = router;
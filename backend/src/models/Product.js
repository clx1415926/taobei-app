const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Product {
  constructor() {
    const dbPath = process.env.NODE_ENV === 'test' 
      ? process.env.TEST_DB_PATH || ':memory:'
      : path.join(__dirname, '../../database/taobei.db');
    
    this.db = new Database(dbPath);
    this.initTables();
    this.seedData();
  }

  initTables() {
    // 产品分类表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 产品表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        image_url TEXT,
        category_id TEXT,
        sales_count INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        is_hot BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);
  }

  seedData() {
    // 检查是否已有数据
    const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (categoryCount.count > 0) return;

    // 插入分类数据
    const categories = [
      { id: uuidv4(), name: '数码电器', icon: '📱', sort_order: 1 },
      { id: uuidv4(), name: '服装鞋包', icon: '👕', sort_order: 2 },
      { id: uuidv4(), name: '家居生活', icon: '🏠', sort_order: 3 },
      { id: uuidv4(), name: '美妆护肤', icon: '💄', sort_order: 4 },
      { id: uuidv4(), name: '食品饮料', icon: '🍎', sort_order: 5 },
      { id: uuidv4(), name: '运动户外', icon: '⚽', sort_order: 6 }
    ];

    const insertCategory = this.db.prepare(`
      INSERT INTO categories (id, name, icon, sort_order) 
      VALUES (?, ?, ?, ?)
    `);

    categories.forEach(category => {
      insertCategory.run(category.id, category.name, category.icon, category.sort_order);
    });

    // 插入产品数据
    const products = [
      {
        id: uuidv4(),
        name: 'iPhone 15 Pro',
        description: '最新款苹果手机，性能强劲',
        price: 7999.00,
        original_price: 8999.00,
        image_url: '/images/iphone15pro.jpg',
        category_id: categories[0].id,
        sales_count: 1250,
        stock: 100,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: '小米14 Ultra',
        description: '徕卡影像，旗舰性能',
        price: 5999.00,
        original_price: 6499.00,
        image_url: '/images/mi14ultra.jpg',
        category_id: categories[0].id,
        sales_count: 890,
        stock: 150,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: '优衣库基础T恤',
        description: '舒适纯棉，多色可选',
        price: 59.00,
        original_price: 79.00,
        image_url: '/images/uniqlo-tshirt.jpg',
        category_id: categories[1].id,
        sales_count: 2340,
        stock: 500,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: '戴森吸尘器V15',
        description: '强劲吸力，智能清洁',
        price: 3990.00,
        original_price: 4490.00,
        image_url: '/images/dyson-v15.jpg',
        category_id: categories[2].id,
        sales_count: 567,
        stock: 80,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: '雅诗兰黛小棕瓶',
        description: '修护精华，抗衰老',
        price: 680.00,
        original_price: 780.00,
        image_url: '/images/estee-lauder.jpg',
        category_id: categories[3].id,
        sales_count: 1890,
        stock: 200,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: '三只松鼠坚果礼盒',
        description: '精选坚果，健康美味',
        price: 128.00,
        original_price: 158.00,
        image_url: '/images/nuts-gift.jpg',
        category_id: categories[4].id,
        sales_count: 3450,
        stock: 300,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: '耐克运动鞋',
        description: '舒适透气，运动首选',
        price: 599.00,
        original_price: 699.00,
        image_url: '/images/nike-shoes.jpg',
        category_id: categories[5].id,
        sales_count: 1120,
        stock: 120,
        is_hot: true
      },
      {
        id: uuidv4(),
        name: 'MacBook Air M2',
        description: '轻薄便携，性能卓越',
        price: 8999.00,
        original_price: 9999.00,
        image_url: '/images/macbook-air.jpg',
        category_id: categories[0].id,
        sales_count: 780,
        stock: 50,
        is_hot: true
      }
    ];

    const insertProduct = this.db.prepare(`
      INSERT INTO products (id, name, description, price, original_price, image_url, category_id, sales_count, stock, is_hot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    products.forEach(product => {
      insertProduct.run(
        product.id, product.name, product.description, product.price,
        product.original_price, product.image_url, product.category_id,
        product.sales_count, product.stock, product.is_hot ? 1 : 0
      );
    });

    // 添加更多普通产品
    for (let i = 0; i < 50; i++) {
      const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
      const product = {
        id: uuidv4(),
        name: `商品${i + 7}`,
        description: `这是商品${i + 7}的详细描述`,
        price: Math.floor(Math.random() * 1000) + 50,
        original_price: null,
        image_url: `/images/product${i + 7}.jpg`,
        category_id: categoryId,
        sales_count: Math.floor(Math.random() * 500),
        stock: Math.floor(Math.random() * 100) + 10,
        is_hot: false
      };

      insertProduct.run(
        product.id, product.name, product.description, product.price,
        product.original_price, product.image_url, product.category_id,
        product.sales_count, product.stock, product.is_hot ? 1 : 0
      );
    }
  }

  // 获取热门产品
  getHotProducts(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_hot = TRUE
      ORDER BY p.sales_count DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // 获取所有分类
  getCategories() {
    const stmt = this.db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.sort_order
    `);
    return stmt.all();
  }

  // 搜索产品
  searchProducts(keyword, page = 1, limit = 20, sortBy = 'sales') {
    const offset = (page - 1) * limit;
    
    let orderBy = 'p.sales_count DESC';
    switch (sortBy) {
      case 'price':
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'relevance':
        orderBy = 'p.sales_count DESC'; // 暂时用销量作为相关度
        break;
      default:
        orderBy = 'p.sales_count DESC';
    }

    const searchStmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.description LIKE ?
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.name LIKE ? OR p.description LIKE ?
    `);

    const searchTerm = `%${keyword}%`;
    const products = searchStmt.all(searchTerm, searchTerm, limit, offset);
    const totalResult = countStmt.get(searchTerm, searchTerm);
    
    return {
      products,
      total: totalResult.total,
      page,
      limit,
      totalPages: Math.ceil(totalResult.total / limit)
    };
  }

  // 根据分类获取产品
  getProductsByCategory(categoryId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.sales_count DESC
      LIMIT ? OFFSET ?
    `);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.category_id = ?
    `);

    const products = stmt.all(categoryId, limit, offset);
    const totalResult = countStmt.get(categoryId);
    
    return {
      products,
      total: totalResult.total,
      page,
      limit,
      totalPages: Math.ceil(totalResult.total / limit)
    };
  }

  // 获取产品详情
  getProductById(productId) {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    return stmt.get(productId);
  }

  close() {
    this.db.close();
  }
}

module.exports = Product;
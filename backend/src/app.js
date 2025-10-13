const express = require('express');
const cors = require('cors');
const database = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '服务运行正常' });
});

// 启动服务器
async function startServer() {
  try {
    await database.connect();
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  database.close();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
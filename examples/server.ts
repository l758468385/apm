import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// 更详细的 CORS 配置
app.use(cors({
  origin: ['http://localhost:3333', 'http://127.0.0.1:3333'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Aid', 'X-Token'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// 添加健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 监控数据接收接口
app.post('/collect', (req, res) => {
  console.log('Received monitoring data:', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// 测试页面路由 - 修改为直接提供 test.html
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Server running at:`);
  console.log(`- http://localhost:${PORT}/test`);
  console.log(`- http://127.0.0.1:${PORT}/test`);
}); 
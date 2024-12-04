import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// 监控数据接收接口
app.post('/collect', (req, res) => {
  console.log('Received monitoring data:', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// 测试页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test page available at http://localhost:${PORT}/examples/test.html`);
}); 
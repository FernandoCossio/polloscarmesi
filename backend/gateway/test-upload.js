const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

// Create a dummy image file for testing
fs.writeFileSync('dummy.jpg', 'fake image data');

const loginData = JSON.stringify({
  username: 'repartidor@restaurante.com',
  password: 'admin123'
});

const loginReq = http.request({
  hostname: '127.0.0.1',
  port: 8081,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).accessToken;
    
    const form = new FormData();
    form.append('pedidoId', '3406ed44-9a2c-4af7-b6a9-0270a3897c81');
    form.append('file', fs.createReadStream('dummy.jpg'));
    
    const reqHeaders = form.getHeaders();
    reqHeaders['Authorization'] = `Bearer ${token}`;
    
    const uploadReq = http.request({
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/v1/delivery/tracking/confirmar-entrega',
      method: 'POST',
      headers: reqHeaders
    }, res2 => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        console.log('UPLOAD STATUS:', res2.statusCode);
        console.log('UPLOAD BODY:', body2);
      });
    });
    
    form.pipe(uploadReq);
  });
});

loginReq.write(loginData);
loginReq.end();

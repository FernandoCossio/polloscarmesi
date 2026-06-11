const http = require('http');

function queryGql(port, queryObj) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(queryObj);
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const query = {
    query: `
      query {
        obtenerPedidosDeliveryPorCliente(clienteId: "2") {
          id
          estado
          total
          clienteId
        }
      }
    `
  };

  try {
    console.log('--- CONSULTANDO MS-PEDIDOS (3001) ---');
    const resMs2 = await queryGql(3001, query);
    console.log(JSON.stringify(resMs2, null, 2));

    console.log('\n--- CONSULTANDO GATEWAY (4000) ---');
    const resGateway = await queryGql(4000, query);
    console.log(JSON.stringify(resGateway, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();

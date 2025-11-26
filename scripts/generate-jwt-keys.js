const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('Generating RSA key pair for JWT...\n');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('PRIVATE KEY:');
console.log(privateKey);

console.log('\nPUBLIC KEY:');
console.log(publicKey);

const envContent = `# Auth Service Environment Variables
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@auth-db:5432/auth

# JWT Keys - Generated on ${new Date().toISOString()}
JWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
JWT_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"
`;

const envPath = path.join(__dirname, '..', 'services', 'auth-service', '.env');
fs.writeFileSync(envPath, envContent);

console.log('\n✓ Keys saved to services/auth-service/.env');
console.log('\nCopy these keys to your .env file if needed.');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Postman Clone...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envExample = fs.readFileSync(path.join(process.cwd(), 'env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env.local created from env.example');
  console.log('⚠️  Please update the DATABASE_URL in .env.local with your PostgreSQL credentials\n');
}

// Generate Prisma client
console.log('🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully\n');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  process.exit(1);
}

// Check if database is accessible
console.log('🔍 Checking database connection...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema pushed successfully\n');
} catch (error) {
  console.error('❌ Error pushing database schema:', error.message);
  console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is correct in .env.local\n');
  process.exit(1);
}

console.log('🎉 Setup completed successfully!');
console.log('📖 Next steps:');
console.log('   1. Update DATABASE_URL in .env.local if needed');
console.log('   2. Run "npm run dev" to start the development server');
console.log('   3. Open http://localhost:3000 in your browser');
console.log('   4. Sign up for a new account to get started');



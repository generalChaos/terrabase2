const { execSync } = require('child_process');
const path = require('path');

async function resetAndRestore() {
  console.log('🔄 Starting database reset and restore process...');
  
  try {
    // Step 1: Backup current data
    console.log('\n📦 Step 1: Backing up current data...');
    execSync('node backup-data.js backup', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    console.log('✅ Backup completed');

    // Step 2: Reset database
    console.log('\n🗑️ Step 2: Resetting database...');
    execSync('supabase db reset --local', { 
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit' 
    });
    console.log('✅ Database reset completed');

    // Step 3: Wait a moment for database to be ready
    console.log('\n⏳ Step 3: Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Restore data
    console.log('\n🔄 Step 4: Restoring data...');
    execSync('node backup-data.js restore', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    console.log('✅ Data restore completed');

    // Step 5: Verify the colors column exists
    console.log('\n🔍 Step 5: Verifying colors column...');
    execSync('node check-table-structure.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });

    console.log('\n🎉 Reset and restore process completed!');
    console.log('🌐 You can now visit: http://localhost:3003/results/0273070c-cb0b-4369-a6d2-3a2af2c1420e');

  } catch (error) {
    console.error('❌ Reset and restore failed:', error.message);
    console.log('\n💡 You may need to manually restore data from the backup files in the backup/ directory');
    process.exit(1);
  }
}

resetAndRestore();

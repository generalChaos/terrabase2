const { execSync } = require('child_process');
const path = require('path');

async function fullBackupAndRestore() {
  console.log('🔄 Starting full backup and restore process...');
  
  try {
    // Step 1: Backup database data
    console.log('\n📦 Step 1: Backing up database data...');
    execSync('node backup-data.js backup', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    console.log('✅ Database backup completed');

    // Step 2: Backup storage files
    console.log('\n📁 Step 2: Backing up storage files...');
    execSync('node backup-storage.js backup', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    console.log('✅ Storage backup completed');

    // Step 3: Reset database
    console.log('\n🗑️ Step 3: Resetting database...');
    execSync('supabase db reset --local', { 
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit' 
    });
    console.log('✅ Database reset completed');

    // Step 4: Wait for database to be ready
    console.log('\n⏳ Step 4: Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 5: Restore storage files
    console.log('\n📁 Step 5: Restoring storage files...');
    execSync('node backup-storage.js restore', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    console.log('✅ Storage restore completed');

    // Step 6: Restore database data
    console.log('\n🔄 Step 6: Restoring database data...');
    execSync('node backup-data.js restore', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    console.log('✅ Database restore completed');

    // Step 7: Verify the colors column exists
    console.log('\n🔍 Step 7: Verifying colors column...');
    execSync('node check-table-structure.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });

    console.log('\n🎉 Full backup and restore process completed!');
    console.log('🌐 You can now visit: http://localhost:3003/results/0273070c-cb0b-4369-a6d2-3a2af2c1420e');
    console.log('🎨 The colors column should now be available for improved color theming!');

  } catch (error) {
    console.error('❌ Full backup and restore failed:', error.message);
    console.log('\n💡 You may need to manually restore data from the backup files in the backup/ directory');
    process.exit(1);
  }
}

fullBackupAndRestore();

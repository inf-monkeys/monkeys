const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const timeout = setTimeout(() => {
  console.log('No input received, defaulting to no clean');
  console.log('Running migration...');
  readline.close();
  try {
    require('child_process').execSync('yarn typeorm migration:run -d ormconfig.js', { stdio: 'inherit' });
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}, 2000);
readline.question('Do you want to clean the build before rebuilding? (Input y to clean, default to not clean): ', (answer) => {
  clearTimeout(timeout);
  const shouldClean = answer.toLowerCase() === 'y';
  
  if (shouldClean) {
    console.log('Cleaning build and running migration...');
    require('child_process').execSync('yarn build && yarn typeorm migration:run -d ormconfig.js', { stdio: 'inherit' });
  } else {
    console.log('Running migration...');
    require('child_process').execSync('yarn typeorm migration:run -d ormconfig.js', { stdio: 'inherit' });
  }

  readline.close();
});
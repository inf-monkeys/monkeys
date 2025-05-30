const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const timeout = setTimeout(() => {
  console.log('No input received, defaulting to no clean');
  runMigration(false); // Run migration without cleaning
}, 2000);

readline.question(
  'Do you want to clean the build before migration? (Input y to clean, default to not clean): ',
  (answer) => {
    clearTimeout(timeout);
    const shouldClean = answer.toLowerCase() === 'y';
    runMigration(shouldClean);
  }
);

function runMigration(shouldClean) {
  readline.close(); // Close readline early to avoid hangs

  try {
    if (shouldClean) {
      console.log('Cleaning build and running migration...');
      require('child_process').execSync('yarn build && yarn typeorm migration:run -d ormconfig.js', { 
        stdio: 'inherit' 
      });
    } else {
      console.log('Running migration...');
      require('child_process').execSync('yarn typeorm migration:run -d ormconfig.js', { 
        stdio: 'inherit' 
      });
    }
    console.log('✅ Migration completed');
    process.exit(0); // Explicit success exit
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Do you want to clean the build before rebuilding? (input y to clean): ', (answer) => {
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
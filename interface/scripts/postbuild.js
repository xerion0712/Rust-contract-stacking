// eslint-disable-next-line
const fs = require('fs');

const package = JSON.parse(
  fs.readFileSync('./package.json', {encoding: 'utf8'})
);

delete package.scripts;
delete package.devDependencies;

fs.writeFileSync(
  './build/package.json',
  JSON.stringify(package, null, 2),
  'utf8'
);

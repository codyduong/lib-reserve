import * as fs from 'fs';
import { exec } from 'child_process';

let IGNORED_FILES = '';

if (fs.existsSync('.eslintignore')) {
  const eslintrc = fs.readFileSync('.eslintignore', 'utf8');
  IGNORED_FILES += eslintrc.replace(/\n/g, '|');
}

const command =
  'git diff --name-only $(git merge-base origin/master HEAD) --diff-filter=ACMRTUXB | grep -E ".(js|jsx|ts|tsx)$" | tr "\\n" " " | sed -E "s@' +
  (IGNORED_FILES || "''") +
  '@@g" | xargs';

console.log(command);
exec(command, (error, stdout, _stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stdout.trim() === '') {
    console.log('There are no files to lint');
  } else {
    exec(
      'bun run eslint --config .eslintrc.js ' + stdout,
      (error, _stdout, _stderr) => {
        if (stdout.trim() !== '') {
          console.log(stdout);
        }
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
      },
    );
  }
});

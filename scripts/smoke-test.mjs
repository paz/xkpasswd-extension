import {XKPasswd} from '../vendor/xkpasswd-js/src/xkpasswd.mjs';

const generator = new XKPasswd();
const result = generator.generatePassword(1);
if (!result?.passwords?.[0]) {
  console.error('Failed to generate a password');
  process.exit(1);
}
console.log(`Generated password: ${result.passwords[0]}`);

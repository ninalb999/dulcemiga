import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const distPath = join(process.cwd(), 'dist');
const indexPath = join(distPath, 'index.html');
const notFoundPath = join(distPath, '404.html');

if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath);
}

import * as fs from 'fs';
import * as path from 'path';

const JSON_DIR = path.join(path.resolve(), 'json');

if (!fs.existsSync(JSON_DIR)) {
  fs.mkdirSync(JSON_DIR);
}

export function tapWriteFile<T>(filename: string, data: T): Promise<T> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.join(JSON_DIR, filename), JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

export function tapWriteFileSync<T>(filename: string, data: T): T {
  try {
    fs.writeFileSync(path.join(JSON_DIR, filename), JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    throw err;
  }
}

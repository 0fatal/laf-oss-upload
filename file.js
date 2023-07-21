const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

function readDirectoryRecursive(dir) {
  const files = fs.readdirSync(dir);
  const result = [];
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      result.push(...readDirectoryRecursive(filepath));
    } else {
      result.push(filepath);
    }
  }
  return result;
}

// compare file md5
function compareFileMD5(sourceFile, bucketObject) {
  const sourceData = fs.readFileSync(sourceFile);
  const sourceFileMD5 = createHash('md5').update(sourceData).digest('hex');
  const etag = bucketObject.ETag.replace(/\"/g, '');
  return sourceFileMD5 === etag;
}

module.exports = {
  readDirectoryRecursive,
  compareFileMD5,
};

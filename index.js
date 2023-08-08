const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const { S3 } = require('@aws-sdk/client-s3');
const mime = require('mime');
const { readDirectoryRecursive, compareFileMD5 } = require('./file');
const { S3Client } = require('./s3');

const ENDPOINT = core.getInput('endpoint');
const ACCESS_KEY_ID = core.getInput('access-key-id');
const REGION = core.getInput('region');
const ACCESS_KEY_SECRET = core.getInput('access-key-secret');
const BUCKET = core.getInput('bucket');
const TARGET = core.getInput('target-dir');
const CLEAR_BEFORE_UPLOAD = core.getBooleanInput('clear-before-upload');
let BUCKET_PREFIX = core.getInput('remote-dir');
const STS_TOKEN = core.getInput('sts-token');

if (BUCKET_PREFIX && !BUCKET_PREFIX.endsWith('/')) {
  BUCKET_PREFIX += '/';
}

const s3 = new S3({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId:ACCESS_KEY_ID,
    secretAccessKey:
          ACCESS_KEY_SECRET,
    sessionToken: STS_TOKEN,
  },
  forcePathStyle: true,
});
const s3Client = new S3Client(s3, BUCKET);

function filterUploadFiles(sourceFiles, bucketObjects) {
  const uploadFiles = sourceFiles.filter((sourceFile) => {
    const bucketObject = bucketObjects.find(
      (bucketObject) => bucketObject.Key === sourceFile.key
    );
    if (!bucketObject) {
      return true;
    }
    return !compareFileMD5(sourceFile.absPath, bucketObject);
  });
  return uploadFiles;
}

async function main() {
  const bucketObjects = await s3Client.listObjects({
    Prefix: BUCKET_PREFIX,
  });

  if (CLEAR_BEFORE_UPLOAD && bucketObjects.length > 0) {
    await s3Client.deleteS3Objects(BUCKET_PREFIX);
    bucketObjects.length = 0;
  }

  const localFiles = readDirectoryRecursive(TARGET).map((file) => ({
    key: BUCKET_PREFIX + path.relative(TARGET, file).replace(/\\/g, '/'),
    absPath: path.resolve(file),
    path: file,
  }));

  const uploadFiles = filterUploadFiles(localFiles, bucketObjects);

  if (uploadFiles?.length > 0) {
    for (const file of uploadFiles) {
      const fileContent = fs.readFileSync(file.absPath);
      const contentType = mime.getType(file.absPath);

      await s3Client
        .uploadFileWithRetry(fileContent, contentType, file.key)
        .then(() => {
          console.log(`Uploaded ${file.path} to ${file.key}`);
        })
        .catch((err) => {
          console.error(`Failed to upload ${file.path}: ${err}`);
        });
    }
  }
}

main(TARGET).catch((error) => {
  core.setFailed(error.message);
});

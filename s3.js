const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

class S3Client {
  /**
   * S3Client
   * @param {import("@aws-sdk/client-s3").S3} s3
   * @param {string} bucket
   */
  constructor(s3, bucket) {
    this.s3 = s3;
    this.bucket = bucket;
  }

  async deleteS3Objects(objects) {
    const deleteParams = {
      Bucket: this.bucket,
      Delete: { Objects: objects },
    };
    return await this.s3.deleteObjects(deleteParams).then((res) => res.Deleted);
  }

  async listObjects(params) {
    return await this.s3
      .listObjects({
        Bucket: this.bucket,
        ...params,
      })
      .then((res) => res.Contents || []);
  }

  /**
   * @param {Buffer} fileContent
   * @param {string} contentType
   * @param {string} key
   * @param {number} maxRetries
   * @param {number} currentRetry
   * @returns
   */
  async uploadFileWithRetry(
    fileContent,
    contentType,
    key,
    maxRetries = 3,
    currentRetry = 0
  ) {
    try {
      const res = await this.s3.putObject({
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      });
      return res;
    } catch (err) {
      if (currentRetry < maxRetries) {
        await sleep(500);
        console.log(`Retrying ${key}, Retry count: ${currentRetry + 1}`);
        return await this.uploadFileWithRetry(
          fileContent,
          contentType,
          key,
          maxRetries,
          currentRetry + 1
        );
      } else {
        throw err;
      }
    }
  }
}

module.exports = {
  S3Client,
};

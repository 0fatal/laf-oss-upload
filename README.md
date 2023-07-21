# Laf OSS Upload
Upload your static files to laf oss.

## Example
```yaml
steps:
  - uses: actions/checkout@master
  - name: Laf OSS Upload
    uses: 0fatal/laf-oss-upload@main
    with:
      endpoint: "https://oss.laf.run"
      region: "cn-hz"
      access-key-id: ${{ secrets.OSS_ID }}
      access-key-secret: ${{ secrets.OSS_SECRET }}
      bucket: "your_bucket"
      target-dir: "dist"
      remote-dir: ""
      clear-before-upload: true
```

## More
1. see [action.yml](./action.yml)
2. https://doc.laf.run/guide/oss/use-sts-in-client.html

const gulp = require('gulp'),
  {
    promisify
  } = require('util'),
  vfs = require('vinyl-fs'),
  eb = require('gulp-beanstalk-deploy'),
  del = require('del'),
  zip = require('gulp-vinyl-zip').zip,
  devops = require('devops-infra');

function archive(archive_file_path = null, cb) {
  return vfs.src([
    './**/*',
    './.**/*',
    './.*',
    '!./.DS_Store',
    '!./.config.json',
    '!./.elasticbeanstalk',
    '!./.elasticbeanstalk/**/*',
    '!./.git',
    '!./.git/**/*',
    '!./.gitignore',
    '!./node_modules',
    '!./node_modules/**/*',
    '!./test',
    '!./test/**/*',
  ], {
    base: '.'
  })
  .pipe(zip(archive_file_path || '/tmp/archive.zip'))
  .pipe(vfs.dest('.'))
  .on('end', () => {
    return cb(null);
  });
}

function uploadToEb({
  version,
  beanstalk_env_name,
  source_file_path,
  upload_file_name,
  add_tags
}, cb) {
  const ebAppName = 'personalized-related-news';

  eb({
    region: 'ap-northeast-2',
    applicationName: ebAppName,
    environmentName: beanstalk_env_name,
    versionLabel: version,
    sourceBundle: source_file_path,
    s3Bucket: {
      bucket: 'elasticbeanstalk-ap-northeast-2-740271638955',
      key: `${ebAppName}/${upload_file_name}`,
    },
    account_id: '740271638955',
    tagsToAdd: add_tags,
    tagsToRemove: {},
  }, (err) => {
    if (err) {
      return cb(err);
    }

    return cb(null);
  });
}

gulp.task('deploy', async () => {
  const version = await devops.setVersionByTag();
  const timestamp = new Date().valueOf();
  const uploadFilename = `${version}-${timestamp}.zip`;
  const sourceFilename = `personal-related-news-${uploadFilename}`;
  const sourceFilePath = `/tmp/${sourceFilename}`;
  const beanstalkEnvName = "personal-related-news";
  const addTags = {'stage': 'live', 'team1': 'dp', 'service': 'reco', 'function': 'web'};

  await promisify(archive)(sourceFilePath);

  console.info('[BEGIN_DEPLOY]', version, new Date());
  const deployResults = await promisify(uploadToEb)({
    version,
    beanstalk_env_name: beanstalkEnvName,
    source_file_path: sourceFilePath,
    upload_file_name: uploadFilename,
    add_tags: addTags
  });
  console.info('[DONE_DEPLOY]', deployResults, new Date());

  await del([sourceFilePath], {
    force: true
  });
  return true;
});

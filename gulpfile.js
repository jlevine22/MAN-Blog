var gulp = require('gulp');
var gutil = require('gulp-util');
var Promise = require('bluebird');
var mocha = require('gulp-mocha');
const spawn = require('child_process').spawn;

const containerName = 'man-blog-web';

function dockerCommand(command, done) {
  command.stdout.on('data', data => {
    console.log(`stdout: ${data.toString().replace("\n",'')}`);
  });
  command.stderr.on('data', data => {
    console.error(`stderr: ${data.toString().replace("\n",'')}`);
  });
  command.on('close', code => {
    console.log(`child process exited with code ${code}`);
    done();
  });
}

gulp.task('build', function(done) {
  const build = spawn('docker', ['build','-t','man-blog','.']);
  dockerCommand(build, done);
});

gulp.task('run', ['stop'], function(done) {
  const run = spawn('docker', [
    'run',
    '--rm',
    '-v','/cache',
    '-v','/Users/joshlevine/Dropbox/Manly Blog Posts:/posts',
    '-v',__dirname + ':/src',
    '-p','3000:3000',
    '--name', containerName,
    'man-blog',
    'node',
    '/src/src/app.js'
  ]);
  dockerCommand(run, done);
});

gulp.task('stop', function(done) {
  const stop = spawn('docker', [
    'stop',
    containerName
  ]);
  dockerCommand(stop, done);
});

gulp.task('serve', function () {
  require('./src/app');
});

gulp.task('test', function () {
  return gulp.src(['./tests/*.js'])
    .pipe(mocha());
});

gulp.task('new-post', function () {
  var prompt = require('prompt');
  var moment = require('moment');
  var fs = require('fs');

  prompt.message = '> ';
  prompt.delimiter = '';

  var defaultDate = moment().format('YYYY-MM-DD');

  var dateAndTitleSchema = {
    properties: {
      author: {
        description: 'Author:',
        default: (require('./man.json') || {}).defaultAuthor || 'Anonymous'
      },
      date: {
        description: 'Publish Date:',
        pattern: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
        message: 'Date must be in format YYYY-MM-DD',
        default: defaultDate
      },
      title: {
        description: 'Post Title:',
        required: true,
        message: 'You must enter a post title!'
      },
      saveLocation: {
        description: 'Where do you want to save this file?',
        default: (require('./man.json') || {}).postsDirectory || fs.realpathSync(__dirname + '/posts')
      },
      published: {
        description: 'Published?',
        default: 'false'
      }
    }
  };

  var slugSchema = {
    properties: {
      slug: {}
    }
  };

  prompt.start();

  var promptGet = Promise.promisify(prompt.get);

  return promptGet(dateAndTitleSchema)
    .then(function (result) {
      var slug = result.title.toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim().replace(/ /g, '-');
      slugSchema.properties.slug.description = 'Post Slug:';
      slugSchema.properties.slug.default = slug;
      return [
        result.date,
        result.title,
        result.author,
        promptGet(slugSchema)
          .then(function (result) {
            return result.slug
          }),
        result.saveLocation,
        result.published
      ];
    }).spread(function (date, title, author, slug, saveLocation, published) {
      var path = saveLocation + '/' + slug + '.md'
      if (fs.existsSync(path)) {
        console.error('Ooops, that date/slug already exists!');
        return;
      }
      var template = fs.readFileSync('posts/.default.md').toString();
      file = template
        .replace('#date#', date)
        .replace('#title#', title)
        .replace('#slug#', slug)
        .replace('#author#', author)
        .replace('#published#', published);
      fs.writeFileSync(path, file);
    });

});
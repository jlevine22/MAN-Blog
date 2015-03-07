var gulp = require('gulp');
var gutil = require('gulp-util');
var Promise = require('bluebird');

gulp.task('default', function () {
    // do stuff
});

gulp.task('serve', function() {
    require('./src/app');
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
            }
        }
    };

    var slugSchema = {
        properties: {
            slug: {
            }
        }
    };

    prompt.start();

    var promptGet = Promise.promisify(prompt.get);

    return promptGet(dateAndTitleSchema)
        .then(function (result) {
            var slug = result.title.toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim().replace(/ /g, '-');
            slugSchema.properties.slug.description = 'Post Slug:';
            slugSchema.properties.slug.default = slug;
            return [result.date, result.title, promptGet(slugSchema).then(function (result) { return result.slug })];
        }).spread(function (date, title, slug) {
            var path = 'posts/' + slug + '.md'
            if (fs.existsSync(path)) {
                console.error('Ooops, that date/slug already exists!');
                return;
            }
            var template = fs.readFileSync('posts/.default.md').toString();
            file = template.replace('#date#', date).replace('#title#', title).replace('#slug#', slug).replace('#author#', 'Josh Levine');
            fs.writeFileSync(path, file);

            console.log('got values:');
            console.log('date = %s', date);
            console.log('title = %s', title);
            console.log('slug = %s', slug);
        });

});
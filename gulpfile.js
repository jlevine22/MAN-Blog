var gulp = require('gulp');
var gutil = require('gulp-util');
var Promise = require('bluebird');
var mocha = require('gulp-mocha');

gulp.task('default', function () {
    // do stuff
});

gulp.task('serve', function() {
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
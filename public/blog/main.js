require.config({
	baseUrl: '/',
	paths: {
		'lib': 'bower_components',
		'angular': 'bower_components/angular/angular.min',
		'ui-router': 'bower_components/angular-ui-router/release/angular-ui-router',
		'moment': 'bower_components/moment/min/moment.min'
	},
	shim: {
		'ui-router': {
			deps:['angular']
		},
		'angular': {
			deps: [],
			exports: 'angular'
		},
		'moment': {
			exports: 'moment'
		}
	}
});

require(['angular','ui-router','moment'], function (angular, uiRouter, moment) {
	var MANBlog = angular.module('MANBlog', ['ui.router']);
	MANBlog.config(function($urlRouterProvider, $locationProvider) {
		console.log('configging');
		//
		// For any unmatched url, redirect to /state1
		$urlRouterProvider.otherwise("/");

		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});
	});

	MANBlog.filter('blogPostDate', function () {
		return function (date) {
			return moment(date).format('MMMM Do YYYY');
		};
	});

	MANBlog.filter('rawHtml', function ($sce) {
		return function (raw) {
			return $sce.trustAsHtml(raw);
		};
	});

	require(['blog-list/main', 'blog-post/main'], function () {
		angular.bootstrap(document, ['MANBlog']);
	});


});
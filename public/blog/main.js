require.config({
    baseUrl: '/',
    paths: {
        'lib': '/bower_components',
        'angular': '/bower_components/angular/angular.min',
        'ui-router': '/bower_components/angular-ui-router/release/angular-ui-router',
        'moment': '/bower_components/moment/min/moment.min',
        'angulartics': '/bower_components/angulartics/dist/angulartics.min',
        'angulartics-ga': '/bower_components/angulartics/dist/angulartics-ga.min',
        'angular-material': '/bower_components/angular-material/angular-material.min',
        'angular-aria': '/bower_components/angular-aria/angular-aria.min',
        'angular-animate': '/bower_components/angular-animate/angular-animate.min'
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
        },
        'angulartics': {
            deps:['angular','/bower_components/waypoints/waypoints.min.js','/bower_components/SHA-1/sha1.js']
        },
        'angulartics-ga': {
            deps:['angulartics']
        },
        'angular-material': {
            deps: ['angular','angular-aria', 'angular-animate']
        },
        'angular-aria': {
            deps: ['angular']
        },
        'angular-animate': {
            deps: ['angular']
        }
    }
});

require(['angular','ui-router','moment','angulartics','angulartics-ga', 'angular-material'], function (angular, uiRouter, moment) {
    var MANBlog = angular.module('MANBlog', ['ui.router','angulartics','angulartics.google.analytics', 'ngMaterial']);
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
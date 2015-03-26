define(['angular'], function (angular) {
    angular.module('MANBlog')
        .config(function ($stateProvider) {
            $stateProvider.state('post', {
                url: '/p/:slug',
                templateUrl: '/blog-post/post.html'
            });
        })
        .controller('BlogPostCtrl', function ($scope, $stateParams, $http) {
            $scope.error = false;
            $http.get('/posts/' + $stateParams.slug).then(function (response) {
                $scope.post = response.data;
            }, function(error) {
                $scope.error = true;
            });
        });
});
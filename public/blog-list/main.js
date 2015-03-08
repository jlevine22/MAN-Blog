define(['angular', 'ui-router'], function (angular) {
	angular.module('MANBlog')
		.config(function ($stateProvider) {
			$stateProvider
				.state('list', {
					url: "/",
					templateUrl: "blog-list/list.html"
				});
		})
		.controller('BlogListCtrl', function ($scope, $http) {

			$scope.loaded = false;
			$scope.posts = [];

			$http.get('/posts').then(function (response) {
				$scope.posts = response.data;
			}).finally(function () {
				$scope.loaded = true;
			});

		});
});
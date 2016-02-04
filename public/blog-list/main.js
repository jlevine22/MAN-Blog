define(['angular', 'ui-router'], function (angular) {
    angular.module('MANBlog')
        .config(function ($stateProvider) {
            $stateProvider
                .state('list', {
                    url: "/",
                    templateUrl: "blog-list/list.html"
                });
        })
        .controller('BlogListCtrl', function($scope, $http, $location) {

            $scope.search = {value:''};
            $scope.loaded = false;
            $scope.posts = [];
            $scope.tags = [];

            function loadPosts() {
                return $http({
                    method: 'GET',
                    url: '/posts?q=' + encodeURIComponent($scope.search.value),
                    params: $location.search()
                }).then(function(response) {
                    $scope.posts = response.data;
                }).finally(function () {
                    $scope.loaded = true;
                });
            };

            loadPosts();

            $scope.$on('$locationChangeSuccess', loadPosts);

            $http.get('/tags').then(function(response) {
                $scope.tags = response.data;
            });

            var searchAgain = false;
            var searchPending = false;
            var searchTimeout;

            $scope.$watch('search.value', function searchValueChanged(oldValue, newValue) {
                if (oldValue == newValue) {
                    return;
                }
                if (!searchTimeout) {
                    searchTimeout = setTimeout(function search() {
                        searchPending = true;
                        loadPosts().finally(function() {
                            searchPending = false;
                            searchTimeout = null;
                            if (searchAgain) {
                                searchAgain = false;
                                searchValueChanged();
                            }
                        });
                    }, 500);
                }
                if (searchPending) {
                    searchAgain = true;
                }
            });

            $scope.goTo = function(url) {
                window.location = url;
            };
        });
});
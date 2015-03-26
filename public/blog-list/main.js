define(['angular', 'ui-router'], function (angular) {
    angular.module('MANBlog')
        .config(function ($stateProvider) {
            $stateProvider
                .state('list', {
                    url: "/",
                    templateUrl: "blog-list/list.html"
                });
        })
        .controller('BlogListCtrl', function($scope, $http) {

            $scope.search = {value:''};
            $scope.loaded = false;
            $scope.posts = [];

            $http.get('/posts').then(function(response) {
                $scope.posts = response.data;
            }).finally(function () {
                $scope.loaded = true;
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
                        $http.get('/posts?q=' + encodeURIComponent($scope.search.value)).then(function(response) {
                            $scope.posts = response.data;
                        }).finally(function() {
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

        });
});
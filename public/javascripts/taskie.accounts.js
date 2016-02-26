$.ajaxSetup({
  xhrFields: {
    withCredentials: true
  }
});

angular.module('app', ['ui.bootstrap'])
  .controller('loginController', ['$scope', '$http', function($scope, $http) {
    $scope.userinfo = {};

    $scope.userinfo.username = "";
    $scope.userinfo.password = "";

    $scope.response = {};

    $scope.login = function() {
          $scope.code = null;
          $scope.response = null;

					var req = {
						method: 'POST',
						url: '/api/v1/users/login',
						data: JSON.stringify({
							username: $scope.userinfo.username,
							password: $scope.userinfo.password
						}),
						headers: {'Content-Type': 'application/json'},
					}

          $http(req).
            then(function(resp) {
              var response = resp.data;
							if (response.success) {
								window.setTimeout(function() {location.href = "/"} ,5000); // Redirect after 5 seconds!
							}
							$scope.status = resp.status;
              $scope.response = response;
							
            }, function(resp) {
              $scope.response = response.data || "Request failed";
              $scope.status = response.status;
          });
        };
  }])
  .controller('registerController', ['$scope', '$http', function($scope, $http) {
    $scope.userinfo = {};

    $scope.userinfo.username = "";
    $scope.userinfo.password = "";
    $scope.userinfo.password_conf = "";
    $scope.userinfo.firstname = "";
    $scope.userinfo.lastname = "";
    $scope.userinfo.email = "";
    $scope.userinfo.email_conf = "";

    $scope.response = {};

    $scope.register = function() {
          $scope.code = null;
          $scope.response = null;

					var req = {
						method: 'POST',
						url: '/api/v1/users/create',
						data: JSON.stringify({
							username: $scope.userinfo.username,
							password: $scope.userinfo.password,
							password_conf: $scope.userinfo.password_conf,
							firstname: $scope.userinfo.firstname,
							lastname: $scope.userinfo.lastname,
							email: $scope.userinfo.email,
							email_conf: $scope.userinfo.email_conf
						}),
						headers: {'Content-Type': 'application/json'},
					}

          $http(req).
            then(function(resp) {
              var response = resp.data;
							if (response.success) {
								window.setTimeout(function() {location.href = "/"} ,5000); // Redirect after 5 seconds!
							}
							$scope.status = resp.status;
              $scope.response = response;
							
            }, function(resp) {
              $scope.response = response.data || "Request failed";
              $scope.status = response.status;
          });
        };
  }]);

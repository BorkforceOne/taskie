// Set up ajax to send the cookie along with each request!
$.ajaxSetup({
  xhrFields: {
    withCredentials: true
  }
});

angular.module('taskie', ['ui.bootstrap', 'ngRoute'])
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        controller:'IndexController as indexController',
        templateUrl:'/html/views/index.html'
      })
      .when('/login', {
        controller:'LoginController as loginController',
        templateUrl:'/html/views/login.html'
      })
      .when('/register', {
        controller:'RegisterController as registerController',
        templateUrl:'/html/views/register.html'
      })
      .otherwise({
        redirectTo:'/'
      });
  })

  .controller('LoginController', ['$scope', '$http', '$location', function($scope, $http, $location) {
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
                $location.path("");
              }
              $scope.status = resp.status;
              $scope.response = response;
              
            }, function(resp) {
              $scope.response = response.data || "Request failed";
              $scope.status = response.status;
          });
        };
  }])
  .controller('IndexController', ['$scope', '$http', '$location', '$uibModal', function($scope, $http, $location, $uibModal) {
    
    /* Define $scope variables that will be used here */

    $scope.tasks = [];
    $scope.addtask = {};

    /* Define functions that will be used in this view here */

    var api = {};

    /*
     * getTasks(cb)
     * 
     * Attempts to get the current list of tasks
     * for the current user. Calls the callback
     * defined as the first argument with (err,
     * data).
     */

    api.getTasks = function (cb) {
      var req = {
        method: 'GET',
        url: '/api/v1/tasks'
      }
      
      return $http(req).
        then(function(resp) {
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };
    
    api.addTask = function (data, cb) {
      var req = {
        method: 'POST',
        url: '/api/v1/tasks',
        data: JSON.stringify({
          desc: data.description,
          title: data.title,
          date_due: data.datetime_due,
        }),
        headers: {'Content-Type': 'application/json'}
      }
      
      return $http(req).
        then(function(resp) {
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };

    api.updateTask = function (data, cb) {
      var req = {
        method: 'PUT',
        url: '/api/v1/tasks/' + data.task_id,
        data: JSON.stringify({
          desc: data.description,
          title: data.title,
          date_due: data.datetime_due,
          status: data.status
        }),
        headers: {'Content-Type': 'application/json'}
      }
      
      return $http(req).
        then(function(resp) {
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };

    api.delTask = function (data, cb) {
      var req = {
        method: 'DELETE',
        url: '/api/v1/tasks/' + data.task_id
      }
      
      return $http(req).
        then(function(resp) {
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };

    var processMessages = function (messages) {
      var niceMessages = [];
      for (var i=0; i<messages.length; i++) {
        console.log(result.messages[i]);
        switch (result.messages[i]) {
          case 'auth-failure':
            $location.path("login");
            break;

          default:
            niceMessages.push(messages[i]);
            break;
        }
      }
      
      if (niceMessages.length > 0) {
        showMessagesModal(niceMessages);
      }
    };

    var showMessagesModal = function (messages) {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/messages.html',
        controller: 'ModalMessagesController',
        size: 'lg',
        resolve: {
          messages: function () {
            return messages;
          }
        }
      });
    };

    var delTask = function (task_id) {
      var data = {
        task_id: task_id,
      };
      
      api.delTask(data, function (err, result) {
        if (err) {
          //Handle JS errors here!
        };
        // Check the messages and ensure that everything went alright
        // redirect on a auth-failure
        // TODO: Seperate this out to a seperate function that processes
        //       all messages and performs the correct action based on that.
        for (var i=0; i<result.messages.length; i++) {
          console.log(result.messages[i]);
          if (result.messages[i] == 'auth-failure') {
            $location.path("login");
          }
        }

        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          var new_tasks = [];
          for (var i=0; i<$scope.tasks.length; i++) {
            if ($scope.tasks[i].data.TaskID == task_id)
              continue;
            new_tasks.push($scope.tasks[i]);
          }
          $scope.tasks = new_tasks;
        }
      });
    };

    var addTask = function (title, description, datetime_due) {
      var data = {
        title: title,
        description: description,
        datetime_due: datetime_due,
      };

      api.addTask(data, function (err, result) {
        if (err) {
          //Handle JS errors here!
        };
        // Check the messages and ensure that everything went alright
        // redirect on a auth-failure
        // TODO: Seperate this out to a seperate function that processes
        //       all messages and performs the correct action based on that.
        for (var i=0; i<result.messages.length; i++) {
          console.log(result.messages[i]);
          if (result.messages[i] == 'auth-failure') {
            $location.path("login");
          }
        }

        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          $scope.tasks = $scope.tasks.concat(result.data);
        }
      });
    };

    var updateTask = function (task_id, title, description, datetime_due, status) {
      var data = {
        task_id: task_id,
        title: title,
        description: description,
        datetime_due: datetime_due,
        status: status
      };

      api.updateTask(data, function (err, result) {
        if (err) {
          //Handle JS errors here!
        };
        // Check the messages and ensure that everything went alright
        // redirect on a auth-failure
        // TODO: Seperate this out to a seperate function that processes
        //       all messages and performs the correct action based on that.
        for (var i=0; i<result.messages.length; i++) {
          console.log(result.messages[i]);
          if (result.messages[i] == 'auth-failure') {
            $location.path("login");
          }
        }

        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          for (var i=0; i<$scope.tasks.length; i++) {
            if ($scope.tasks[i].data.TaskID == task_id) {
              var task = $scope.tasks[i];
              task.data = result.data[0].data;
              break;
            }
          }
        }
      });
    };

    var getTasks = function () {
      api.getTasks(function (err, result) {
        if (err) {
          //Handle JS errors here!
        };
        // Check the messages and ensure that everything went alright
        // redirect on a auth-failure
        // TODO: Seperate this out to a seperate function that processes
        //       all messages and performs the correct action based on that.
        for (var i=0; i<result.messages.length; i++) {
          console.log(result.messages[i]);
          if (result.messages[i] == 'auth-failure') {
            $location.path("login");
          }
        }

        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          $scope.tasks = result.data;
        }
      });
    };

    $scope.showTaskModal = function(task) {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/task.html',
        controller: 'ModalTaskController',
        size: 'lg',
        resolve: {
          task: function () {
            return task;
          }
        }
      });

      modalInstance.result.then(function (task) {
        if (task.TaskID == undefined) {
          addTask(task.Title, task.Description, task.DateDue);
        }
        else {
          updateTask(task.TaskID, task.Title, task.Description, task.DateDue);
        }
      }, function () {
        console.log('Modal dismissed at: ' + new Date());
      });
    };
    
    $scope.taskGetDueDate = function (task) {
      return moment(task.data.DateDue);
    }


    getTasks();

    $scope.addTask = addTask;
    $scope.updateTask = updateTask;
    $scope.getTasks = getTasks;
    $scope.delTask = delTask;
  }])
  .controller('RegisterController', ['$scope', '$http', '$location', function($scope, $http, $location) {
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
                $location.path("");
              }
              $scope.status = resp.status;
              $scope.response = response;
              
            }, function(resp) {
              $scope.response = response.data || "Request failed";
              $scope.status = response.status;
          });
        };
  }])
  .controller('ModalTaskController', function ($scope, $uibModalInstance, task) {
    
    if (task == undefined)
      task = {};
    $scope.task = task;

    $scope.initDatetime = function () {
      $('#datetimepicker').datetimepicker();
      if (task.DateDue) {
        $('#datetimepicker').data("DateTimePicker").date(moment(task.DateDue));
      }
      else {
        $('#datetimepicker').data("DateTimePicker").date(new Date());
      }
    };

    $scope.ok = function () {
      // Set datetime_due here because it cannot directly modify a ng-model
      $scope.task.DateDue = moment.utc($('#datetimepicker').data("DateTimePicker").date()).toISOString();
      // Return what's changed
      $uibModalInstance.close($scope.task);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  });

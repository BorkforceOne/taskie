// Set up ajax to send the cookie along with each request!
$.ajaxSetup({
  xhrFields: {
    withCredentials: true
  }
});


angular.module('taskie', ['ui.bootstrap', 'ngRoute'])
	// Defines views 
  .config(function($routeProvider) {
	// Where to go based on the url input 
    $routeProvider
		// Go to index 
      .when('/', {
        controller:'IndexController as indexController',
        templateUrl:'/html/views/index.html'
      })
	  // Go to login page 
      .when('/login', {
        controller:'LoginController as loginController',
        templateUrl:'/html/views/login.html'
      })
	  // Go to register 
      .when('/register', {
        controller:'RegisterController as registerController',
        templateUrl:'/html/views/register.html'
      })
	  // Go to index 
      .otherwise({
        redirectTo:'/'
      });
  })
  .factory('taskieAPI', ['$http', '$location', '$uibModal', function($http, $location, $uibModal) {
    var api = {};
    // cb - call back function 
	
	// Data usage: {verificationCode: code}
    api.verifyUser = function (data, cb) {
      var req = {
        method: 'POST',
        url: '/api/v1/users/verify',
        data: JSON.stringify({
          verificationCode: data.verificationCode,
        }),
        headers: {'Content-Type': 'application/json'}
      }
      
      return $http(req).
        then(function(resp) {
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };
	
	/*
	* 	userLogin(data, cb)
	* 	
	*	Attempts to login a user based on login information. 
	*	
	* 	Takes user information sent by the login page 
	*	and turns it into a JSON object to be POSTed.
	*/
    api.userLogin = function(data, cb) {
	  // Set up the "package/request" to be sent 
      var req = {
        method: 'POST',
        url: '/api/v1/users/login',
        data: JSON.stringify({
          username: data.username,
          password: data.password
        }),
        headers: {'Content-Type': 'application/json'},
      }
	  // Send the request 
      return $http(req).
        then(function(resp) {
		  // If success, goes through messages and sets the 
		  // up into a modal for the user to be able to read. 
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) { 
		  // If failure, send error message 
          return cb(resp.status, resp.data);
      });
    };

	/*
	 * 	userRegister(data, callback function)
	 *	
	 *	Attempts to register a user based on 
	 *	information passed in by the user. 
	 *	
	 *	Sets up POST request with the user data 
	 * 	passed in from the registration page and 
	 * 	sends it. 
	 */
    api.userRegister = function(data, cb) {
	  // Set up request for a register 
      var req = {
        method: 'POST',
        url: '/api/v1/users/create',
        data: JSON.stringify({
          username: data.username,
          password: data.password,
          password_conf: data.password_conf,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          email_conf: data.email_conf
        }),
        headers: {'Content-Type': 'application/json'},
      }
	  // Send the request 
      return $http(req).
        then(function(resp) {
		  // On success, show user messages 
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
		  // On failure send error message 
          return cb(resp.status, resp.data);
      });
    };

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
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };
    
	/*
	 *	addTask(data, cb)
	 *	
	 *	Attempts to add a user created task to
	 *	the users task list. 
	 *	
	 *	Builds a POST request for adding the new 
	 *  task information input by the user. 
	 */
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
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };

	/*
	 * updateTask(data, cb)
	 * 
	 * Attempts to update the task information after a task 
	 * has been edited by the user. 
	 * 
	 * Builds the POST request with the edited data
	 * of a task, input by the user. 
	 * 
	 */
    api.updateTask = function (data, cb) {
      var req = {
        method: 'PUT',
        url: '/api/v1/tasks/' + data.task_id,
        data: JSON.stringify({
          desc: data.description,
          title: data.title,
          date_due: data.datetime_due,
          status: data.status,
		  tags: data.tags, 
        }),
        headers: {'Content-Type': 'application/json'}
      }
      
      return $http(req).
        then(function(resp) {
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };

	/*
	 * delTask(data, cb)
	 * 
	 * Attempts send a DELETE request 
	 * to remove a task from a users task list 
	 * 
	 * Builds the DELETE request with the information
	 * regarding the ID of the task to be deleted. 
	 */
    api.delTask = function (data, cb) {
      var req = {
        method: 'DELETE',
        url: '/api/v1/tasks/' + data.task_id
      }
      
      return $http(req).
        then(function(resp) {
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    };

	/*
	 * processMessages(messages)
	 * 
	 * Takes in a set of returned messages and 
	 * determines which messages to show to the user 
	 * based on the error messages returned. 
	 */
    var processMessages = function (messages) {
      var niceMessages = [];
      var title = "Messages From the Server";

      for (var i=0; i<messages.length; i++) {
        console.log(messages[i]);
		// Check which error message was returned and display a
		// user friendly equivalent with the UI. 
        switch (messages[i]) {
          case 'auth-failure':
            $location.path("login");
            break;

          case 'task-create-error':
            title = "Task Create Error";
            niceMessages.push("An error occured creating the task, please ensure that at least the task title is defined");
            break;

          case 'user-login-error':
            title = "Login Error";
            niceMessages.push("Invalid username or password");
            break;

          case 'username-length-error':
            title = "Registration Error";
            niceMessages.push("Username must be at least 2 characters long");
            break;

          case 'username-illegal-character-error':
            title = "Registration Error";
            niceMessages.push("Username contains illegal characters (spaces)");
            break;

          case 'username-inuse-error':
            title = "Registration Error";
            niceMessages.push("Username is already in use");
            break;

          case 'email-mismatch-error':
            title = "Registration Error";
            niceMessages.push("Emails do not match");
            break;

          case 'email-inuse-error':
            title = "Registration Error";
            niceMessages.push("Email is already in use");
            break;

          case 'email-illegal-character-error':
            title = "Registration Error";
            niceMessages.push("Email contains illegal characters");
            break;

          case 'password-mismatch-error':
            title = "Registration Error";
            niceMessages.push("Passwords do not match");
            break;

          case 'password-length-error':
            title = "Registration Error";
            niceMessages.push("Password must be at least 6 characters long");
            break;

          default:
            niceMessages.push(messages[i]);
            break;
        }
      }
      
      if (niceMessages.length > 0) {
        showMessagesModal(title, niceMessages);
      }
    };

	/*
	 * showMessagesModal(title, messages)
	 * 
	 * Creates a modal/window for the user that displays 
	 * a passed in message. 
	 */
    var showMessagesModal = function (title, messages) {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/messages.html',
        controller: 'ModalMessagesController',
        size: 'lg',
        resolve: {
          messages: function () {
            return messages;
          },
          title: function () {
            return title;
          }
        }
      });
    };
    api.showMessagesModal = showMessagesModal;

    return api;
  }])

  
  .controller('LoginController', ['$scope', '$http', '$location', '$routeParams', 'taskieAPI', function($scope, $http, $location, $routeParams, taskieAPI) {
    $scope.userinfo = {};

    $scope.userinfo.username = "";
    $scope.userinfo.password = "";

    $scope.response = {};

    $scope.url = $routeParams.url;

    var userLogin = function () {
      var data = {
        username: $scope.userinfo.username,
        password: $scope.userinfo.password
      }

      taskieAPI.userLogin(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          $location.path("");
        }
      });
    };

    $scope.userLogin = userLogin;

    var verifyUser = function (code) {
      var data = {
        verificationCode: code,
      };
      
      taskieAPI.verifyUser(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          taskieAPI.showMessagesModal('Success!', ['Success! You may now login!']);
        }
      });
    };

    if ($routeParams.code != undefined) {
      verifyUser($routeParams.code);
    }

  }])
  .controller('RegisterController', ['$scope', '$http', '$location', 'taskieAPI', function($scope, $http, $location, taskieAPI) {
    $scope.userinfo = {};

    $scope.userinfo.username = "";
    $scope.userinfo.password = "";
    $scope.userinfo.password_conf = "";
    $scope.userinfo.firstname = "";
    $scope.userinfo.lastname = "";
    $scope.userinfo.email = "";
    $scope.userinfo.email_conf = "";

    var userRegister = function() {
      var data = {
        username: $scope.userinfo.username,
        password: $scope.userinfo.password,
        password_conf: $scope.userinfo.password_conf,
        firstname: $scope.userinfo.firstname,
        lastname: $scope.userinfo.lastname,
        email: $scope.userinfo.email,
        email_conf: $scope.userinfo.email_conf
      }

      taskieAPI.userRegister(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          taskieAPI.showMessagesModal('Success!', ["Please check your email. We've sent an email to verify your account!", "You may login as soon as you verify your account"]);
        }
      });
    };

    $scope.userRegister = userRegister;
  }])
  .controller('ModalTaskController', function ($scope, $uibModalInstance, task) {
    
    if (task == undefined)
      task = {};
    $scope.task = task;
    $scope.newTag = "";

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

    $scope.addTaskTag = function () {
      if ($scope.task.Tags == undefined) {
        $scope.task.Tags = [];
      }
      $scope.task.Tags.push($scope.newTag);
      $scope.newTag = "";
    };
    
    $scope.removeTaskTag = function (tag) {
		var new_tags = [];
		for (var i = 0; i < $scope.task.Tags.length; i++){
			if ($scope.task.Tags[i] == tag)	{
				continue;
			}
			new_tags.push($scope.task.Tags[i]);
		}
		$scope.task.Tags = new_tags;
    };
  })
  .controller('ModalMessagesController', function ($scope, $uibModalInstance, messages, title) {
    
    $scope.messages = messages;
    $scope.title = title;

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  })
  .controller('IndexController', ['$scope', '$http', '$location', '$uibModal', 'taskieAPI', function($scope, $http, $location, $uibModal, taskieAPI) {
    /* Define $scope variables that will be used here */

    $scope.tasks = [];
    $scope.Constants = {};

    var Constants = {};
    Constants.STATUS_COMPLETED = 2;
    Constants.STATUS_INPROGRESS = 1;
    $scope.Constants = Constants;

    $scope.tasksInProgress = [];
    $scope.tasksCompleted = [];


    // Watch our raw tasks here and update the list as stuff changes
    $scope.$watch(function() {return $scope.tasks}, function (tasks){
      var tasksInProgress = [];
      var tasksCompleted = [];
      for (var i=0; i<tasks.length; i++) {
        var taskData = tasks[i].data;
        switch (taskData.Status) {
          case Constants.STATUS_COMPLETED:
            tasksCompleted.push(taskData);
            break;

          case Constants.STATUS_INPOROGRESS:
          default:
            tasksInProgress.push(taskData);
            break;
        }
      }

      $scope.tasksInProgress = tasksInProgress;
      $scope.tasksCompleted = tasksCompleted;
    }, true);

    /* Define functions that will be used in this view here */

    var delTask = function (task_id) {
      var data = {
        task_id: task_id,
      };
      
      taskieAPI.delTask(data, function (err, result) {
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

      taskieAPI.addTask(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          $scope.tasks = $scope.tasks.concat(result.data);
        }
      });
    };

    var updateTask = function (task_id, title, description, datetime_due, status, tags) {
      var data = {
        task_id: task_id,
        title: title,
        description: description,
        datetime_due: datetime_due,
        status: status,
		tags: tags,
      };

      taskieAPI.updateTask(data, function (err, result) {
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
      taskieAPI.getTasks(function (err, result) {
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
          updateTask(task.TaskID, task.Title, task.Description, task.DateDue, task.Status, task.Tags);
        }
      }, function () {
        //console.log('Modal dismissed at: ' + new Date());
      });
    };
    
    $scope.taskGetDueDate = function (task) {
      return moment(task.DateDue);
    }

    $scope.taskGetModifiedDate = function(task) {
      return moment(task.DateUpdated);
    }

    $scope.dateCompareNow = function(date) {
      return moment().diff(date, 'minutes');
    }

    getTasks();

    $scope.addTask = addTask;
    $scope.updateTask = updateTask;
    $scope.getTasks = getTasks;
    $scope.delTask = delTask;
  }]);

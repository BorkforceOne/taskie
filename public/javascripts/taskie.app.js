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
        templateUrl:'/html/views/index.html',
        reloadOnSearch: false
      })
	  // Go to login page 
      .when('/login', {
        controller:'LoginController as loginController',
        templateUrl:'/html/views/login.html',
        reloadOnSearch: false
      })
	  // Go to register 
      .when('/register', {
        controller:'RegisterController as registerController',
        templateUrl:'/html/views/register.html',
        reloadOnSearch: false
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
    api.activateUser = function (data, cb) {
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
	 * 	userRecover(data, callback function)
	 *	
	 *	Attempts to recover a user based on 
	 *	email passed in by the user. 
	 *	
	 *	Sets up POST request with the user data 
	 * 	passed in from the registration page and 
	 * 	sends it. 
	 */
    api.userRecover = function(data, cb) {
	  // Set up request for a register 
      var req = {
        method: 'POST',
        url: '/api/v1/users/recover',
        data: JSON.stringify({
          Email: data.Email,
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
	 * 	userReset(data, callback function)
	 *	
	 *	Attempts to reset a user's password based on 
	 *	code provided by the user. 
	 *	
	 *	Sets up POST request with the user data 
	 * 	passed in from the registration page and 
	 * 	sends it. 
	 */
    api.userReset = function(data, cb) {
	  // Set up request for a register 
      var req = {
        method: 'POST',
        url: '/api/v1/users/reset',
        data: JSON.stringify({
	        RecoveryCode: data.RecoveryCode,
	        Password: data.Password,
	        PasswordConf: data.PasswordConf,
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
   *  userGet(data, callback function)
   *  
   *  Attempts to get basic user information about
   *  the currently logged in user.
   *  
   *  Sets up GET request and sends it.
   */
    api.userGet = function(data, cb) {
    // Set up request 
      var req = {
        method: 'GET',
        url: '/api/v1/user',
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

    api.broadcastTask = function(data, cb) {
      var req = {
        method: 'GET',
        url: '/api/v1/tasks/broadcast/' + data.TaskID,
        headers: {'Content-Type': 'application/json'}
      }
      return $http(req).
        then(function(resp) {
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    }
    
    api.receiveTask = function(data, cb) {
      var req = {
        method: 'GET',
        url: '/api/v1/tasks/receive/' + data.Code,
        headers: {'Content-Type': 'application/json'}
      }
      return $http(req).
        then(function(resp) {
          processMessages(resp.data.messages);
          return cb(null, resp.data);
        }, function(resp) {
          return cb(resp.status, resp.data);
      });
    }

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
          tags: data.tags,
          priority: data.priority,
          parent_id: data.parent_id,
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
    		  priority: data.priority,
          parent_id: data.parent_id,
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
   * updateUser(data, cb)
   * 
   * Attempts to update the user information after it
   * has been edited by the user. 
   * 
   * Builds the PUT request with the edited data
   * of a user, input by the user. 
   * 
   */
    api.updateUser = function (data, cb) {
      var req = {
        method: 'PUT',
        url: '/api/v1/user',
        data: JSON.stringify({
          NotificationInterval: data.NotificationInterval,
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
   * deleteUser(data, cb)
   * 
   * Attempts to delete the user from Taskie
   * 
   * Builds and runs the DELETE request
   * 
   */
    api.deleteUser = function (data, cb) {
      var req = {
        method: 'DELETE',
        url: '/api/v1/user',
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
					
					case 'user-update-error':
						title = "Update error";
						niceMessages.push("An error occured updating your settings. Please try again.");
						break;
						
					case 'user-delete-error':
						title = "Deletion Error";
						niceMessages.push("An error occured while deleting your user account.");
						break;
						
					case 'user-recover-error':
						title = "Account Recovery Error";
						niceMessages.push("An error occured when recovering your account. Please try again later.");
						break;
						
					case 'user-reset-error':
						title = "Account Reset Error";
						niceMessages.push("An issue occured when trying to resetting your account. Please try again later.");
						break;
						
					case 'task-broadcast-error':
						title = "Error with task broadcasting.";
						niceMessages.push("An issue occured when trying to broadcast the task.");
						break;
						
					case 'task-recieve-nonexistent':
						title = "Recieve task error.";
						niceMessages.push("The task you are trying to recieve doesn't exist.");
						break;
						
					case 'task-receive-error':
						title = "Recieve task error";
						niceMessages.push("An error occured when receiving the task.");
						break;
						
					case 'task-update-error':
						title = "Task Update Error";
						niceMessages.push("An error occured saving changes to your task. Please try again later.");
						break;
						
					case 'user-login-reset-error':
						title = "Error Logging In";
						niceMessages.push("That account has requested a password reset. Please try to login again after resetting your password.");
						break;
						
					case 'task-delete-error':
						title = "Task deletion error";
						niceMessages.push("There was a problem deleting that task.");
						break;
						
					case 'task-nonexistent':
						title: "Woops! That task doesn't exist!";
						niceMessages.push("The task you were trying to delete doesn't exist. It may have been previously deleted.");
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

  
  .controller('LoginController', ['$scope', '$http', '$location', '$routeParams', '$uibModal', 'taskieAPI', function($scope, $http, $location, $routeParams, $uibModal, taskieAPI) {
    $scope.userinfo = {};
    $scope.userinfo.username = "";
    $scope.userinfo.password = "";

    $scope.userLogin = function () {
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

    $scope.showRecoverPasswordModal = function () {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/recover-password.html',
        controller: 'ModalRecoverPasswordController',
        size: 'md',
      });
    };

    var activateUser = function (code) {
      var data = {
        verificationCode: code,
      };
      
      taskieAPI.activateUser(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          taskieAPI.showMessagesModal('Success!', ['Success! You may now login!']);
        }
      });
    };

    var resetUser = function(code) {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/reset-password.html',
        controller: 'ModalResetPasswordController',
        size: 'md',
        resolve: {
          code: function () {
            return code;
          },
        }
      });
    }

    if ($routeParams.code != undefined) {
    	if ($routeParams.type == "activation") {
	      activateUser($routeParams.code);
    	}
    	if ($routeParams.type == "recover") {
    		resetUser($routeParams.code);
    	}
    }
    $location.url($location.path());
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
          $scope.userinfo.username = "";
          $scope.userinfo.password = "";
          $scope.userinfo.password_conf = "";
          $scope.userinfo.firstname = "";
          $scope.userinfo.lastname = "";
          $scope.userinfo.email = "";
          $scope.userinfo.email_conf = "";
          taskieAPI.showMessagesModal('Success!', ["Please check your email. We've sent an email to verify your account!", "You may login as soon as you verify your account"]);
        }
        else {
          $scope.userinfo.password = "";
          $scope.userinfo.password_conf = "";
          $scope.userinfo.email = "";
          $scope.userinfo.email_conf = "";
        }
      });
    };

    $scope.userRegister = userRegister;
  }])
  .controller('ModalRecoverPasswordController', function ($scope, $uibModalInstance, taskieAPI) {
  	$scope.email = "";


    var userRecover = function() {
      var data = {
        Email: $scope.email,
      }

      taskieAPI.userRecover(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          taskieAPI.showMessagesModal('Success!', ["Please check your email. We've sent an email to recover your account and reset your password!"]);
        }
      });
    };

    $scope.ok = function () {
    	userRecover();
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  })
  .controller('ModalResetPasswordController', function ($scope, $uibModalInstance, taskieAPI, code) {
  	$scope.email = "";
  	$scope.code = code;

    var userReset = function() {
      var data = {
        RecoveryCode: $scope.code,
        Password: $scope.password,
        PasswordConf: $scope.password_conf,
      }

      taskieAPI.userReset(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          taskieAPI.showMessagesModal('Success!', ["You may now login!"]);
          $uibModalInstance.close();
        }
      });
    };

    $scope.ok = function () {
    	userReset();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  })
  .controller('ModalTaskController', function ($scope, $uibModalInstance, taskieAPI, task, parentID) {
    
    if (task == undefined) {
      task = {};
      task.Priority = 0;
      task.ParentTaskID = parentID;
    }
    $scope.task = $.extend(true, {}, task);
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
      if ($scope.newTag == "") {
        taskieAPI.showMessagesModal('Woops', ["You can not add a blank tag"]);
        return;
      }

      if ($scope.task.Tags == undefined) {
        $scope.task.Tags = [];
      }
  	  for (var i = 0; i < $scope.task.Tags.length; i++){
  		  if ($scope.newTag == $scope.task.Tags[i]){
  			  taskieAPI.showMessagesModal('Woops', ["That tag is already associated with this task!"]);
  			  return;
  		  }
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
  .controller('ModalUserSettingsController', function ($scope, $uibModalInstance, $uibModal, $location, taskieAPI) {
    $scope.user = {};

    var userGet = function () {
      taskieAPI.userGet(null, function (err, result) {
        if (result.success) {
          $scope.user = result.data;
        }
      });
    }
    userGet();

    var updateUser = function () {
      var data = {NotificationInterval: $scope.user.NotificationInterval};
      taskieAPI.updateUser(data, function (err, result) {
        if (result.success) {
          $scope.user = result.data;
        }
      });
    }

    var deleteUser = function () {
      taskieAPI.deleteUser(null, function (err, result) {
        if (result.success) {
          $location.path("login");
        }
      });
    }

    $scope.deleteAccount = function () {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/question.html',
        controller: 'ModalMessagesController',
        size: 'md',
        resolve: {
          messages: function () {
            return "Are you sure you want to delete your account? This cannot be undone!";
          },
          title: function () {
            return "Delete Account";
          }
        }
      });

      modalInstance.result.then(function (task) {
        deleteUser();
        $scope.cancel();
      }, function () {
        console.log("Phew, that was close!");
      });
    }

    $scope.ok = function () {
      updateUser();
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  })
  .controller('IndexController', ['$scope', '$http', '$location', '$uibModal', '$routeParams', 'taskieAPI', function($scope, $http, $location, $uibModal, $routeParams, taskieAPI) {
    /* Define $scope variables that will be used here */

    $scope.tasks = [];
		$scope.sortedTasks = [];
    $scope.Constants = {};
		$scope.filterTags = [];
		$scope.sortBy = "DateDue";
    $scope.metadata = {};
    $scope.user = {};

    var Constants = {};
    Constants.STATUS_COMPLETED = 2;
    Constants.STATUS_INPROGRESS = 1;
    $scope.Constants = Constants;

    // Watch our raw tasks here and update the list as stuff changes
    $scope.$watch('[tasks, sortBy, filterTags]', function (){
      var tasks = [];
      var metadata = {};

      var buildTree = function (data) {
        var idToNodeMap = {}; //Keeps track of nodes using id as key, for fast lookup
        var root = []; //Initially set our loop to null

        //loop over data

        for (var i in data) {
          var datum = data[i];

          idToNodeMap[datum.TaskID] = datum;
          metadata[datum.TaskID] = {};
          metadata[datum.TaskID].children = [];
        }

        for(var i in data) {
            var datum = data[i];

            //add an entry for this node to the map so that any future children can
            //lookup the parent
            if (datum.ParentTaskID != null) {
              //Let's add the current node as a child of the parent node.
              if (idToNodeMap[datum.ParentTaskID])
	              metadata[idToNodeMap[datum.ParentTaskID].TaskID].children.push(datum);
            }
            else {
              root.push(datum);
            }
        }
        return root;
      }
			

      var tmpTasks = buildTree($scope.tasks);
			
			var getProgress = function(task){
				var counter = 0;
				var childrenTasks = metadata[task.TaskID].children;
				if (task.Status == Constants.STATUS_COMPLETED){
					metadata[task.TaskID].progress = 100;
					counter += 100;
				}
				else{
					metadata[task.TaskID].progress = 0;
				}
				for (var j = 0; j< childrenTasks.length; j++){
					getProgress(childrenTasks[j]);
					counter += metadata[childrenTasks[j].TaskID].progress;
				}
				metadata[task.TaskID].progress = Math.round(counter / (childrenTasks.length + 1));			
			}
			
			for(var i = 0; i < tmpTasks.length; i++){
				getProgress(tmpTasks[i]);
			}	
			
      // Step 1: Only add non-filtered tasks
      for (var i=0; i<tmpTasks.length; i++) {
        var task = tmpTasks[i];
        var filtered = false;
        for (var filterTagIndex=0; filterTagIndex<$scope.filterTags.length; filterTagIndex++) {
          var found = false;
					// Check if there are not tags assosciated with the task. If there are not tags 
					// 	assosciated with it, make it filtered and break out of the loop because you 
					//	don't want to compare a list of tasks to an empty list. 
					if (task.Tags == null){
						filtered == true;
						break;
					}
          for (var taskTagIndex=0; taskTagIndex<task.Tags.length; taskTagIndex++) {
            if ($scope.filterTags[filterTagIndex] == task.Tags[taskTagIndex]) {
              found = true;
              break;
            }
          }
          if (!found) {
            filtered = true;
            break;
          }
        }

        if (!filtered) {
          tasks.push(task);
        }
      }

      // Step 3, push all completed tasks to the end
      var tasksCompleted = [];
      var tasksInProgress = [];
      for (var i in tasks) {
        if (tasks[i].Status == Constants.STATUS_COMPLETED)
          tasksCompleted.push(tasks[i]);
        if (tasks[i].Status == Constants.STATUS_INPROGRESS)
          tasksInProgress.push(tasks[i]);
      }

      // Step 2: Sort by whatever we're sorting by
      switch ($scope.sortBy) {
        case "DateDue":
          tasksInProgress.sort(function (a, b) {
            return moment(a.DateDue) - moment(b.DateDue);
          });
        break;

        case "Priority":
          tasksInProgress.sort(function (a, b) {
            var result = b.Priority - a.Priority;
            if (result == 0) {
              return moment(a.DateDue) - moment(b.DateDue);
            }
            return result;
          });
        break;

        case "Alphabetical":
          tasksInProgress.sort(function (a, b) {
            return a.Title.localeCompare(b.Title);
          });
        break;
				
				case "Completion":
					tasksInProgress.sort(function (a, b){
						return metadata[b.TaskID].progress - metadata[a.TaskID].progress;
					});
					break;
      }

      tasksCompleted.sort(function (a, b) {
        return moment(b.DateUpdated) - moment(a.DateUpdated);
      });

      tasksSorted = tasksInProgress.concat(tasksCompleted);

      // Step 4, add metadata!
      for (var i in $scope.tasks) {
        var task = $scope.tasks[i];

        var timeDiff = moment().diff(task.DateDue, 'minutes');        
        if (timeDiff > 0)
          metadata[task.TaskID].panel_type = 'panel-danger';
        else if (timeDiff > -1440)
          metadata[task.TaskID].panel_type = 'panel-warning';
        else
          metadata[task.TaskID].panel_type = 'panel-info';

        if (task.Status == Constants.STATUS_COMPLETED) {
          metadata[task.TaskID].panel_type = 'panel-default';
          metadata[task.TaskID].toggleTo = Constants.STATUS_INPROGRESS;
        }
        else {
          metadata[task.TaskID].toggleTo = Constants.STATUS_COMPLETED;
        }

        // Copy existing metadata that we care about

        if ($scope.metadata[task.TaskID]) {
          metadata[task.TaskID].open = $scope.metadata[task.TaskID].open;
          if ((task.Description == null || task.Description == "") && metadata[task.TaskID].children.length == 0) {
            metadata[task.TaskID].open = false;
          }
        }
      }
      
      $scope.metadata = metadata;
      $scope.tasksSorted = tasksSorted;
    }, true);

    /* Define functions that will be used in this view here */

    var userGet = function () {
      taskieAPI.userGet(null, function (err, result) {
        if (result.success) {
          $scope.user = result.data;
        }
      });
    }

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
            if ($scope.tasks[i].TaskID == task_id)
              continue;
            new_tasks.push($scope.tasks[i]);
          }
          $scope.tasks = new_tasks;
        }
      });
    };

    var addTask = function (title, description, datetime_due, tags, priority, parent_id) {
      var data = {
        title: title,
        description: description,
        datetime_due: datetime_due,
        tags: tags,
        priority: priority,
        parent_id: parent_id,
      };

      taskieAPI.addTask(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          $scope.tasks.push(result.data[0]);
        }
      });
    };

    var updateTask = function (task_id, title, description, datetime_due, status, tags, priority, parent_id) {
      var data = {
        task_id: task_id,
        title: title,
        description: description,
        datetime_due: datetime_due,
        status: status,
    		tags: tags,
    		priority: priority,
        parent_id: parent_id,
      };

      taskieAPI.updateTask(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
          // Set the tasks to the list we just got back!
          for (var i=0; i<$scope.tasks.length; i++) {
            if ($scope.tasks[i].TaskID == task_id) {
              $scope.tasks[i] = result.data[0];
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

    $scope.broadcastTask = function (TaskID) {
    	var data = {
    		TaskID: TaskID,
    	}

    	if ($scope.metadata[TaskID].broadcast_link == null) {
	      taskieAPI.broadcastTask(data, function (err, result) {
	        // See if we actually got what we were expecting, despite possible
	        // messages from the server.
	        if (result.success) {
	        	$scope.metadata[TaskID].broadcast_link = result.data.Link;
	        	$scope.metadata[TaskID].broadcast_open = true;
            setTimeout(function(){
                console.log($( "#broadcastLink" ).focus());
            }, 10);
	        }
	      });
	    }
      else {
        setTimeout(function(){
            console.log($( "#broadcastLink" ).focus());
        }, 10);
      }
    }

    $scope.showTaskModal = function(task, parentID, received) {
      var depth = 0;
      var tmpParentID = parentID;
      while (tmpParentID != null) {
        for (var i=0; i<$scope.tasks.length; i++) {
          if ($scope.tasks[i].TaskID == tmpParentID) {
            tmpParentID = $scope.tasks[i].ParentTaskID;
            depth++;
          }
        }
      }

      if (depth >= 3) {
        taskieAPI.showMessagesModal("Oops!", ["Maximum nesting level reached."]);
        return;
      }

      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/task.html',
        controller: 'ModalTaskController',
        size: 'lg',
        resolve: {
          task: function () {
            return task;
          },
          parentID: function() {
            return parentID;
          }
        }
      });

      modalInstance.result.then(function (task) {
        if (task.TaskID == undefined) {
	        addTask(task.Title, task.Description, task.DateDue, task.Tags, task.Priority, task.ParentTaskID);
        }
        else {
	        updateTask(task.TaskID, task.Title, task.Description, task.DateDue, task.Status, task.Tags, task.Priority, task.ParentTaskID);
        }
      }, function () {
        //console.log('Modal dismissed at: ' + new Date());
      });
    };
    
    $scope.isSimple = function (task) {
      return ((task.Description == null || task.Description == "") && $scope.metadata[task.TaskID].children.length == 0);
    }

    $scope.taskGetDueDate = function (task) {
      return moment(task.DateDue);
    }

    $scope.taskGetModifiedDate = function(task) {
      return moment(task.DateUpdated);
    }

    $scope.dateCompareNow = function(date) {
      return moment().diff(date, 'minutes');
    }
		
		$scope.setSortBy = function(sort_index){
			$scope.sortBy = sort_index;
		}
		
		$scope.addFilterTag = function(tag){
			for (var i=0; i<$scope.filterTags.length; i++){
				if ($scope.filterTags[i] == tag){
					$scope.delFilterTag(tag);
          return;
				}
			}
			$scope.filterTags.push(tag);
		}
		
		$scope.delFilterTag = function(tag){
			var filter_tags = [];
			for (var i=0; i<$scope.filterTags.length; i++) {
				if ($scope.filterTags[i] == tag)
					continue;
				filter_tags.push($scope.filterTags[i]);
			}
			$scope.filterTags = filter_tags;
		}


    $scope.showUserSettingsModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/views/modals/user-settings.html',
        controller: 'ModalUserSettingsController',
        size: 'md',
      });
    };

    var receiveTask = function(code) {
      var data = {
        Code: code,
      };

      taskieAPI.receiveTask(data, function (err, result) {
        // See if we actually got what we were expecting, despite possible
        // messages from the server.
        if (result.success) {
        	var task = result.data;
          if (task.Children.length > 0) {
            var modalInstance = $uibModal.open({
              templateUrl: '/html/views/modals/question.html',
              controller: 'ModalMessagesController',
              size: 'md',
              resolve: {
                messages: function () {
                  return "Would you like to receive this complex task?";
                },
                title: function () {
                  return "Receive Complex Task";
                }
              }
            });

            modalInstance.result.then(function () {
              // We need to know the parent task ID before we can add the children
              var addChildTasks = function (parentTask, parentTaskID) {
                var data = {
                  title: parentTask.Title,
                  description: parentTask.Description,
                  datetime_due: parentTask.DateDue,
                  tags: parentTask.Tags,
                  priority: parentTask.Priority,
                  parent_id: parentTaskID,
                };

                taskieAPI.addTask(data, function (err, result) {
                  // See if we actually got what we were expecting, despite possible
                  // messages from the server.
                  if (result.success) {
                    // Set the tasks to the list we just got back!
                    var task = result.data[0];
                    $scope.tasks.push(task);
                    for (var i=0; i < parentTask.Children.length; i++) {
                      addChildTasks(parentTask.Children[i], task.TaskID);
                    }
                  }
                });
              }

              addChildTasks(task);
            }, function () {
              console.log("Didn't add new complex task...");
            });
          }
          else {
          	$scope.showTaskModal(task, null);
          }
        }
      });
    }

    userGet();
    getTasks();

    $scope.addTask = addTask;
    $scope.updateTask = updateTask;
    $scope.getTasks = getTasks;
    $scope.delTask = delTask;

  	if ($routeParams.receive != undefined) {
  		receiveTask($routeParams.receive);
  	}

    $location.url($location.path());
  }])
  .directive('convertToNumber', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$parsers.push(function(val) {
          return parseInt(val, 10);
        });
        ngModel.$formatters.push(function(val) {
          return '' + val;
        });
      }
    };
  });

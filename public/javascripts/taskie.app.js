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
      $location.search('code', null)
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
          console.log($scope.user);
        }
      });
    }
    userGet();

    var updateUser = function () {
      var data = {NotificationInterval: $scope.user.NotificationInterval};
      taskieAPI.updateUser(data, function (err, result) {
        if (result.success) {
          $scope.user = result.data;
          console.log($scope.user);
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
  .controller('IndexController', ['$scope', '$http', '$location', '$uibModal', 'taskieAPI', function($scope, $http, $location, $uibModal, taskieAPI) {
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
      var tasksSorted = [];
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
              metadata[idToNodeMap[datum.ParentTaskID].TaskID].children.push(datum);
            }
            else {
              root.push(datum);
            }
        }
        return root;
      }

      var tmpTasks = buildTree($scope.tasks);

      // Step 1: Only add non-filtered tasks
      for (var i=0; i<tmpTasks.length; i++) {
        var task = tmpTasks[i];
        var filtered = false;
        for (var filterTagIndex=0; filterTagIndex<$scope.filterTags.length; filterTagIndex++) {
          var found = false;
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
          tasksSorted.push(task);
        }
      }

      // Step 2: Sort by whatever we're sorting by
      switch ($scope.sortBy) {
        case "DateDue":
          tasksSorted.sort(function (a, b) {
            return moment(a.DateDue) - moment(b.DateDue);
          });
        break;

        case "Priority":
          tasksSorted.sort(function (a, b) {
            var result = b.Priority - a.Priority;
            if (result == 0) {
              return moment(a.DateDue) - moment(b.DateDue);
            }
            return result;
          });
        break;

        case "Alphabetical":
          tasksSorted.sort(function (a, b) {
            return a.Title.localeCompare(b.Title);
          });
        break;
      }

      // Step 3, push all completed tasks to the end
      var tasksCompleted = [];
      var tasksInProgress = [];
      for (var i in tasksSorted) {
        if (tasksSorted[i].Status == Constants.STATUS_COMPLETED)
          tasksCompleted.push(tasksSorted[i]);
        if (tasksSorted[i].Status == Constants.STATUS_INPROGRESS)
          tasksInProgress.push(tasksSorted[i]);
      }

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
          $scope.tasks = $scope.tasks.concat(result.data);
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

    $scope.showTaskModal = function(task, parentID) {
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
					console.log('Can\'t add duplicate tags to sort by.');
					return -1;
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

    userGet();
    getTasks();

    $scope.addTask = addTask;
    $scope.updateTask = updateTask;
    $scope.getTasks = getTasks;
    $scope.delTask = delTask;
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

//This is the main taskie app JS file
// This is another comment in here

window.onload = function () {
	$.ajax({url: "/api/v1/tasks", success: function(result){
		console.log(result);
		for (var i=0; i<result.data.length; i++) {
			$( ".app" ).append( "<p>" + result.data[i].data.title + "</p><br>" );
		}
	}});

	$( "#add_task").click(function(){
		addNewTask()
	});
};

var addNewTask = function () {

	var taskTitle = $("#task_title").val();
	var taskDesc = $("#task_desc").val();

	$.ajax({
  	type: "POST",
  	url: '/api/v1/tasks',
  	data: {title: taskTitle, desc: taskDesc, date_due: "2017-02-21T05:26:30.000Z"},
 		success: function (result) {
			console.log(result);
		}
	});
};

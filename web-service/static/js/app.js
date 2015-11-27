/*
    script file for the Tasks application
*/
angular.module('TasksApp', [])
    .controller('TasksController', function($scope, $http) {
        function handleApiError(err) {
            $scope.showSpinner = false;
            $scope.error = err;
        }

        $scope.newTask = {};

        $scope.showSpinner = true;
        $http.get('/api/tasks')
            .then(function(results) {
                $scope.showSpinner = false;
                $scope.tasks = results.data;
            }, handleApiError);

        $scope.addTask = function() {
            $scope.showSpinner = true;
            $http.post('/api/tasks', $scope.newTask)
                .then(function(results) {
                    $scope.showSpinner = false;
                    //new task object is returned, including new rowid
                    $scope.tasks.push(results.data);
                    $scope.newTask = {};
                }, handleApiError);
        }; //addTask()

        $scope.toggleDone = function(task) {
            var updateTask = angular.copy(task);
            updateTask.done = !updateTask.done;

            $scope.showSpinner = true;
            $http.put('/api/tasks/' + updateTask.rowid, updateTask)
                .then(function(results) {
                    $scope.showSpinner = false;
                    angular.copy(updateTask, task);
                }, handleApiError);
        };
    });
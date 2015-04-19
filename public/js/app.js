angular
    .module('TodoApp', [])
    .factory('Dropbox', ['$window', '$q', function($window, $q) {
        var client = new $window.Dropbox.Client({key: 'vj7x3uop8rjbepo'});

        function init() {
            var d = $q.defer();

            client
                .authenticate({
                    interactive: false
                }, function(err, res) {
                    if(err) d.reject(err);
                    d.resolve(checkAuth());
                });

            return d.promise;
        }

        function checkAuth() {
            return client.isAuthenticated();
        }

        function getStore() {
            var d = $q.defer();

            client
                .getDatastoreManager()
                .openDefaultDatastore(function(err, Datastore) {
                    if (err) d.reject(err);

                    d.resolve({
                        onChange: onRecordChange(Datastore),
                        getTodos: getTodos(Datastore),
                        addTask: addTask(Datastore),
                        removeTask: removeTask(Datastore),
                        updateTask: updateTask(Datastore)
                    });
                });

            return d.promise;

        }

        function onRecordChange(DataStore) {
            return function(cb) {
                DataStore.recordsChanged.addListener(cb);
            };
        }

        function getTodos(DataStore) {
            return function() {
                return DataStore.getTable('todos').query();
            };
        }

        function addTask(DataStore) {
            return function(data) {
                return DataStore.getTable('todos').insert(data);
            };
        }

        function removeTask(DataStore) {
            return function(id) {
                return DataStore.getTable('todos').get(id).deleteRecord();
            };
        }

        function updateTask(DataStore) {
            return function(id, done) {
                return DataStore.getTable('todos').get(id).set('completed', done);
            };
        }

        function authenticate() {
            return client.authenticate();
        }

        return {
            init: init,
            authenticate: authenticate,
            getStore: getStore
        };
    }])
    .controller('TodoCtrl', ['$scope', 'Dropbox', function($scope, Dropbox) {
        $scope.usertype = 'guest';
        $scope.todos = [];

        $scope.store = null;
        $scope.updateTodos = null;

        $scope.authenticate = Dropbox.authenticate;

        Dropbox
            .init()
            .then(function(authenticated) {
                if(authenticated) {
                    $scope.loading = true;
                    $scope.usertype = 'authenticated';

                    Dropbox
                        .getStore()
                        .then(function(store) {
                            $scope.store = store;
                            $scope.loading = false;

                            $scope.updateTodos = function() {
                                $scope.todos = $scope.store.getTodos();
                            };

                            $scope.addTask = function(description) {
                                $scope.store.addTask({
                                    todo: description,
                                    created: new Date(),
                                    completed: false
                                });
                            };

                            $scope.removeTask = function(id) {
                                $scope.store.removeTask(id);
                            };

                            $scope.updateTask = function(e, id) {
                                $scope.store.updateTask(id, e.target.checked);
                            };

                            $scope.updateTodos();
                            $scope.store.onChange($scope.updateTodos);
                        });
                }
            });
    }]);

angular
    .element(document)
    .ready(function() {
        angular.bootstrap(document.body, ['TodoApp']);
    });

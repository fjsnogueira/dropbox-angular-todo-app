var client = new Dropbox.Client({key: 'vj7x3uop8rjbepo'}),
    TodosApp = TodosApp || {
        todosList: null,

        init: function() {
            client.authenticate({
                interactive: false
            }, function(err, reS) {
                if (err) {
                    console.log('OAuth error: ' + err);
                }
            });

            TodosApp.checkClient();
        },

        checkClient: function() {
            if (client.isAuthenticated()) {

                $('#link-button').fadeOut();

                client
                    .getDatastoreManager()
                    .openDefaultDatastore(function(err, Datastore) {
                        console.log('HEREEE');
                        if (err) {
                            console.log('Datastore error: ' + err);
                        }
                        TodosApp.todosList = Datastore.getTable('todos');

                        TodosApp.updateTodos();
                        Datastore.recordsChanged.addListener(TodosApp.updateTodos);
                    });

                $('#add-todo').submit(TodosApp.createTodo);

                $('#main').fadeIn();
            } else {
                $('#main').fadeOut();
                $( '#link-button' ).click( function() {
                    client.authenticate();
                });
            }
        },

        createTodo: function(e) {
            e.preventDefault();

            TodosApp.todosList.insert({
                todo: $('#todo').val(),
                created: new Date(),
                completed: false
            });

            $('#todo').val('');
        },

        updateTodos: function() {
            var list = $('#todos'),
                todoTemplate = $($('#todo-template').text()),
                records = TodosApp.todosList.query();

            list.empty();

            // fixture
            // if(records.length === 0) {
            //     records.push({
            //         getId: function() {
            //             return 1;
            //         },
            //         get: function(type) {
            //             switch (type) {
            //                 case 'todo':
            //                     return 'Write some code';
            //                 break;
            //                 case 'completed':
            //                     return false;
            //                 break;
            //                 case 'id':
            //                     return this;
            //                 break;
            //             }
            //         }
            //     });
            //
            //     records.push({
            //         getId: function() {
            //             return 2;
            //         },
            //         get: function(type) {
            //             switch (type) {
            //                 case 'todo':
            //                     return 'Buy beer';
            //                 break;
            //                 case 'completed':
            //                     return true;
            //                 break;
            //                 case 'id':
            //                     return this;
            //                 break;
            //             }
            //         }
            //     });
            // }

            $(records).each(function(idx, record) {
                var item = todoTemplate.clone();
                // console.log(record);
                item.attr('data-record-id', record.getId());
                item.find('span').text(record.get('todo'));
                if(record.get('completed')) {
                    item.find('span').addClass('completed');
                    item.find('input[type="checkbox"]').attr('checked', 'checked');
                }

                list.append(item);
            });

            list.find('button').click(function(e) {
                e.preventDefault();

                var id = $(this).parents('li').attr('data-record-id');
                TodosApp.todosList.get(id).deleteRecord();
            });

            list.find('input[type="checkbox"]').click(function(e) {
                var el = $(e.target),
                    id = el.parents('li').attr('data-record-id');

                TodosApp.todosList.get(id).set('completed', el.is(':checked'));
            });
        }
    };

$('document').ready(TodosApp.init);

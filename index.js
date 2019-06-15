var http = require('http');
var Static = require('node-static');
var app = http.createServer(handler);
var io = require('socket.io').listen(app);
var port = process.env.PORT || 8080;
var active = false;
var update = false;
var users = [];

var files = new Static.Server('./public');

function handler(request, response) {
    request.on('end', function () {
        files.serve(request, response);
    }).resume();
}

io.on('connection', (socket) => {
    var addedUser = false;
    socket.on('add user', (username) => {
        if (addedUser) return;
        socket.username = username;
        var new_count = users.length;
        console.log(new_count);
        var new_user = {
            username: username,
            active: active,
            lat: null,
            lng: null,
            update: false
        };

        users.push(new_user);
        console.log(users);
    });
  /* -------------------------------------------------
                             NEW USER COORDS FROM CLIENT
                     --------------------------------------------------- */

    socket.on('new_coords', (data) => {
        //USER COORDS WHEN NEW USER CONNECTS OR CURRENT USER UPDATES COORDS
        var New_Details = {
            username: data.username,
            active: data.active,
            lat: data.new_lat,
            lng: data.new_lng,
            update: true
        };

        var checkuser = data.username;
        result = users.map(obj => obj.username).indexOf(checkuser) >= 0;

        //UPDATE USER IF USER ALREADY EXITS
        if (result === true) {
            objIndex = users.findIndex((obj => obj.username == data.username));
            users[objIndex].lat = data.new_lat;
            users[objIndex].lng = data.new_lng;
            users[objIndex].active = data.active;
            users[objIndex].update = true;

            var to_send = {
                username: data.username,
                active: true,
                lat: data.new_lat,
                lng: data.new_lng,
                update: true
            };

            console.log(data.username + ' has just updated their location');
            var new_count = users.length;
            console.log(new_count);
            console.log(users);

            //SEND BACK UDPATED COORDS TO CLIENT  RELATED TO EXISTING USER
            socket.broadcast.emit('updatecoords', to_send);

            objIndex = users.findIndex((obj => obj.username == data.username));
            users[objIndex].update = false;
        }
    });

    // Sending back users ARRAY to any user that connects to our SERVER
    socket.on('load_init', (data) => {
        socket.emit('load_init', users);
    })

    socket.on('disconnect', () => {

        for (var i = 0; i < users.length; i++)
            if (users[i].username === socket.username) {
                socket.broadcast.emit('remove_marker', {
                    username: users[i].username
                });
                users.splice(i, 1);
                break;
            }
        var new_count = users.length;
        console.log(new_count);
        console.log('remove marker');
    });
});

app.listen(port);
console.log('Your server goes on localhost:' + port); 
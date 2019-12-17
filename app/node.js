var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http');

var port = process.env.PORT || 2111;
var path = require('path');

// app.use(express.static(__dirname + '/assets'));
app.use(
	express.static(__dirname + '/assets')
	,function(req, res, next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  // res.json(data);
  // res.send('<h1>WTF</h1>');
});

var privateKey  = fs.readFileSync('privatekey.pem', 'utf8');
var certificate = fs.readFileSync('certificate.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var https = require('https');

var httpsServer = https.createServer(credentials, app);

var io = require('socket.io')(httpsServer);



var _users = {};

io.on('connection', function(socket){

	var _ip = socket.client.conn.remoteAddress;
	var ip = _ip.split(':');
	ip = ip[3];

	if (
		ip == '192.168.100.87' // 
		|| ip == '192.168.100.101' 
		|| ip == '192.168.100.87' 
		|| ip == '192.168.100.105' 
		|| ip == '192.168.100.11'
		|| ip == '192.168.100.97' 
		|| ip == '192.168.100.104' 
	) {

		var isUsersempty = !Object.keys(_users).length;
		if (isUsersempty) {
			io.emit('clear message', '');
		}

		_users['admin'] = '1';

		socket.on('chat message', function(msg){
			// msg.socket_id = socket.id;
			msg.ip = ip;
			if (msg.message == '~name No_one' && ip != '192.168.100.104') {
				msg.message = "~name batig nawong";
			}

			var user_id = msg.user_id;
			var chat = msg.message;

			// set name
			if (
				typeof chat != 'undefined'
				&& typeof chat.split(" ")[0] != 'undefined'
				&& chat.split(" ")[0] == '~name'
				&& typeof chat.split(" ")[1] != 'undefined'
				&& chat.split(" ")[1].length > 0
			) {

				var second_name = typeof chat.split(" ")[2] != 'undefined' ? chat.split(" ")[2] : '';
				var join_user_id = chat.split(" ")[1].replace(/\s/g,'') + ' ' + second_name.replace(/\s/g,'');

				var shit = join_user_id.split(" ")[1];
				if (shit.length > 0) {
					join_user_id = join_user_id.replace(" ", "_");
				}

				if (typeof _users[join_user_id] === 'undefined') {

					var key = null;
					for (var k in _users){
					  if (_users[k] === socket.id){
					    key = k;
					    break;
					  }
					}
					if (key != null) {
					  delete _users[key];
					}
					_users[join_user_id] = socket.id;
				} else {
					msg.error = 'Naa nay tagiya.'
				}
			}

			// users list
			if (chat == '~list') {
				msg.list = _users;
			}

			io.emit('chat message', msg);
		});

		if (socket.id) {
			console.log(ip);
			socket.on('join message', function(msg){
				console.log(msg);

				var join_user_id = msg.user_id;
				var _flg = 1;

				// remove fake No one 
				if (join_user_id == 'No one') {
					msg.error = 'No one';
					io.emit('chat message', msg);
					return;
				}

				if (typeof _users[join_user_id] === 'undefined') {
					_users[join_user_id] = socket.id;
				} else {
					var _flg = 0;
					msg.error = 'Welkam bak ' + join_user_id;
					io.emit('chat message', msg);
				}

				if (_flg) {
					msg.ip = socket.handshake.headers.host;
					io.emit('join message', msg);
				}
			});
		}

		socket.on('type message', function(msg){
			io.emit('type message', msg);
		});

	} else {
		console.log('ggwp ' + ip);
	}

});

httpsServer.listen(port, function(){
  console.log('listening on gg *:' + port);
});
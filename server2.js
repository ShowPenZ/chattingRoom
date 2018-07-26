var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
var io = require('socket.io');

//数据库连接
let db = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'zxp.1996',
	database: 'chattingroom'
});

//1.创建http服务器

let httpServer = http.createServer((req, res) => {
	// console.log(req);

	fs.readFile(`www${req.url}`, (err, data) => {
		if (err) {
			res.writeHeader(404);
			res.write('Not Found xxxx');
		} else {
			res.write(data);
		}

		res.end();
	});
});

//

httpServer.listen(3000);

//2.创建websocket服务
let wsServer = io.listen(httpServer);
let allSock = [];

//约定登录的接受口令是login，发送口令是login_ret;
//约定注册的接受口令是reg,发送口令是reg_ret
wsServer.on('connection', sock => {
	let cur_userName = '',
		cur_userID = 0;
	allSock.push(sock); //每来一个人就添加一人
	//注册接口，ws版
	sock.on('reg', (username, pass) => {
		//1.校检数据
		if (!/^\w{1,32}$/.test(username)) {
			sock.emit('reg_ret', 1, '用户名不符合规范');
		} else if (!/^.{6,32}$/.test(pass)) {
			sock.emit('reg_ret', 1, '密码不符合规范');
		} else {
			//2.校检通过，查询数据库用户名是否已经注册
			db.query(`SELECT ID FROM user_table WHERE username='${username}'`, (err, data) => {
				console.log(data);
				if (err) {
					console.log(err);
					sock.emit('reg_ret', 1, '数据库发生错误');
				} else if (data.length > 0) {
					sock.emit('reg_ret', 1, '用户名已存在');
				} else {
					db.query(
						`INSERT INTO user_table(username,password,online) VALUES ('${username}','${pass}',0)`,
						(err, data) => {
							if (err) {
								console.log(err);
								sock.emit('reg_ret', 1, '数据库发生错误');
							} else {
								sock.emit('reg_ret', 0, '注册成功');
							}
						}
					);
				}
			});
		}
	});

	//登录接口
	sock.on('login', (username, pass) => {
		//1.校检数据
		if (!/^\w{1,32}$/.test(username)) {
			sock.emit('login_ret', 1, '用户名不符合规范');
		} else if (!/^.{6,32}$/.test(pass)) {
			sock.emit('login_ret', 1, '密码不符合规范');
		} else {
			//2.校检通过，查询数据库查询用户是否存在
			db.query(
				`SELECT ID,password FROM user_table WHERE username='${username}'`,
				(err, data) => {
					if (err) {
						console.log(err);
						sock.emit('login_ret', 1, '数据库发生错误');
					} else if (data.length == 0) {
						sock.emit('login_ret', 1, '此用户名不存在');
					} else if (data[0].password !== pass) {
						sock.emit('login_ret', 1, '用户名或者密码错误！');
					} else {
						db.query(
							`UPDATE user_table set online=1 WHERE ID='${data[0].ID}'`,
							(err, datas) => {
								if (err) {
									console.log(err);
									sock.emit('login_ret', 1, '数据库发生错误');
								} else {
									cur_userID = data[0].ID;
									cur_userName = username;
									sock.emit('login_ret', 0, ['登录成功', username]);
								}
							}
						);
					}
				}
			);
		}
	});

	//发送聊天接口
	sock.on('msg', text => {
		console.log(text);
		if (!text) {
			sock.emit('msg_ret', 1, '聊天文本不能为空！');
		} else {
			//广播给所有人
			allSock.map(item => {
				if (item === sock) {
					return;
				}

				item.emit('msg', cur_userName, text);
			});

			sock.emit('msg_ret', 0, '发送成功');
		}
	});

	//离线接口 适用与刷新，关闭网页 这类
	sock.on('disconnect', () => {
		console.log('cur_userID', cur_userID);
		db.query(`UPDATE user_table SET online=0 WHERE ID=${cur_userID}`, err => {
			if (err) {
				console.log(err);
			}
			sock.emit('disconnect_ret', 0, '退出成功');
			cur_userID = 0;
			cur_userName = '';
			//离线时清掉allSock里离线的那个sock
			allSock = allSock.filter(item => {
				item != sock; // 过滤掉离线的sock
			});
		});
	});
});

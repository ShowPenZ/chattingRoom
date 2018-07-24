var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
var io = require('socket.io');
var url = require('url');

//数据库连接
let db = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'showpenZ.12580',
	database: 'chattingroom'
});
// console.log(db);

//1.创建http服务器

let httpServer = http.createServer((req, res) => {
	// console.log(req);
	//使用node的url模块来切割pathname和query
	let { pathname, query } = url.parse(req.url, true);

	if (pathname === '/reg') {
		console.log('11313', query);

        let { username, pass } = query;
       //1.检验数据

       
       //2.检验用户名唯一性
       //3.插入数据到表中 
	} else if (pathname === 'login') {
		console.log(query);
	} else {
		fs.readFile(`www${req.url}`, (err, data) => {
			if (err) {
				res.writeHeader(404);
				res.write('Not Found xxxx');
			} else {
				res.write(data);
			}

			res.end();
		});
	}
});

//

httpServer.listen(3000);

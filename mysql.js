var mysql = require('mysql');

//1.连接
//连接池（多链接 默认数：10）
var db = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'showpenZ.12580',
	database: 'chattingroom'
}); 

//2.查询
//查询语句 查询user_table的所有
db.query('SELECT * from user_table', (err, data) => {
	if (err) {
		console.log(err);
	} else {
		console.log(JSON.stringify(data));
	}
});

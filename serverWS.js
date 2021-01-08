const http = require ('http');
const file = require ('fs');
const sql = require ('mysql2');
const serialport = require ('serialport');
const Readline = require('@serialport/parser-readline');
const WebSocket = require('ws');

const connection = sql.createConnection({
	host: '127.0.0.1',
	user: 'Frol',
	password: 'a1r9t8e4m',
	database: 'switcher',
});

connection.connect((err)=>{
	if (err) {
		console.error("Ошибка: " + err.message);
		if(err.message === `Unknown database 'switcher'`){
			initializeBD();
		}
	}
	else{
		console.log("Подключение к серверу MySQL успешно установлено. База данных switcher обнаружена");		
	}
});

const COMPORT = new serialport("COM3", {
	baudRate: 9600,
});

COMPORT.on('open',(data)=>{	
	console.log('COM порт открыт');
});

const parser = COMPORT.pipe(new Readline({ delimiter: '\r\n' }));

parser.on('data', (data)=>{
	if(data === 'SERIAL START'){

		connection.query('SELECT * FROM relay', (err, result)=>{
			if(err) console.log(err);
			else {
				result.forEach((item, index)=>{
					if (item.state === 0) setTimeout(()=>{sendCommToCOMPORT(`OFF${index+1}`)}, (index+1)*100);
					if (item.state === 1) setTimeout(()=>{sendCommToCOMPORT(`ON${index+1}`)}, (index+1)*100);
				})
			}
		});

	}

	if(data.includes('sens_')){
		let arrSens = data.slice(5, 12).split('/');
		sendStateSensToBD(arrSens);
		if(sockets.length > 0){
			sockets.forEach((i, index)=>{
				console.log(`Отправляю для сокета ${index}`)
				sendStateSensToClient(i);
			});
		}

	}

});

const server = http.createServer((req, res)=>{

	const sendFile = (name)=>{
		file.readFile(name, (e,data)=>{
			if(e){
				console.log(e);
				res.statusCode = 404;
				res.end("Resourse not found!");
			}
			res.end(data);
		});
	}

	switch(req.url){
		case '/' :
		sendFile('index.html');
		break;

		case '/index.css' :
		res.writeHead(200, {'Content-Type': 'text/css'});
		sendFile('index.css')
		break;

		case '/indexWS.js' :
		sendFile('indexWS.js')
		break;

		case '/musical-note.svg':
		res.writeHead(200, {'Content-Type': 'image/svg+xml'});
		sendFile('musical-note.svg')
		break;

		case '/circuit.jpg':
		sendFile('circuit.jpg')
		break;

		case '/favicon.png':
		sendFile('favicon.png');
		break;

		case '/relays':
		connection.query('SELECT * FROM relay', (err, result)=>{
			if(err) console.log(err);
			else {
				res.end(JSON.stringify(result));
			}
		});
		break;
	}

});

server.listen(4000, '', () => {
	console.log('Server is started');
});

let sockets = [];
const wss = new WebSocket.Server({port: 4001});
wss.on('connection', (ws)=>{
	sockets.push(ws);
	console.log('WebSocket connected!');
	sendStateSensToClient (ws);
	ws.on('message', (mes)=>{
		
		if(mes==='beep_on'){
			sendCommToCOMPORT('toneON');
		}else if(mes==='beep_off'){
			sendCommToCOMPORT('toneOFF');
		}else if(JSON.parse(mes).name ==='swich-reley'){
			connection.query(`SELECT * FROM relay WHERE number = ${JSON.parse(mes).number}`, (err, result)=>{
				if(err)console.log(err);
				if(result[0].state === 0){
					connection.query(`UPDATE relay SET state=${true} WHERE number=${result[0].number}`,(err,resp)=>{
						if(err)console.log(err);
					});
					sendCommToCOMPORT(`ON${result[0].number}`);
					if(sockets.length > 0){
						sockets.forEach((i, index)=>{
							console.log(`Отправляю для сокета ${index} состояние реле`);
							sendStateRelaysToClient(i);
						});
					}
				}
				if(result[0].state === 1){
					connection.query(`UPDATE relay SET state=${false} WHERE number=${result[0].number}`,(err,resp)=>{
						if(err)console.log(err);
					});
					sendCommToCOMPORT(`OFF${result[0].number}`);
					if(sockets.length > 0){
						sockets.forEach((i, index)=>{
							console.log(`Отправляю для сокета ${index} состояние реле`);
							sendStateRelaysToClient(i);
						});
					}
				}
			});
			
		}

	});

	ws.on('close', ()=>{
		let index = sockets.indexOf(ws);
		sockets.splice(index, 1);
	})


});

function initializeBD() {
	const connection1 = sql.createConnection({
		host: '127.0.0.1',
		user: 'Frol',
		password: 'a1r9t8e4m',
	});

	connection1.query('CREATE DATABASE IF NOT EXISTS switcher', function(err,res){

		if(err) console.log(err);
		else {
			console.log("База данных создана");
			console.log(res);
			connection1.end();

			const connection2 = sql.createConnection({
				host: '127.0.0.1',
				user: 'Frol',
				password: 'a1r9t8e4m',
				database: 'switcher',
			});

			const createTableRelayCommand = `CREATE TABLE IF NOT EXISTS relay(
			number int primary key not null,
			state bool not null
			)`
			connection2.query(createTableRelayCommand, function(err,res){
				if(err) console.log(err);
				else {
					console.log("Таблица реле создана");
					console.log(res);
					const relays = [
					[1,false], 
					[2,false], 
					[3,false], 
					[4,false]
					];

					connection2.query('INSERT INTO relay(number, state) VALUES ?', [relays], function(err,res){
						if(err) console.log(err);
						else {
							console.log("Таблица реле инициализирована");
							console.log(res);
							connection2.end();
						}
					});
				}
			});

			const connection3 = sql.createConnection({
				host: '127.0.0.1',
				user: 'Frol',
				password: 'a1r9t8e4m',
				database: 'switcher',
			});

			const createTableSensorCommand = `CREATE TABLE IF NOT EXISTS sensor(
			number int primary key not null,
			state bool not null
			)`

			connection3.query(createTableSensorCommand, function(err,res){
				if(err) console.log(err);
				else {
					console.log("Таблица сенсоров создана");
					console.log(res);
					const sensors = [
					[1,false], 
					[2,false], 
					[3,false], 
					[4,false]
					];

					connection3.query('INSERT INTO sensor(number, state) VALUES ?', [sensors], function(err,res){
						if(err) console.log(err);
						else {
							console.log("Таблица сенсоров инициализирована");
							console.log(res);
							connection3.end();
						}
					});
				}
			});

		}
	});
}

function sendCommToCOMPORT(command) {
	COMPORT.write(command, (err)=>{
		if(err)console.log(err);
		console.log(`Отправляю в COM порт ${command}`);
	})
}

function sendStateSensToBD(arrSens){arrSens.forEach((item, index)=>{
	connection.query(`UPDATE sensor SET state=${+item} WHERE number=${index+1}`,(err,resp)=>{
		if(err)console.log(err);
	});
});
}

function sendStateSensToClient (ws)	{
	connection.query('SELECT * FROM sensor', (err, result)=>{
		if(err)console.log(err);
		console.log(`Отправляю клиенту ${{item: 'sensor', state: result}}`);
		ws.send(JSON.stringify({item: 'sensor', state: result}));
	});
}

function sendStateRelaysToClient (ws)	{
	connection.query('SELECT * FROM relay', (err, result)=>{
		if(err)console.log(err);
		console.log(`Отправляю клиенту ${{item: 'relay', state: result}}`);
		ws.send(JSON.stringify({item: 'relay', state: result}));
	});
}
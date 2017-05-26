const WebSocket = require('ws');
// We need this to build our post string

var fs = require('fs');
var net = require('net');
var JsonSocket = require('json-socket');
jot = require('json-over-tcp');
var querystring = require('querystring');
var http = require('http');
var https = require('https');


// Load the TCP Library


// Keep track of the chat clients
clients = [];
errors = [];
ws_messages_in = [];
ws_messages_out = [];
old_messages_sent = 0;
ws = null;
t_id = null;
prv_commands = true;
chat_commands = true;
admin_chat_commands = true;

logins = [
	['bfp2233gg','dfg123'],
	['yberion','junkers88'],
	['ashh','dfg123']
];
login_n = 2;

admins=[];
bans=[];
self_name="";
self_room="";
prev_message_text="";
prev_message_user="";
ostatnie_haslo="";
ostatni_wyproszony="";
rysuje="";
gracze_w_pokoju=[];
chat=[];
pchat=[];
chat_max = 1000;
auto_kick = false;
auto_respond = false;
auto_giveup = true;
log = false;
ws2c = false;
wsin = true;
wsout = true;
przejmuj_stol = -1;
niepisz_text = "NIE PISZ BO WYLECISZ!";
niepisz_n = 5;
date_start = Date.now();

client_socket = null;
port = 1000+Math.round(Math.random()*64535); host = '0.0.0.0';
//port = 1337; host = '127.0.0.1';

if (!fs.existsSync('login.txt'))
{
	login();
}
else {			
			login_info = fs.readFileSync('login.txt', 'utf8');
			try{
				JSON.parse(login_info);
				run();	
			}
			catch(e){
				console.log(e);
				process.exit(0);
				}
			
}


function run(){
		readConfig();
		var server = jot.createServer({port:port,host:host});
		//server.on('listening', createConnection);
		server.on('connection', function (socket)
			{

				// Identify this client
				
				socket.name = socket.remoteAddress + ":" + socket.remotePort;
				//socket = new JsonSocket(socket);
				client_socket = socket;
				//socket.setEncoding('utf8');
				//socket.setNoDelay(true);
				// Put this new client in the list
				old_messages_sent = 0;
				clients.push(socket);

				// Send a nice welcome message and announce
				socket.write(
				{
					target: "hello",
					data: "Welcome " + socket.name + "\n" + "Listening on port " + port
				});
				//broadcast(socket.name + " joined the chat\n", socket);

				// Handle incoming messages from clients.
				socket.on('data', function (message)
				{
					//console.log('type: ' + typeof data);
					//console.log('Received: ' + data);
					console.log('Received '+(typeof message),message);
					//var stack = new Error().stack;console.log( stack );			

					//return;
					try
					{
						if (message.target == 'ws')
						{
							d = message.data;
							//ws.send(JSON.stringify(d));
							if (ws)
								ws.send(d);
						}
						if (message.target == 'server')
						{
							parse_line(message.data,"",true);							
						}

						
					}
					catch (e)
					{
						fs.appendFile('log_error.txt', "-server-\n" + e + "\n" + message + "\n" + "\n" + (typeof message) + "\n", (err) =>
						{
							// if (err) throw err;
							//console.log('The "data to append" was appended to file!');
						});
						//console.log(data);
					}
					//broadcast(socket.name + "> " + data, socket);
				});
				socket.on('error', function (data)
				{
					//console.log(data);
					errors.push(data);
					if (socket == client_socket)
						client_socket = null;
					clients.splice(clients.indexOf(socket), 1);
					//broadcast(socket.name + " left the chat.\n");
					process.stdout.write("ERROR: " + socket.name + " closed abruptly.\n");
					//broadcast(socket.name + "> " + data, socket);
				});
				// Remove the client from the list when it leaves
				socket.on('end', function ()
				{
					if (socket == client_socket)
						client_socket = null;
					clients.splice(clients.indexOf(socket), 1);
					//broadcast(socket.name + " left the chat.\n");
					process.stdout.write(socket.name + " disconnected.\n");
				});


				// Send a message to all clients
				function broadcast(message, sender)
				{
					clients.forEach(function (client)
					{
						// Don't want to send it to sender
						if (client === sender) return;
						client.write(message);
					});
					// Log it to the server output too
					process.stdout.write(message)
				}
			});
		server.listen(port,host);
		//jot.createServer(function (socket)


		// Put a friendly message on the terminal of the server.
		console.log("Server listening on port "+port+"\n");

		function getUpTime()
		{
			var d = Date.now()-date_start;
			var seconds = Math.floor(d / 1000);
			var minutes = Math.floor(seconds / 60);
			var hours = Math.floor(minutes / 60);
			var days = Math.floor(hours / 24);
			var time = days + "d " + hours % 24 + "h " + minutes % 60 + "m " + seconds % 60 + "s"; 			
			return time;
		}
		function send2client(msg,to_buf)
		{

			
			if (client_socket && ws_messages_in.length && !old_messages_sent)
			{
				console.log("sending old messages to client");
				var m = ws_messages_in.slice();
				console.log("length:",m.length);
				client_socket.write("--1--");
				while(m.length)
				{
					client_socket.write(m.splice(0,1)[0]);	
				}
				console.log("length:",m.length);
				client_socket.write("--2--");
				old_messages_sent = 1;
			}
			/*if (typeof to_buf=='undefined' || to_buf == 1)
				ws_messages_in.push(msg);*/
			if (client_socket)
				client_socket.write(msg);
			// Log it to the server output too
			//process.stdout.write(msg)
		}

		var a = {};
		a.app = {};
		a.t = 0;
		a.app.Ac = function (a, b)
		{
			 j = {
				target: "ws",
				data: {
						a: a,
						b: b
						},
				from: "server"		
			};
			if (wsin)
				ws_messages_in.push(j);
			if (ws2c)
				send2client(j);
			
			if (log)
			{
				fs.appendFile('server_log.txt',JSON.stringify({"a":a,"b":b})+"\n" , (err) => {
				 // if (err) throw err;
				  //console.log('The "data to append" was appended to file!');
				});
			}
			switch (a[0]) {	
				case 18:
					console.log(admins);
					self_name = b[0];					
					admins.indexOf(self_name) == -1 ? admins.push(self_name) : null;
					writeConfig();
					ws.send('{"i":[52],"s":["noi=0&nop=0&prb=0&snd=1"]}');
					ws.send('{"i":[20],"s":["/join #100..."]}');
					break;
				case 23:
					// ustawienia typu dźwięk itd
					break;
				case 21:
					// wiadomosc prywatna
					user = b[0].substr(0,b[0].indexOf(":"));
					message = b[0].substr(b[0].indexOf(":")+2);
					/*if (m == "!start")
					{
						startGame();
						break;
					}*/
					pchat.push({user:user,message:message});					

					//if (a.length == 2 && user != self_name)
					if (a.length == 2 && prv_commands) // 1 - after sending to user; 2 - priv message from user;  3 - old messages
					{		
						if (auto_respond)
						{	
							a.t || (a.t = setTimeout(function () {
									ce2(user,message);//send([21],[user,message]);									
									a.t && (clearTimeout(a.t), a.t = null);
								}, 2000+Math.round(Math.random()*10000)));			
						}
						
						m = message.match(/^!op_add$/i);
						if (m)
						{	
							if (bans.indexOf(user) == -1)
							{
								admins.indexOf(user) == -1 ? (admins.push(user),added=1) : added=0;
								
								if (added)
									{
									ce2(user,"OK. Dodałem Cię do listy opów :D");//send([21],[user,"OK. Dodałem Cię do listy opów :D"]);	
									writeConfig();
									}
								else
									ce2(user,"Jesteś już przecież opem! :D");//send([21],[user,"Jesteś już przecież opem! :D"]);	
							}
							else
							{
								ce2(user,"Masz bana! :(");//send([21],[user,"Jesteś już przecież opem! :D"]);
							}
						}
									
						m = message.match(/^!op_rem$/i);
						if (m)
						{	
							if (bans.indexOf(user) == -1)
							{
								(i = admins.indexOf(user)) != -1 ? (admins.splice(i,1),removed=1) : removed=0;
								if (removed)
								{
									ce2(user,"OK. Usunąłem Cię z listy opów :D");//send([21],[user,"OK. Usunąłem Cię z listy opów :D"]);	
									writeConfig();
								}
								else
								ce2(user,"Nie jesteś przecież opem! :D");//send([21],[user,"Nie jesteś przecież opem! :D"]);								
							}
							else
							{
								ce2(user,"Masz bana! :(");//send([21],[user,"Jesteś już przecież opem! :D"]);
							}
						}	
						m = message.match(/^!op_inv$/i);
						if (m && admins.indexOf(user) != -1 && self_room)
						{							
							send([95,self_room,0],[user]);
						}					
						m = message.match(/^!help$/i);
						if (m && admins.indexOf(user) != -1)
						{							
							ce2(user,"Lista dostępnych komend: http://asdd.cba.pl/bot-komendy");//send([21],[user,"Lista dostępnych komend: http://asdd.cba.pl/bot-komendy"]);								
						}
						m = message.match(/^!uptime$/i);
						if (m)
						{					
					        d = getUpTime();
							ce2(user,"Siedzę tu już od "+d);//send([21],[user,"Siedże tu już od "+d]);								
						}												
					}

					break;
				case 70:
					// aktualizacja pokojów na liscie
					break;
				case 71:
					// zmiana miasta
					//send([72],[103]); // wejscie do istniejacego stolu			
					send([71],null);// utworzenie stolu
					break;	
				case 72:  // stol zniszczony 
					if (a[1] == przejmuj_stol && a[1]!=self_room)
						send([71],null);
					else if (a[1]==self_room)
						self_room = 0;
				case 73:
					// wejscie do pokoju
					//self_room = a[1];
					break;	

					
				case 81:
					// wiadomosc na stole
					//console.log(b[0]);
					if (1 > b.length) break;
					if (chat.length+1 > chat_max)
							chat.splice(0,1);
					chat.push(b[0]);
					prev_message_text = b[0];
					prev_message_user = "";					
					m = b[0].match(/^\*\* rysuje: (.+?)$/i);
					if (m)
						{
							rysuje = m[1];
						}	
					m = b[0].match(/^\*\* DOBRZE!!! - (.+?)$/i);
					if (m)
						ostatnie_haslo = m[1];
					m = b[0].match(/^\*\* użytkownik (.+?) został wyproszony ze stołu/i);
					if (m)
						ostatni_wyproszony = m[1];
					
					m = b[0].match(/^\*\* potrzebna osoba do rysowania/i);
					if (m)
						rysuje = "";						
					if (-1 != (d = b[0].indexOf(":")) && 0 != b[0].indexOf("**"))
					{
						prev_message_text =  b[0].substring(d+2);
						prev_message_user = b[0].substring(0,d);
					}
					parse_line(prev_message_text,prev_message_user,false);
					break;
					
				case 84: // x wszedl do pokoju
					if (auto_kick && bans.indexOf(b[0]) != -1)
						ce("/boot "+b[0]);
					else
						gracze_w_pokoju.indexOf(b[0]) == -1 ? gracze_w_pokoju.push(b[0]) : null;
					//{"i":[84,115],"s":["dfb9532g"]}
					break;
				case 85: // x wyszedl z pokoju
					(i = gracze_w_pokoju.indexOf(b[0])) != -1 ? gracze_w_pokoju.splice(i,1) : null;
					//{"i":[85,115],"s":["dfb9532g"]}
					break;
				case 86:
					// wejscie do pokoju
					gracze_w_pokoju = [];						
					rysuje = ostatnie_haslo = prev_message_text = prev_message_user = ostatni_wyproszony = "";
					self_room = a[1];
					console.log(self_room);
					break;							
				 case 90: // następny gracz rysuje
					if (a[3]==-1)
					{
						rysuje = ostatnie_haslo = prev_message_text = ostatni_wyproszony = prev_message_user = "";					
					}
					break;			
				 case 91: // nowe haslo
					//console.log(b);
					if (b.length && auto_giveup)
						giveUp();
					break;
					
			}			
			
		}

		ws = new WebSocket('https://x.kurnik.pl:17003/ws/', [],
		{
			rejectUnauthorized: false
		});

		ws.on('open', function open()
		{

			console.log("ws.on");
			ws.send(login_info);
		});

		ws.on('message', function incoming(data)
		{
			//console.log(data);
			sd(a, data);

		});
		ws.on('error', function incoming(e)
		{
			console.log(e);
			process.exit(1);
		});
	
}

function send_client(a)
{
	 o ={
		target:"server",
		data:a,
		from:"server"
	 };
	if (client_socket)
		client_socket.write(o);
}

td = 1;
yd = 2;

function sd(a, b)
{
	for (var c = b.split("\n"), d = 0, e = c.length; d < e; d++)
	{
		try
		{
			var h = JSON.parse(c[d]),
				l = h.i || [],
				n = h.s || []
		}
		catch (m)
		{
			//ma("PARSE/ds.l=" + c.length + " >" + c[d] + "< " + m);
			return
		}
		0 != l.length && (-1 == a.ea && (a.ea = l[0] == 1 ? 1 : 0), l[0] == 1 ? send([2], null) : a.app.Ac(l, n))
		//0 != l.length && (-1 == a.ea && (a.ea = l[0] == td ? 1 : 0), l[0] == td ? Ia(a.app) || send([yd], null) : a.app.Ac(l, n))
	}
	a.O || (a.O = setTimeout(function ()
	{
		zd(a)
	}, 3E4))
}

function Ia(a)
{
	return false;
}

function zd(a)
{
	Ia(a.app) || send([], null);
	a.O = setTimeout(function ()
	{
		zd(a)
	}, 3E4)
}

function Ad(a, b)
{
	for (var c = b ? b : [], d = 0, e = c.length; d < e; d++)
	{
		//console.log("Ad: ",c[d]);
		c[d] = '"' + c[d].replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"') + '"';
	}
	return '{"i":[' + a.join() + "]" + (0 < c.length ? ',"s":[' + c.join() + "]" : "") + "}"
}

function send(a, b)
{
	var c = Ad(a, b);
	//console.log(c);
	//if (wsout)
		//ws_messages_out.push(c);
	if (log)
	{
		//fs.appendFile('server_log.txt',JSON.stringify({"i":a,"s":b})+"\n" , (err) => {
		fs.appendFile('server_log.txt',c+"\n" , (err) => {
		 // if (err) throw err;
		  //console.log('The "data to append" was appended to file!');
		});
	}				
	//send2client(o);
	if (ws)
		ws.send(c);
};
giveUp = function()
{
	if (self_room) send([81, self_room], ["/giveup"]);
}
startGame = function()
{
	if (self_room) send([85,self_room],null);
}	
setGameTime = function(t) // t = 2,3
{
	if (self_room) send([82,self_room,t],["tm"]);
}
setGameLen = function(t) // t = 500, 1000, 3000
{
	if (self_room) send([82,self_room,t],["len"]);
}
setPrivate = function(p)
{
	if (self_room) send([82,self_room,p ? 2 : 0],["ttype"]);
}
function ce(b) {
	if (b.length > 512) 
		b = b.substring(0, 512) + "...";
	if (self_room) send([81, self_room], [b]);
}
function ce2(a,b) {
	if (b.length > 512) 
		b = b.substring(0, 512) + "...";
	send([21], [a,b]);
}		
function ce3(a,b) {
	if (b.length > 512) 
		b = b.substring(0, 512) + "...";
	send([20], [a,b]);
}	
function login() {
  // Build the post string from an object

  var post_data = querystring.stringify({
      'cc' : '0',
      'id': logins[login_n][0],
      //'id': 'u',
      'pw': logins[login_n][1]
      //'pw': 'p'
  });

  // An object of options to indicate where to post to
  var post_options = {
      host: 'www.kurnik.pl',
      port: '443',
      path: '/login.phtml',
      method: 'POST',
      //referer: 'asd',
      headers: {
		  'Referer' : 'https://www.kurnik.pl/login.phtml',
		  'User-Agent' : 'Mozilla/5.0 (Windows NT 5.1; rv:52.0) Gecko/20100101 Firefox/52.0',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  // Set up the request
  //var post_req = http.request(post_options, function(res) {
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
	  console.log(res.headers['set-cookie'] );
	  if (res.statusCode == 302 && typeof res.headers['set-cookie'] != 'undefined')
	  {
		  c = res.headers['set-cookie'].join();
		  m = c.match(/ksession=(.+?)\:/i);
		  if (m!=null)
		  {
			  ksession =  m[1];
			   login_info = '{"i":[17051],"s":["'+ksession+'+","pl","b","","Opera/9.51 (Macintosh; Intel Mac OS X; U; en)","/1494622719135/1","w","screen:1024x768 1","ref:https://www.kurnik.pl/kalambury/","ver:77"]}';
			  fs.writeFileSync("login.txt", login_info, 'utf8');
			  run();
		  }
		  
	  }
	  console.log(res.statusCode);
	  console.log(res.headers);
	  
      res.on('data', function (chunk) {
          //console.log('Response: ' + chunk);
      });
      res.on('end', function (chunk) {
          //process.exit(0);
		  
      });	  
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

}

function readConfig()
{
		if (fs.existsSync('config.txt'))
		{
				
			var f = fs.readFileSync('config.txt', 'utf8');
			try{
				json = JSON.parse(f);
				if (typeof json.admins != 'undefined')
					admins = json.admins.slice();
				if (typeof json.bans != 'undefined')
					bans = json.bans.slice();				
				for (var i in bans)
				{
					if ((p=admins.indexOf(bans[i]))!=-1)
					{
						admins.splice(p,1);
					}
				}
				writeConfig();
				console.log(json);
				console.log(admins);
				console.log(bans);
			}
			catch(e){
				console.log(e);
				//process.exit(0);
				}
		}		
}

function writeConfig()
{
	fs.writeFile('config.txt',JSON.stringify({"admins":admins,"bans":bans}),'utf8');	
}
function parse_line(line,prev_message_user,super_user)
{
	//console.log(line,prev_message_user,super_user);
	if (super_user)
	{
		if (line == "!chat")
			send_client(chat);
		if (line == "!pchat")
			send_client(pchat);					
		if (line == "!debug")
		{
			o = {
				 admins: admins,
				 bans: bans,
				 self_name: self_name,
				 self_room: self_room,
				 prev_message_text: prev_message_text,
				 prev_message_user: prev_message_user,
				 ostatnie_haslo: ostatnie_haslo,
				 ostatni_wyproszony: ostatni_wyproszony,
				 rysuje: rysuje,
				 gracze_w_pokoju: gracze_w_pokoju,
				 auto_respond: auto_respond,
				 auto_giveup: auto_giveup,
				 auto_kick: auto_kick,
				 log: log,
				 ws2c: ws2c,
				 wsin: wsin,
				 wsout: wsout,
				 przejmuj_stol: przejmuj_stol,								 
				 date_start: date_start,								 
				 login_n: login_n,								 
				 prv_commands: prv_commands,								 
				 chat_commands: chat_commands,								 
				 admin_chat_commands: admin_chat_commands,								 
				 niepisz_text: niepisz_text,								 
				 niepisz_n: niepisz_n,								 
				 chat_max: chat_max								 
			};
			send_client(o);	
		}		
		m = line.match(/^!uptime$/i);
		if (m)
		{							
			send_client("Siedzę tu już od "+getUpTime());
		}								
		m = line.match(/^!m (.+?)$/i);
		if (m)
		{
				ce(m[1].trim());
		}	
		m = line.match(/^!p (.+?) (.+?)$/i);
		if (m)
		{
			ce2(m[1].trim(),m[2]);//send([21],[m[1],m[2]]);									
		}		
		m = line.match(/^!s (\d+)$/i); //wejscie do pokoju
		if (m)
		{
			  send([72,m[1]],null);
		}
		m = line.match(/^!sw$/i); //wyjscie z pokoju
		if (m && self_room)
		{
			  send([73,self_room],null);
		}	
		m = line.match(/^!op_add (.+?)$/i);
		if (m && m[1]!=self_name)
		{							
			admins.indexOf(m[1]) == -1 ? admins.push(m[1]) : null;
			writeConfig();									
		}
		m = line.match(/^!op_rem (.+?)$/i);
		if (m && m[1]!=self_name)
		{							
			(i = admins.indexOf(m[1])) != -1 ? admins.splice(i,1) : null;
			writeConfig();
		}

		m = line.match(/^!ban (.+?)$/i);
		if (m && m[1]!=self_name)
		{							
			bans.indexOf(m[1]) == -1 ? bans.push(m[1]) : null;
			(i = admins.indexOf(m[1])) != -1 ? admins.splice(i,1) : null;
			writeConfig();									
		}
		m = line.match(/^!unban (.+?)$/i);
		if (m && m[1]!=self_name)
		{							
			(i = bans.indexOf(m[1])) != -1 ? bans.splice(i,1) : null;
			writeConfig();
		}	
		m = line.match(/^set (.+?) (.+?)$/i);
		if (m)
		{							
			if (typeof GLOBAL[m[1]]!='undefined')
			{
				try{
					v = JSON.parse(m[2]);
					if ((Array.isArray(v) && Array.isArray(GLOBAL[m[1]])) 
							|| (typeof v == typeof GLOBAL[m[1]]) )
						GLOBAL[m[1]] = v;
					
					//var a = m[1]; 
					//var b = GLOBAL[m[1]]; 
					send_client({[m[1]]: GLOBAL[m[1]]});
				}
				catch(e)
				{
					console.log(e);
				}
			}
		}
		m = line.match(/^get (.+?)$/i);
		if (m)
		{							
			if (typeof GLOBAL[m[1]]!='undefined')
			{
				send_client(GLOBAL[m[1]]);
			}
			else
			{
				console.log(m[1] + " is undefined");
				send_client(m[1] + " is undefined");
			}
		}	
		m = line.match(/^!iu (.+?)$/i); //ignore private messages from user
		if (m)
		{							
			ce3("/ignore "+m[1]);
		}
		m = line.match(/^!cpc (.+?)$/i); //clear private chat from user
		if (m)
		{							
			send([24],[m[1]]);
		}		
	}
	
	
	if (prev_message_user!=self_name)
	{
			if (line.toLocaleLowerCase() == 'start' && chat_commands)
			{
				startGame();
			}					
			if (line.toLocaleLowerCase() == 'gracze' && chat_commands)
			{
				t_id || (t_id = setTimeout(function(i){
					if (i==0){
						t_id && (clearTimeout(t_id),t_id = null);
						return
						}
					if (self_room)	
						ce("** gracze w pokoju: " + gracze_w_pokoju.join(" ,"));
					i--;
					t_id = setTimeout(arguments.callee,500,i)},500,1));
			}
			if (line.toLocaleLowerCase() == 'kto rysuje' && chat_commands)
			{
				t_id || (t_id = setTimeout(function(i){
					if (i==0){
						t_id && (clearTimeout(t_id),t_id = null);
						return
						}
					if (self_room)	
						ce("** rysuje: " + rysuje);								
					i--;
					t_id = setTimeout(arguments.callee,500,i)},500,1));	
			}

			if (super_user || (admins.indexOf(prev_message_user) != -1 && admin_chat_commands)) // admins only
			{
				m = line.match(/^!w (.+?)$/i);
				if (m)
				{					
					if (self_name!=m[1] && admins.indexOf(m[1]) == -1 && m[1]!=prev_message_user)
					{
							kick_list = [];
							for (var i in gracze_w_pokoju)
								{
									if (gracze_w_pokoju[i].indexOf(m[1]) == 0) 
									{
										kick_list.push(gracze_w_pokoju[i]);
									} 				
								}
							if (kick_list.length == 1)	
								ce("/boot "+kick_list[0]);
					}
				}
				m = line.match(/^!wa$/i);
				if (m)
				{
						ce("/bootact");
				}							
				m = line.match(/^!prv$/i);
				if (m)
				{
					setPrivate(1);

				}	
				m = line.match(/^!pub$/i);
				if (m)
				{
					setPrivate(0);
				}
				m = line.match(/^!l (\d+)$/i);
				if (m)
				{
					if (["500","1000","3000"].indexOf(m[1]) != -1)
					{
						//console.log(304);
						setGameLen(parseInt(m[1]));
					}
				}
				m = line.match(/^!t (\d+)$/i);
				if (m)
				{
					if (["2","3"].indexOf(m[1]) != -1)
					{
						//console.log(313);
						setGameTime(parseInt(m[1]));
					}
				}
				m = line.match(/^!z (.+?)$/i);
				if (m && self_room)
				{							
					send([95,self_room,0],[m[1]]);
				}
				m = line.match(/^!zp$/i);
				if (m && ostatni_wyproszony!="" && self_room)
				{
					  send([95,self_room,0],[ostatni_wyproszony]);
				}
				m = line.match(/^nie pisz$/i);
				if (m)
				{
					t_id || (t_id = setTimeout(function(i){
						if (i==0){
							t_id && (clearTimeout(t_id),t_id = null);
							return
							}
						if (self_room)	
							ce(niepisz_text);								
						i--;
						t_id = setTimeout(arguments.callee,1000,i)},500,niepisz_n));
				}							
			}			
	}
	
}
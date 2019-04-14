var express = require('express');
var app = express();
var body = require('body-parser');

var glob = require( 'glob' ), path = require( 'path' );
var DBService = require('./PunchDBService.js');
var mysql = require('mysql');

var EmployeeList_data = "";
var RepasPauseList_data = "";
var PunchService_online = true;
var ProjetTV_data = "";

var Pusher = require('pusher');

var pusher = new Pusher({
  appId: '747276',
  key: '5f01559b102476973b49',
  secret: '167a5d7ea66a7dc4b6d9',
  cluster: 'us2'
});

var con = mysql.createConnection({
	host: "app.electrotech.ca",
	port: "3379",
  user: "ElectroApp",
	password: "Electr0tecH",
	database: "electrotech"
});

// ================================================================================================
// 				SETUP
// ================================================================================================

app.use(function (req, res, next) {
      // Website you wish to allow to connect
      // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Request methods you wish to allow
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      // Request headers you wish to allow
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
      // Set to true if you need the website to include cookies in the requests sent
      // to the API (e.g. in case you use sessions)
      res.setHeader('Access-Control-Allow-Credentials', true);
	  // Pass to next layer of middleware
      next();
  });

app.use(body.json());


// ================================================================================================
// 				LOOPING FUNCTIONS
// ================================================================================================

(function () {
	con.connect(function(err) {
		var requestLoop = setInterval(function(){
			var tz = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
			var d = (new Date(Date.now() - tz)).toISOString().slice(0, -1);
			d = d.replace('T', ' ');
			d = d.split('.')[0];
			var sql = "UPDATE tblServicesOnline SET ServiceName='PunchServer.js', LastOnline='" + d + "' WHERE ID = 5";
			con.query(sql, function (err, result) {
				console.clear();
				console.log("Updating MySQL LastOnline: " + d)
			});
			DBService.DoPunchServiceIsRunning(function(data){
				PunchService_online = data;
			});
		}, 60000);
	});
}());

(function () {
	con.connect(function(err) {
		var requestLoop = setInterval(function(){
			DBService.GetEmployeeList(function(data){
				if (data == "error"){
					EmployeeList_data = "error";
				}else{
					var Previousdata = EmployeeList_data;
					EmployeeList_data = data;
					if (JSON.stringify(Previousdata) != JSON.stringify(data)) {
						pusher.trigger('my-channel', 'EmployeeList_data', {
							"EmployeeList_data": data
						});
						//console.log("pushing new EmployeeList_data..");
					}
				}
			});
			DBService.GetRepasPauseList(function(data){
				if (data == "error"){
					RepasPauseList_data = "error";
				}else{
					var Previousdata = RepasPauseList_data;
					RepasPauseList_data = data;
					if (JSON.stringify(Previousdata) != JSON.stringify(data)) {
						pusher.trigger('my-channel', 'RepasPauseList_data', {
							"RepasPauseList_data": data
						});
						//console.log("pushing new RepasPauseList_data..");
					}
				}
			});
			DBService.GetProjetTV(function(data){
				if (data == "error"){
					ProjetTV_data = "error";
				}else{
					var Previousdata = ProjetTV_data;
					ProjetTV_data = data;
					if (JSON.stringify(Previousdata) != JSON.stringify(data)) {
						pusher.trigger('my-channel', 'ProjetTV_data', {
							"ProjetTV_data": data
						});
						//console.log("pushing new ProjetTV_data..");
					}
				}
			});
			//console.log("Refresh var RepasPauseList_data and EmployeeList_data")
		}, 2000);
	});
}());


// ===================================================== 
//			http://rds2:1996/GetEmployeInfo?CodeEmp=808
// =====================================================

app.get('/EmployeeInfo', function (req, res, next) {
 	var CodeEmp = parseInt(req.query.CodeEmp);
  if(isNaN(CodeEmp)){
      //console.log("GET EmployeeInfo -> CodeEmp Query Denied! " + CodeEmp + " , " + req.query.CodeEmp);
  }else{
			console.log("GET EmployeeInfo -> CodeEmp Query Granted! " + CodeEmp + " , " + req.query.CodeEmp);
			DBService.GetEmployeInfo(CodeEmp, function(data){
				if (data == "error"){
					res.status(404).send("No data found");
				}else{
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(data));
				}
			});
  }	
});


// ================================================================================================
//				http://rds2:1996/EmployeeList
// ================================================================================================

app.get('/EmployeesStatus_old_replace_by_Variable_EmployeeList_data', function (req, res, next) {
	DBService.GetEmployeeList(function(data){
		if (data == "error"){
			res.status(404).send("No data found");
		}else{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(data));
		}
	});
});

app.get('/EmployeesStatus', function (req, res, next) {
	console.log("/EmployeesStatus'");
	if (EmployeeList_data == "error"){
		res.status(404).send("No data found");
	} else {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(EmployeeList_data));
	}
});

app.get('/PunchServiceOnline', function (req, res, next) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(PunchService_online));
})

// ================================================================================================
//				http://rds2:1996/GetRepasPauseList
// ================================================================================================

app.get('/LunchBreakList_old_replace_by_Variable_RepasPauseList_data', function (req, res, next) {
	DBService.GetRepasPauseList(function(data){
		if (data == "error"){
			res.status(404).send("No data found");
		}else{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(data));
		}
	});
});

app.get('/LunchBreakList', function (req, res, next) {
	console.log("/LunchBreakList'");
	if (RepasPauseList_data == "error"){
		res.status(404).send("No data found");
	} else {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(RepasPauseList_data));
	}
});

app.get('/ProjetTV', function (req, res, next) {
	console.log("/ProjetTV'");
	if (ProjetTV_data == "error"){
		res.status(404).send("No data found");
	} else {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(ProjetTV_data));
	}
});

app.get('/TodayProject', function (req, res, next) {

	var CodeEmp = parseInt(req.query.CodeEmp);
	
	if (CodeEmp != parseInt(req.query.CodeEmp)) {
		//console.log("CodeEmp Invalid");
		return;
	}	
	console.log("/TodayProject");
	DBService.GetEmployeTodayProject(CodeEmp, function(data){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(data));
		//console.log(data);
});
});


// ================================================================================================
// 			UPDATE / ADDNEW QUERY
// ================================================================================================

app.patch('/Punch', function(req, res, next) {

	var timestamp = (Date.now());
	var CodeEmp = parseInt(req.query.CodeEmp);
	var CurrentTime = req.body.CurrentTime;
	var CurrentDate = req.body.CurrentDate;
	var CurrentDateFull = req.body.CurrentDateFull;
	var Type = req.body.Type;

	if (CodeEmp != parseInt(req.query.CodeEmp)) {
		//console.log("CodeEmp Invalid");
		return;
	}	
	
	console.log("/Punch [" + Type + "] ->date: " + CurrentDate + ", time: " + CurrentTime + ", full: " + CurrentDateFull);

	DBService.Punch(CodeEmp, CurrentDateFull, Type, function(data){
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(data));
	timestamp = (Date.now() - timestamp);
	});
	
	console.log("Punch " + Type + " Successful in " + timestamp + "ms");
	
});

app.patch('/PunchProjet', function(req, res, next) {

	var timestamp = (Date.now());
	var CodeEmp = parseInt(req.query.CodeEmp);
	var Start = req.body.StartDateFull;
	var End = req.body.EndDateFull;
	var Projet = req.body.Projet;
	var ProjetActivite = req.body.ProjetActivite;
	var ProjetTache = req.body.ProjetTache;
	var ProjetNote = req.body.ProjetNote;
	var Type = req.body.Type;
	var noIDpunch = req.body.noIDpunch;

	if (CodeEmp != parseInt(req.query.CodeEmp)) {
		//console.log("CodeEmp Invalid");
		return;
	}	

	console.log("/PunchProjet " + CodeEmp);

	DBService.Projet(CodeEmp, Type, Start, End, Projet, ProjetActivite, ProjetTache, ProjetNote, noIDpunch, function(data){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(data));
			timestamp = (Date.now() - timestamp);
			//console.log("Projet " + Type + " Successful in " + timestamp + "ms");
	});
	
});

// ================================================================================================
// 			SERVER LISTEN / START
// ================================================================================================

var server = app.listen(1998, function () {
	console.log("Started...PunchServer.js is running on rds2, port 1998");
	console.log("Open http://rds2/Punch/index.html directly to test.");
});

glob.sync( './routes/js/*.js' ).forEach( function( file ) {
  require( path.resolve( file ) );
});

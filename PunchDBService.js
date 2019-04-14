
const ADODB = require('node-adodb');
var mysql = require('mysql');
var moment = require('moment');

var conmysql = mysql.createConnection({
	host: "app.electrotech.ca",
	port: "3379",
  	user: "ElectroApp",
	password: "Electr0tecH",
	database: "electrotech"
});

// =====================================================
// ================ SQL CONFIGURATIONS =================
// =====================================================

const connection1 = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=M:\\ELECTROTECH\\BDSource\\ElectrotechDB.accdb;');
const connection2 = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=M:\\ELECTROTECH\\BDSource\\ElectrotechDB2.accdb;');
const connection3 = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=M:\\ELECTROTECH\\BDSource\\ElectrotechDB3.accdb;');

// ==============================================================================
// =======================    	SELECT SQL FUNCTIONS       ======================
// ==============================================================================

exports.DoPunchServiceIsRunning = function(callback){
	var sSql = "SELECT LastOnline FROM tblServicesOnline WHERE id = 1;"
	conmysql.query(sSql, function (error, data, fields) {
		if (error) {
			console.log(error);
			callback(error);
		} else {
			var t1 = new Date(data[0]['LastOnline']);
			var t2 = new Date();
			var dif = t2.getTime() - t1.getTime();
			if (dif < 100000){
				callback(true);
			}else{
				callback(false);	
			}
		}
	});
}

exports.GetProjetTV = function(callback){
	var d = new Date();
	var dToday = DateToYYYYMMDD(d);
	//console.log(dToday);
	var sSql = "SELECT * FROM tblProjetTV";
	connection3
	.query(sSql)
	.then(data => {
	  callback(data);
	})
	.catch(error => {
	  callback("error");
  	});
}

exports.GetEmployeTodayProject = function(CodeEmp, callback){
	var d = new Date();
	var dToday = DateToYYYYMMDD(d);
	//console.log(dToday);
	var sSql = "SELECT * FROM tblPunch WHERE Type='PROJET' AND left(DebutReel,10) = '" + dToday + "' AND CodeEmploye = " + CodeEmp + " ORDER BY NoIDpunch DESC";
	connection2
	.query(sSql)
	.then(data => {
	  callback(data);
	})
	.catch(error => {
	  callback("error");
  	});
}


exports.GetEmployeInfo = function(CodeEmp, callback){
	var sSql = "SELECT * FROM tblEnCoursEmp WHERE CodeEmploye = " + CodeEmp;
	//connection3
	//.query(sSql)
	//.then(data => {
	//  callback(data);
	//})
	//.catch(error => {
	//  callback("error");
  	//});
	conmysql.query(sSql, function (error, data, fields) {
		if (error) {
			console.log(error);
			callback(error);
		} else {
			callback(data);
		}
	});
}

exports.GetEmployeeList = function(callback){
	var sSql = "SELECT * FROM tblEnCoursEmp WHERE CodeEmploye <> 999 ORDER BY NomEmploye;";
	//console.log(sSql);
	//connection3
    //.query(sSql)
    //.then(data => {
    //    callback(data);
    //})
    //.catch(error => {
    //    callback("error");
    //});
	conmysql.query(sSql, function (error, data, fields) {
		if (error) {
			//console.log(error);
			callback(error);
		} else {
			callback(data);
		}
	});
}

exports.GetRepasPauseList = function(callback){
	var sSql = "SELECT * FROM tblPunchRepasPause ORDER BY Fin;";
	conmysql.query(sSql, function (error, data, fields) {
		if (error) {
			callback(error);
		} else {
			callback(data);
		}
	});
    //connection3
    //.query(sSql)
    //.then(data => {
	//	console.log(data);
    //    callback(data);
    //})
    //.catch(error => {
    //    callback("error");
    //});
}

function fGetLastPunchOfEmployee(CodeEmp, callback) {
	//retourne le record du dernier tblpunch
	var sSql = "SELECT TOP 1 * FROM tblPunch WHERE CodeEmploye = " + CodeEmp + " AND Type='PUNCH' ORDER BY NoIDpunch DESC";// + " AND Type='PUNCH' ORDER BY NoIDpunch DESC;";
	connection2
	.query(sSql)
	.then(data => {
		callback(data);
	})
	.catch(error => {
		callback("error");
	});
}

function fCheckIfExisttblEnCoursEmp(CodeEmp, callback){
	//retourne le record du tblencoursemp, sert pour savoir si le record existe avant d'essayer de l'update
	var sSql = "SELECT * FROM tblEnCoursEmp WHERE CodeEmploye = " + CodeEmp + ";";
	//connection3
	//.query(sSql)
	//.then(data => {
	//	callback(data);
	//})
	//.catch(error => {
	//	callback("error");
	//});
	conmysql.query(sSql, function (error, data, fields) {
		if (error) {
			callback("error");
		} else {
			if (data.length > 0) {
				callback(data);
			} else {
				callback("no employee found");
			}
		}
	});
}

function fGetEmployeeInfo(CodeEmp, callback){
	//retourne le record du tblencoursemp, sert pour savoir si le record existe avant d'essayer de l'update
	var sSql = "SELECT TOP 1 [CodeEmp], [DépartementPermanentEmployé], [EmployéActif], [NomEmployé], [PrénomEmployé] FROM [tbl_Employés] WHERE CodeEmp = " + CodeEmp + " AND EmployéActif = true";
	connection3
	.query(sSql)
	.then(data => {
		callback(data);
	})
	.catch(error => {
		callback("error");
	});
}

// ==============================================================================
// ===============    P U N C H    F U N C T I O N S       ======================
// ==============================================================================


exports.Punch = function(CodeEmp, CurrentDateFull, Type, callback){
	//ajout du punch de la journée dans tblPunch.
	//dois aussi mettre a jour le tblencoursemp.
	//console.log("Inserting " + Type + " INTO tblPunchRequest WHERE " + CodeEmp + " @ " + CurrentDateFull);
	var d = new Date();
	var Stamp = DatetoAccessPunch(d);
	var sSql = "INSERT INTO tblPunchRequest ( CodeEmploye, Type, Start)" + 
		" VALUES ('" + CodeEmp + "', '" + Type + "', '" + CurrentDateFull + "')";
	conmysql.query(sSql, (err, results, fields) => {
		if (err) {
			callback(err);
		}
		// get inserted id
		fCheckIfExisttblEnCoursEmp(CodeEmp, function(data2){
			if (data2 == "error"){
				console.log("error " + data2);
				callback("error");
			} else if (data2 == "no employee found") {
				fAddNewtblEnCoursEmp(CodeEmp, Type, function(data4){
					callback(data4);
				});	
			} else {
				var EmpEnCours = data2[0]['CodeEmploye'];
				var PreviousEnCours = data2[0]['EnCoursEmploye'];
				var PreviousType = data2[0]['TypeEnCoursEmploye'];
				fUpdatetblEnCoursEmp(CodeEmp, Type, PreviousEnCours, PreviousType, function(data3){
					callback(data3);
				});
			}
		});
	  });
}

exports.Projet = function(CodeEmp, Type, Start, End, Projet, ProjetActivite, ProjetTache, ProjetNote, noIDpunch, callback){
	//ajout projet dans tblPunch.
	//dois aussi mettre a jour le tblencoursemp.
	console.log("Inserting " + Type + " INTO tblPunchRequest WHERE " + CodeEmp + " -> " + Projet);
	var d = new Date();
	var Stamp = DatetoAccessPunch(d);

	var sSql = "INSERT INTO tblPunchRequest ( CodeEmploye, Type, Start, End, Projet, ProjetActivite, " + 
		"ProjetTache, ProjetNote, noIDpunch) " + 
		"VALUES ('" + CodeEmp + "', '" + Type + "', '" + Start + "', '" + End + "', " + 
		"'" + Projet + "', '" + ProjetActivite + "', '" + ProjetTache + "', '" + ProjetNote + "', " + noIDpunch + ")";

	conmysql.query(sSql, (err, results, fields) => {
		if (err) {
			callback(err);
		}
		// get inserted id
		fCheckIfExisttblEnCoursEmp(CodeEmp, function(data2){
			if (data2 == "error"){
				console.log("error " + data2);
				callback("error");
			} else if (data2 == "no employee found") {
				fAddNewtblEnCoursEmp(CodeEmp, 'PROJET', function(data4){
					callback(data4);
				});	
			} else {
				var EmpEnCours = data2[0]['CodeEmploye'];
				var PreviousEnCours = data2[0]['EnCoursEmploye'];
				var PreviousType = data2[0]['TypeEnCoursEmploye'];
				fUpdatetblEnCoursEmp(CodeEmp, 'PROJET', PreviousEnCours, PreviousType, function(data3){
					callback(data3);
				});
			}
		});
	  });
}

function fUpdatetblEnCoursEmp(CodeEmp, Type, PreviousEnCours, PreviousType, callback){
	
	var NewType = "";
	var NewEnCours = "";

	if (Type=="ENTREE") {
		NewType = "ENTREE"
		NewEnCours = "PROJET";
	}else if (Type=="SORTIE") {
		NewType = "SORTIE";
		NewEnCours = "MAISON";
	}else if (Type=="REPAS") {
		if (PreviousEnCours == "REPAS") {
			NewEnCours = "PROJET";
		} else {
			NewEnCours = "REPAS";		
		}
		NewType = "ENTREE"
	}else if (Type=="ABSENCE") {
		if (PreviousEnCours == "ABSENCE") {
			NewEnCours = "PROJET";
		} else {
			NewEnCours = "ABSENCE";		
		}
		NewType = "ENTREE"
	}else if (Type=="PAUSE") {
		if (PreviousEnCours == "PAUSE") {
			NewEnCours = "PROJET";
		} else {
			NewEnCours = "PAUSE";		
		}
		NewType = "ENTREE"
	}else{
		NewEnCours = "PROJET";
		NewType = "ENTREE"
	}
	
	var sSql = "UPDATE tblEnCoursEmp" +
		" SET TypeEnCoursEmploye = '" + NewType + "'," +
		" EnCoursEmploye = '" + NewEnCours + "'" + 
		" WHERE CodeEmploye = " + CodeEmp + ";";
	//console.log(sSql);
	//connection3
	//.execute(sSql)
	//.then(data => {
	//	callback(data);
	//})
	//.catch(error => {
	//	callback("error fUpdatetblEnCoursEmp" + JSON.stringify(error));
	//});
	conmysql.query(sSql, function (error, data, fields) {
		if (error) {
			callback(error);
		} else {
			callback(data);
		}
	});
}	

function fAddNewtblEnCoursEmp(CodeEmp, Type, callback){
		
	var EnCours = "";

	if (Type=="ENTREE") {
		EnCours = "PROJET";
		Type = "ENTREE"
	}else if (Type=="SORTIE") {
		EnCours = "MAISON";
		Type = "SORTIE"
	}else if (Type=="REPAS") {
		EnCours = "REPAS";
		Type = "ENTREE"
	}else if (Type=="ABSENCE") {
		EnCours = "ABSENCE";
		Type = "ENTREE"
	}else if (Type=="PAUSE") {
		EnCours = "PAUSE";
		Type = "ENTREE"
	}else{
		EnCours = "PROJET";
		Type = "ENTREE"
	}
	fGetEmployeeInfo(CodeEmp, function(data){
		var NomEmploye = data[0]['NomEmployé'];
		var PrenomEmploye = data[0]['PrénomEmployé'];
		if (CodeEmp = data[0]['CodeEmp']){
			var sSql = "INSERT INTO tblEnCoursEmp (NomEmploye, PrenomEmploye, CodeEmploye, EnCoursEmploye, TypeEnCoursEmploye )" + 
			" VALUES ('" + NomEmploye + "', '" + PrenomEmploye + "', " + CodeEmp + ", '" + EnCours + "', '" + Type + "')";
			console.log(sSql);

			conmysql.query(sSql, function (error, data, fields) {
				if (error) {
					callback(error);
				} else {
					callback(data);
				}
			});
		} else {
			console.log("This employee is invalid or inactive :" + CodeEmp)
			callback("inactive/invalid emplyee")
		}
	});
}

// ==============================================================================
// ==========================   GENERAL FUNCTION   ==============================
// ==============================================================================

function DateAccessToJSDate(dateToConvert){
    var d = new Date(dateToConvert);
		var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
		var gtm = 5;
    if (moment(d).isDST()== true){gtm = 4}
    var nd = new Date(utc + (3600000*-gtm)); //-5 = GTM-5'
    //console.log("DATE CONVERTER: " + dateToConvert + " -> " + nd);
    return nd;
}

function DateToYYYYMMDD(dateToConvert){
    var d = new Date(dateToConvert),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function DateToHHMMSS(dateToConvert){
    var d = new Date(dateToConvert);
		var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
		var gtm = 5;
    if (moment(d).isDST()== true){gtm = 4}
    var nd = new Date(utc + (3600000*-gtm)); //-5 = GTM-5'
    var t = new Date(d).toLocaleTimeString();
    //console.log("DATE CONVERTER: " + dateToConvert + " -> " + t);
    return t;
}

function DatetoAccessPunch(d){
	var dDay = DateToYYYYMMDD(d);
	var dHour = DateToHHMMSS(d);
	return dDay + " " + dHour;
}

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
	var date = new Date(this.getTime());
	date.setHours(0, 0, 0, 0);
	// Thursday in current week decides the year.
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	// January 4 is always in week 1.
	var week1 = new Date(date.getFullYear(), 0, 4);
	// Adjust to Thursday in week 1 and count number of weeks from date to week1.
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
						  - 3 + (week1.getDay() + 6) % 7) / 7);
  }
  
  // Returns the four-digit year corresponding to the ISO week of the date.
  Date.prototype.getWeekYear = function() {
	var date = new Date(this.getTime());
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	return date.getFullYear();
  }
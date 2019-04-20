
(function(window){
  var diagdata = [];
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }
    
    
    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });
        //gets the diagnostic report data
        var diag = smart.patient.api.fetchAll({type: 'DiagnosticReport'});
        var procr = smart.patient.api.fetchAll({type: 'ProcedureRequest'});
        
        $.when(pt, diag).fail(onError);
        
        $.when(pt, procr).fail(onError);
        
        
        $.when(pt, diag).done(function(pt, diag) {
          if (diag.length != 0) {
            var idn = 1;
            for (i in diag) {
              var encounterid = diag[i].encounter.id;
              console.log(encounterid);
              var pname = diag[i].subject.display; 
              var dorder = diag[i].code.text;
              var completedDateValue = diag[i].effectiveDateTime;
              var statusValue = diag[i].status
              var col = "red";
              if (statusValue == 'final') {
                col = "green"
              } else if (statusValue == 'registered' || statusValue == "partial") {
                col = "yellow";
              } else {
                col = "red";
              }
              var enc = smart.api.read({type: "Encounter", id: parseInt(encounterid)});
              var location;
              var doc;
              $.when(pt, enc).fail(onError);
              $.when(pt, enc).done(function(pt, enc) {
                console.log(enc);
              });
              var element = {id: idn, name: pname, order: dorder, completedDate: completedDateValue, status: statusValue, color: col};
              diagdata.push(element);
              idn = idn + 1;
            }
            function customFilter(data){
    return tabledata;
}

//Trigger setFilter function with correct parameters
function updateFilter(){

    var filter = $("#filter-field").val() == "function" ? customFilter : $("#filter-field").val();

    if($("#filter-field").val() == "function" ){
        $("#filter-type").prop("disabled", true);
        $("#filter-value").prop("disabled", true);
    }else{
        $("#filter-type").prop("disabled", false);
        $("#filter-value").prop("disabled", false);
    }

    table.setFilter(filter, $("#filter-type").val(), $("#filter-value").val());
}

//Update filters on value change
$("#filter-field, #filter-type").change(updateFilter);
$("#filter-value").keyup(updateFilter);

//Clear filters on "Clear Filters" button click
$("#filter-clear").click(function(){
    $("#filter-field").val("");
    $("#filter-type").val("=");
    $("#filter-value").val("");

    table.clearFilter();
});
            var table = new Tabulator("#example-table", {
                height:200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                data: diagdata, //assign data to table
                layout:"fitData", //fit columns to width of table (optional)
                columns:[ //Define Table Columns
                    {title:"Name", field:"name", width:150},
                    {title:"Order", field:"order", align:"left"},
                    {title:"Completed Date", field:"completedDate"},
                    {title:"Status", field:"status"},
                    {title:"Color", field:"color",formatter:"color", width:100},
                ],
                rowClick:function(e, row){ //trigger an alert message when the row is clicked
                    alert("Row " + row.getData().id + " Clicked!!!!");
                },
            });
            table.replaceData(diagdata);
           
          }
         });
        

        
        $.when(pt, procr).done(function(pt, proc) {
          if (proc.length != 0) {
            console.log(procr);
            console.log(procr[0]);
//             console.log(procr[0].subject.display);
//             console.log(procr[0].code.text);
//             console.log(procr[0].orderedOn);
//             console.log(procr[0].orderer.display);
//             console.log(procr[0].status);
//             console.log(procr[0].ScheduledDateTime);
            
          }

         });
        
        $.when(pt, obv).fail(onError);
        $.when(pt, obv).done(function(patient, obv) {
          

          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

//   window.drawVisualization = function(p) {
//     $('#holder').show();
//     $('#loading').hide();
//     $('#fname').html(p.fname);
//     $('#lname').html(p.lname);
//     $('#gender').html(p.gender);
//     $('#birthdate').html(p.birthdate);
//     $('#height').html(p.height);
//     $('#systolicbp').html(p.systolicbp);
//     $('#diastolicbp').html(p.diastolicbp);
//     $('#ldl').html(p.ldl);
//     $('#hdl').html(p.hdl);
//   };
  
  
//  var tabledata = [
//     {id:1, name:"Oli Bob", age:"12", col:"red", dob:""},
//     {id:2, name:"Mary May", age:"1", col:"blue", dob:"14/05/1982"},
//     {id:3, name:"Christine Lobowski", age:"42", col:"green", dob:"22/05/1982"},
//     {id:4, name:"Brendon Philips", age:"125", col:"orange", dob:"01/08/1980"},
//     {id:5, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999"},
//     {id:6, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999"}
//  ];
  
  var tabledata = [
  {
    "id": 1,
    "name": "PETERS, TIMOTHY",
    "order": "XR Abdomen AP",
    "completedDate": "2018-09-24T18:01:00.000Z",
    "status": "appended",
    "color": "red"
  },
  {
    "id": 2,
    "name": "PETERS, TIMOTHY",
    "order": "General Radiography Report",
    "completedDate": "2017-08-17T13:02:00.000Z",
    "status": "entered-in-error",
    "color": "red"
  },
  {
    "id": 3,
    "name": "PETERS, TIMOTHY",
    "order": "RADRPT",
    "completedDate": "2016-05-04T19:09:37.000Z",
    "status": "final",
    "color": "green"
  },
  {
    "id": 4,
    "name": "PETERS, TIMOTHY",
    "order": "RADRPT",
    "completedDate": "2015-09-22T15:57:16.000Z",
    "status": "partial",
    "color": "yellow"
  },
  {
    "id": 5,
    "name": "PETERS, TIMOTHY",
    "order": "Mammography Report",
    "completedDate": "2014-10-03T19:02:05.000Z",
    "status": "final",
    "color": "green"
  },
  {
    "id": 6,
    "name": "PETERS, TIMOTHY",
    "order": "RADRPT",
    "completedDate": "2014-05-05T21:54:49.000Z",
    "status": "registered",
    "color": "yellow"
  },
  {
    "id": 7,
    "name": "PETERS, TIMOTHY",
    "order": "RADRPT",
    "completedDate": "2014-01-03T22:45:05.000Z",
    "status": "partial",
    "color": "yellow"
  },
  {
    "id": 8,
    "name": "PETERS, TIMOTHY",
    "order": "RADRPT",
    "completedDate": "2014-01-02T17:13:09.000Z",
    "status": "entered-in-error",
    "color": "red"
  },
  {
    "id": 9,
    "name": "PETERS, TIMOTHY",
    "order": "RADRPT",
    "completedDate": "2013-09-12T16:18:04.000Z",
    "status": "appended",
    "color": "red"
  }
]
  
  console.log(tabledata);
  console.log(diagdata);
  
   
  


})(window);

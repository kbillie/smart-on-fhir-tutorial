
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
              //console.log(diag[i]);
              var encounterid = diag[i].encounter.reference;
              encounterid = encounterid.replace("Encounter/","");
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
              var loc;
              var doc;
              
              
              var element = {id: idn, name: pname, order: dorder, completedDate: completedDateValue, status: statusValue, color: col, doctor: doc, location: loc, eid:encounterid};
              diagdata.push(element);
              
              idn = idn + 1;
            }
            function customFilter(data){
                return diagdata;
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
                layout:"fitDataFill", //fit columns to width of table (optional)
                columns:[ //Define Table Columns
                    {title:"Name", field:"name"},
                    {title:"Order", field:"order", align:"left"},
                    {title:"Completed Date", field:"completedDate"},
                    {title:"Status", field:"status"},
                    {title:"Doctor", field:"doctor",},
                    {title:"Location", field:"location"},
                    {title:"Color", field:"color",formatter:"color", width:200},
                ],
                rowClick:function(e, row){ //trigger an alert message when the row is clicked
                    alert("Row " + row.getData().id + " Clicked!!!!");
                },
            });
            
            for(i in diagdata) {
              var enc = smart.api.read({type: "Encounter", id: parseInt(diagdata[i].eid)});
              $.when(pt, enc).fail(onError);
              $.when(pt, enc).done(function(pt, enc) {
                console.log(enc);
                var matchedid = enc.config.id;
                for (j in diagdata) {
                  if (diagdata[j].eid == matchedid) {
                    diagdata[j].location = enc.data.location[0].location.display;
                    diagdata[j].doctor = enc.data.participant[0].individual.display;
                  }
                }
                
                
                table.replaceData(diagdata);

               });
            }
            //table.replaceData(diagdata);

            console.log(diagdata);
           
            }
         });
        
//               $.when(pt, enc).fail(onError);
//               $.when(pt, enc).done(function(pt, enc) {
//                 loc = enc.data.location[0].location.display;
//                 doc = enc.data.participant[0].individual.display;
//                 console.log(loc);
//                 console.log(doc);
//                });

        
//         $.when(pt, procr).done(function(pt, proc) {
//           if (proc.length != 0) {
//             console.log(procr);
//             console.log(procr[0]);
//             console.log(procr[0].subject.display);
//             console.log(procr[0].code.text);
//             console.log(procr[0].orderedOn);
//             console.log(procr[0].orderer.display);
//             console.log(procr[0].status);
//             console.log(procr[0].ScheduledDateTime);
            
//           }

//          });
        
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
    

  
   
  


})(window);

function editvulnerability(){
var csrfmiddlewaretoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
var project = document.getElementsByName('project')[0].value;
var vulnerabilityname = encodeURI(document.getElementById("editable-select").value);
var vulnerabilityseverity = document.getElementById('baseSeverity').innerHTML.replace(/[()]/g, ''); 
var cvssscore = document.getElementById('baseMetricScore').innerHTML;
var cvssvector = document.getElementById('vectorString').value;
var status = document.getElementById('input-select').value;
var vulnerabilitydescription = encodeURI(CKEDITOR.instances['id_vulnerabilitydescription'].getData());
var POC = encodeURI(CKEDITOR.instances['id_POC'].getData());
var vulnerabilitysolution = encodeURI(CKEDITOR.instances['id_vulnerabilitysolution'].getData());
var vulnerabilityreferlnk = encodeURI(CKEDITOR.instances['id_vulnerabilityreferlnk'].getData());
var table = $('#editvulninstace').DataTable();
if (vulnerabilityseverity == "None") {
    var vulnerabilityseverity = "Informational";
  } 
  if (vulnerabilityname == "") {
    swal("Missing", "Vulnerability Title is Missing", "error");
    return false
  } 
  else if (cvssscore == "") {
    swal("Missing", "CVSS Score is Missing", "error");
    return false
  }
  else if (status == "") {
    swal("Missing", " VulnerabilityStatus is Missing", "error");
    return false
  }
  else if (vulnerabilitydescription == "") {
    swal("Missing", "Vulnerability Description is Missing", "error");
    return false
  }
  else if (vulnerabilitysolution == "") {
    swal("Missing", "Vulnerability Solution is Missing", "error");
    return false
  }
  else if ( ! table.data().any() ) {
    swal("Missing", "No Vulnerable URL added", "error");
    return false
  }
  else{
var xhr = new XMLHttpRequest();
xhr.open('POST','', true);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = function () {
	
	if (xhr.status === 200) {
        
        window.location.href = '/project/'+project+'/';

      } 

}
xhr.send('csrfmiddlewaretoken='+csrfmiddlewaretoken+'&project='+project+'&vulnerabilityname='+vulnerabilityname+'&vulnerabilityseverity='+vulnerabilityseverity+'&cvssscore='+cvssscore+'&cvssvector='+cvssvector+'&status='+status+'&vulnerabilitydescription='+vulnerabilitydescription+'&POC='+POC+'&vulnerabilitysolution='+vulnerabilitysolution+'&vulnerabilityreferlnk='+vulnerabilityreferlnk);
}
}



 function addnewvulnerability(oFormElement) {
    var csrfmiddlewaretoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
	var vulnerabilityseverity = document.getElementById('baseSeverity').innerHTML.replace(/[()]/g, ''); 
var cvssscore = document.getElementById('baseMetricScore').innerHTML;
var cvssvector = document.getElementById('vectorString').value;
var vulnerabilityname = encodeURI(document.getElementById("editable-select").value);
//var vulnerabilityname = encodeURI(document.getElementById('select2-siteID-container').innerHTML)
var status = document.getElementById('input-select').value;
//var status = document.getElementById('select2-input-select-container').innerHTML
var vulnerabilitydescription = encodeURI(CKEDITOR.instances['id_vulnerabilitydescription'].getData());
var POC = encodeURI(CKEDITOR.instances['id_POC'].getData());
var vulnerabilitysolution = encodeURI(CKEDITOR.instances['id_vulnerabilitysolution'].getData());
var vulnerabilityreferlnk = encodeURI(CKEDITOR.instances['id_vulnerabilityreferlnk'].getData());
var project = document.getElementsByName('project')[0].value;	 
var table = $('#addinstancetable').DataTable();
if (vulnerabilityseverity == "None") {
    var vulnerabilityseverity = "Informational";
  } 
	 
  
  if (vulnerabilityname == "") {
    swal("Missing", "Vulnerability Title is Missing", "error");
    return false
  } 
  else if (cvssscore == "") {
    swal("Missing", "CVSS Score is Missing", "error");
    return false
  }
  else if (status == "") {
    swal("Missing", " VulnerabilityStatus is Missing", "error");
    return false
  }
  else if (vulnerabilitydescription == "") {
    swal("Missing", "Vulnerability Description is Missing", "error");
    return false
  }
  else if (vulnerabilitysolution == "") {
    swal("Missing", "Vulnerability Solution is Missing", "error");
    return false
  }
  else if ( ! table.data().any() ) {
    swal("Missing", "No Vulnerable URL added", "error");
    return false
  }
else {
        var xhr = new XMLHttpRequest();
        //xhr.responseType = 'json';
        xhr.onload = function() {
            
            var jsonResponse = JSON.parse(xhr.responseText);
            //var jsonResponse = JSON.parse(result);
            //alert(xhr.responseText);
            //var jsonResponse = xhr.responseText;
            //console.log(jsonResponse);
            if (jsonResponse.Status == "Success") {
                var id = jsonResponse.Vulnerability
                var table = $('#addinstancetable').DataTable();

                if ( ! table.data().any() ) {
                    //history.back()
					window.location.href = '/project/'+jsonResponse.Project+'/';
                    
                }
                else {
                    var table = $('#addinstancetable').tableToJSON({
                        ignoreColumns: [0,3]
                  });
                    
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", "/project/report/addurl/"+id+"/");
                xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xmlhttp.onload  = function(){
                    //var location = xmlhttp.getResponseHeader("Location")
                    var jsonResponse = JSON.parse(xmlhttp.responseText);
                    window.location = jsonResponse.redirect
                }
                xmlhttp.send(JSON.stringify(table));
                }
    
    
            } else {
                // Invalid username/ password
                alert("Fail to Save");
            }
        }
        //xhr.open(oFormElement.method, oFormElement.action, true);
        xhr.open('POST','', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        //xhr.send(new FormData(oFormElement));
		xhr.send('csrfmiddlewaretoken='+csrfmiddlewaretoken+'&project='+project+'&vulnerabilityname='+vulnerabilityname+'&vulnerabilityseverity='+vulnerabilityseverity+'&cvssscore='+cvssscore+'&cvssvector='+cvssvector+'&status='+status+'&vulnerabilitydescription='+vulnerabilitydescription+'&POC='+POC+'&vulnerabilitysolution='+vulnerabilitysolution+'&vulnerabilityreferlnk='+vulnerabilityreferlnk);

        return false;
    }
}



function addnewvulnerabilitydb(oFormElement){
  
  var csrfmiddlewaretoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
	var vulnerabilityseverity = document.getElementById('baseSeverity').innerHTML.replace(/[()]/g, ''); 
  var cvssscore = document.getElementById('baseMetricScore').innerHTML;
  var cvssvector = document.getElementById('vectorString').value;
  var vulnerabilityname = encodeURI(document.getElementById('id_vulnerabilityname').value);
  var vulnerabilitydescription = encodeURI(CKEDITOR.instances['id_vulnerabilitydescription'].getData());
  var vulnerabilitysolution = encodeURI(CKEDITOR.instances['id_vulnerabilitysolution'].getData());
  var vulnerabilityreferlnk = encodeURI(CKEDITOR.instances['id_vulnerabilityreferlnk'].getData());
  if (vulnerabilityseverity == "None") {
    var vulnerabilityseverity = "Informational";
  } 
  if (vulnerabilityname == "") {
    swal("Missing", "Vulnerability Title is Missing", "error");
    return false
  }
  else if (cvssscore == "") {
    swal("Missing", "CVSS Score is Missing", "error");
    return false
  }
  
  else if (vulnerabilitydescription == "") {
    swal("Missing", "Vulnerability Description is Missing", "error");
    return false
  }
  else if (vulnerabilitysolution == "") {
    swal("Missing", "Vulnerability Solution is Missing", "error");
    return false
  }
  else {
    var xhr = new XMLHttpRequest();
        //xhr.responseType = 'json';
        xhr.onload = function() {
          if (xhr.status == 200) {
            window.location.href = '/vulnerability/'
          }
          else {
            swal("Fail", "Server Error", "error");
          }
        }
        xhr.open('POST','/vulnerability/add', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        //xhr.send(new FormData(oFormElement));
		    xhr.send('csrfmiddlewaretoken='+csrfmiddlewaretoken+'&vulnerabilityname='+vulnerabilityname+'&vulnerabilityseverity='+vulnerabilityseverity+'&cvssscore='+cvssscore+'&cvssvector='+cvssvector+'&vulnerabilitydescription='+vulnerabilitydescription+'&vulnerabilitysolution='+vulnerabilitysolution+'&vulnerabilityreferlnk='+vulnerabilityreferlnk);

        return false;
  }
}

function editvulnerabilitydb(oFormElement){
  var csrfmiddlewaretoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
	var vulnerabilityseverity = document.getElementById('baseSeverity').innerHTML.replace(/[()]/g, ''); 
  var cvssscore = document.getElementById('baseMetricScore').innerHTML;
  var cvssvector = document.getElementById('vectorString').value;
  var vulnerabilityname = encodeURI(document.getElementById('id_vulnerabilityname').value);
  var vulnerabilitydescription = encodeURI(CKEDITOR.instances['id_vulnerabilitydescription'].getData());
  var vulnerabilitysolution = encodeURI(CKEDITOR.instances['id_vulnerabilitysolution'].getData());
  var vulnerabilityreferlnk = encodeURI(CKEDITOR.instances['id_vulnerabilityreferlnk'].getData());
  if (vulnerabilityseverity == "None") {
    var vulnerabilityseverity = "Informational";
  } 
  if (vulnerabilityname == "") {
    swal("Missing", "Vulnerability Title is Missing", "error");
    return false
  }
  else if (cvssscore == "") {
    swal("Missing", "CVSS Score is Missing", "error");
    return false
  }
  
  else if (vulnerabilitydescription == "") {
    swal("Missing", "Vulnerability Description is Missing", "error");
    return false
  }
  else if (vulnerabilitysolution == "") {
    swal("Missing", "Vulnerability Solution is Missing", "error");
    return false
  }
  else {
    var xhr = new XMLHttpRequest();
        //xhr.responseType = 'json';
        xhr.onload = function() {
          var jsonResponse = JSON.parse(xhr.responseText);
          if (jsonResponse.Status == "Success") {
            swal("Success", "", "success");
          }
          else {
            swal("Fail", "Server Error", "error");
          }
        }
        xhr.open('POST','', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        //xhr.send(new FormData(oFormElement));
		    xhr.send('csrfmiddlewaretoken='+csrfmiddlewaretoken+'&vulnerabilityname='+vulnerabilityname+'&vulnerabilityseverity='+vulnerabilityseverity+'&cvssscore='+cvssscore+'&cvssvector='+cvssvector+'&vulnerabilitydescription='+vulnerabilitydescription+'&vulnerabilitysolution='+vulnerabilitysolution+'&vulnerabilityreferlnk='+vulnerabilityreferlnk);

        return false;
  }
}



    function fetchvulnerabilitydetails(){

        var select = document.getElementById("id_vulnerabilityname").value;
        console.log(select)
        var http = new XMLHttpRequest();
        var params = 'title='+encodeURIComponent(document.getElementById("id_vulnerabilityname").value);
        var url = '/project/fetch/vulnerability?'+params;
        
        http.open('GET', url, true);
        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                //alert(http.responseText);
                var Data = JSON.parse(http.responseText);
                //console.log(Data.Description)
                //document.getElementById("id_vulnerabilitydescription").inn
                CKEDITOR.instances['id_vulnerabilitydescription'].setData(Data.Description);
                CKEDITOR.instances['id_vulnerabilitysolution'].setData(Data.solution);
                CKEDITOR.instances['id_vulnerabilityreferlnk'].setData(Data.refer);
                const $select = document.querySelector('#select-Severity');
                $select.value = Data.severity
                
            }
        }
        http.send();

    }



    function deleterowfunction() {
        $(document).ready(function () {
            var table = $('#editvulninstace').DataTable();
         
            $('#editvulninstace tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                } else {
                    table.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
            });
            var data = table.row('.selected').data()
            var input = data[4]
            //var values = "id=" +input
           
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/project/delete/instace/"+input+"/", true);
            xhr.onload = function () {
               var jsonResponse = JSON.parse(xhr.responseText);
               if (jsonResponse.status == "success") {
                table.row('.selected').remove().draw(false);
                swal("Done", "Row Deleted", "success");  
              }
            }
            xhr.send();
            
    
            
                
                
            
        });
    }

    


    function addrowfunction() {
        var url = document.getElementById('newurl').value
        var paramter = document.getElementById('NewParamter').value
        
        var deletebutton = '<button type="button" class="btn btn-danger btnDelete" id="deletebuttonid" onclick="deleterowfunction()" href="">Delete</button>'
        var xhr = new XMLHttpRequest();
        var full_url = document.URL;
        var id = url_array = full_url.split('/')[5]
        //var id = {{ id }}
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/project/report/addurl/"+id+"/");
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        
        xmlhttp.onload  = function(){
            if (xmlhttp.status == 200) {
                var jsonResponse = JSON.parse(xmlhttp.responseText);
                var instanceid = jsonResponse.insntaceid
            var t = $('#editvulninstace').DataTable()
            t.row.add(['', url, paramter, deletebutton, instanceid]).draw(false);
            $('#addnew').modal('hide')
            }
            
        }
        xmlhttp.send(JSON.stringify([{"URL":url,"Paramter":paramter}]));


     
      }


      window.onload = function () { 
       
        var output = document.getElementById('cvssvectionid').value
        outputaray = output.split("/");
        var av = outputaray[1].split(":")[1]
        var ac = outputaray[2].split(":")[1]
        var pr = outputaray[3].split(":")[1]
        var ui = outputaray[4].split(":")[1]
        var s = outputaray[5].split(":")[1]
        var c = outputaray[6].split(":")[1]
        var i = outputaray[7].split(":")[1]
        var a = outputaray[8].split(":")[1]


        
        $("input[name=AV][value=" + av + "]").attr('checked', 'checked');
        $("input[name=AC][value=" + ac + "]").attr('checked', 'checked');
        $("input[name=PR][value=" + pr + "]").attr('checked', 'checked');
        $("input[name=UI][value=" + ui + "]").attr('checked', 'checked');
        $("input[name=S][value=" + s + "]").attr('checked', 'checked');
        $("input[name=C][value=" + c + "]").attr('checked', 'checked');
        $("input[name=I][value=" + i + "]").attr('checked', 'checked');
        $("input[name=A][value=" + a + "]").attr('checked', 'checked');
        updateScores()


    }



    function cvssclaconload() { 
       
      var output = document.getElementById('cvssvectionid').value
      outputaray = output.split("/");
      var av = outputaray[1].split(":")[1]
      var ac = outputaray[2].split(":")[1]
      var pr = outputaray[3].split(":")[1]
      var ui = outputaray[4].split(":")[1]
      var s = outputaray[5].split(":")[1]
      var c = outputaray[6].split(":")[1]
      var i = outputaray[7].split(":")[1]
      var a = outputaray[8].split(":")[1]


      
      $("input[name=AV][value=" + av + "]").attr('checked', 'checked');
      $("input[name=AC][value=" + ac + "]").attr('checked', 'checked');
      $("input[name=PR][value=" + pr + "]").attr('checked', 'checked');
      $("input[name=UI][value=" + ui + "]").attr('checked', 'checked');
      $("input[name=S][value=" + s + "]").attr('checked', 'checked');
      $("input[name=C][value=" + c + "]").attr('checked', 'checked');
      $("input[name=I][value=" + i + "]").attr('checked', 'checked');
      $("input[name=A][value=" + a + "]").attr('checked', 'checked');
      updateScores()


  }
  window.onload = cvssclaconload

    $(document).ready(function () {
        var t = $('#addinstancetable').DataTable({
            
            
            
            dom: '<"toolbar">frtip',
            "paging": true,
          "lengthChange": false,
          "searching": true,
          "ordering": true,
          "info": true,
          "autoWidth": true,
          "responsive": true,
          "bDestroy": true,
          paging: true,
          searching: true,
          order: [[1, 'asc']]
        });
        
        t.on('order.dt search.dt', function () {
            let i = 1;
     
            t.cells(null, 0, { search: 'applied', order: 'applied' }).every(function (cell) {
                this.data(i++);
            });
        }).draw();
      
    });



    function addinstacerowfunction() {
      var url = document.getElementById('newurl').value
      var paramter = document.getElementById('NewParamter').value
      
      var deletebutton = '<button type="button" class="btn btn-danger btnDelete" id="deletebuttonid" onclick="deleteinstacerowfunction()" href="">Delete</button>'
      var t = $('#addinstancetable').DataTable()
      t.row.add(['', url, paramter, deletebutton]).draw(false);
      $('#addnew').modal('hide')
    
    
    }


      function deleteinstacerowfunction() {
        $(document).ready(function () {
            var table = $('#addinstancetable').DataTable();
         
            $('#addinstancetable tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                } else {
                    table.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
            });
         
            
                table.row('.selected').remove().draw(false);
            
        });
    }




    $(document).ready(function () {
        var t = $('#editvulninstace').DataTable({
            columnDefs: [
            {
                target: 4,
                visible: false,
                searchable: false,
            }],
            
            
            
            dom: '<"toolbar">frtip',
            "paging": true,
          "lengthChange": false,
          "searching": true,
          "ordering": true,
          "info": true,
          "autoWidth": true,
          "responsive": true,
          "bDestroy": true,
          paging: true,
          searching: true,
          order: [[1, 'asc']]
          
        });
        
        t.on('order.dt search.dt', function () {
            let i = 1;
     
            t.cells(null, 0, { search: 'applied', order: 'applied' }).every(function (cell) {
                this.data(i++);
            });
        }).draw();
      
    });



    function editprofileform(oFormElement)
    {
      var xhr = new XMLHttpRequest();
      xhr.onload = function(){ 
        
        //alert(xhr.responseText); 
        var jsonResponse = JSON.parse(xhr.responseText);
        var instanceid = jsonResponse.insntaceid
        if (jsonResponse.Userexist == "True") {
            swal("Fail", "UserName Taken", "error");
          }
        else if (jsonResponse.Emailexist == "True") {
            swal("Fail", "Email Taken", "error");
        }
        else if (jsonResponse.number == "True") {
            swal("Fail", "Phone Number already Taken", "error");
        }
        else if (jsonResponse.Status == "Success") {
            swal("Success", "", "success");
        }
        else if (jsonResponse.Status == "Fail") {
          swal("Fail", "Server Error", "error");
      }
  
    
    }
      xhr.open(oFormElement.method, oFormElement.getAttribute("action"));
      xhr.send(new FormData(oFormElement));
      return false;
    }
  


    function addprofileform(oFormElement)
    {
      var xhr = new XMLHttpRequest();
      xhr.onload = function(){ 
        
        //alert(xhr.responseText); 
        var jsonResponse = JSON.parse(xhr.responseText);
        var instanceid = jsonResponse.insntaceid
        if (jsonResponse.Userexist == "True") {
            swal("Fail", "UserName Taken", "error");
          }
        else if (jsonResponse.Emailexist == "True") {
            swal("Fail", "Email Taken", "error");
        }
        else if (jsonResponse.number == "True") {
            swal("Fail", "Phone Number already Taken", "error");
        }
        else if (jsonResponse.Status == "Success") {
            swal("Success", "", "success");
            window.location = "/accounts/setting"
        }
        else if (jsonResponse.Status == "Fail") {
          swal("Fail", "Server Error", "error");
      }
  
    
    }
      xhr.open(oFormElement.method, oFormElement.getAttribute("action"));
      xhr.send(new FormData(oFormElement));
      return false;
    }
  
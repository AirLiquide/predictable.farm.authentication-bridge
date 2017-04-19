/**
 * Created by admin on 28/03/2017.
 */

function login() {
    var id = document.getElementById('input-id').value;
    var pass = document.getElementById('input-pswd').value;
    if (id == '' || pass == ''){
        console.log("empty");
    }
    else{
        var data ={
            id : id,
            pass : pass
        };
        var callback = function(res){
            var res  = JSON.parse(res);
            console.log(res);
            if (res.success){
                console.log("hey");
                window.location.reload();
            }
        };

        makePostRequest('/login', data, callback);
    }
}


function makePostRequest(url, data,callback) {
    var httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        alert('Giving up :( Cannot create an XMLHTTP instance');
        return false;
    }
    httpRequest.open('POST', url,true);
    httpRequest.setRequestHeader("Content-type", "application/json");
    httpRequest.onreadystatechange = function()
    {
        if (httpRequest.readyState == 4 && httpRequest.status == 200)
        {
            if (callback){
                callback(httpRequest.responseText); // Another callback here
            }
        }
    };
    httpRequest.send(JSON.stringify(data));
}
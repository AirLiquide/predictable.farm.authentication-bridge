/*
  Copyright (C) Air Liquide S.A,  2017
  Author: Sébastien Lalaurette and Cyril Ferté, La Factory, Creative Foundry
  This file is part of Predictable Farm project.

  The MIT License (MIT)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
   
  See the LICENSE.txt file in this repository for more information.
*/

function login() {
    var id = document.getElementById('input-id').value;
    var pass = document.getElementById('input-pswd').value;
    if (id == '' || pass == '') {
        console.log("empty");
    } else {
        var data = {
            id : id,
            pass : pass
        };
        var callback = function(res) {
            var res  = JSON.parse(res);
            console.log(res);
            if (res.success) {
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
    httpRequest.open('POST', url, true);
    httpRequest.setRequestHeader("Content-type", "application/json");
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            if (callback) {
                callback(httpRequest.responseText); // Another callback here
            }
        }
    };
    httpRequest.send(JSON.stringify(data));
}
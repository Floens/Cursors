/* Copyright 2015 Floens

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */
(function(global) {
'use strict';

var ws = require('ws');
var WebSocketServer = ws.Server

global.Server = function(port) {
    this.server = new WebSocketServer({port: port});

    this.lastProcessTime = 0;
    this.processTimeout = false;

    this.clients = [];
    this.idCounter = 1;

    var self = this;
    this.server.on('connection', function(connection) {
        if (self.clients.length >= Config.MAX_CONNECTIONS) {
            log('Kick: connection limit of ' + Config.MAX_CONNECTIONS + ' was reached');
            connection.terminate();
        } else {
            log('Connected');
            var client = new RemoteClient(self, connection, self.idCounter++);
            self.clients.push(client);
            client.init();

            connection.on('close', function() {
                log('Closed');
                self.clients.remove(client);
                client.destroy();
            });
        }
    });

    this.process();

    /*var self = this;
    for (var i = 0; i < 1; i++) {
        (function() {
            var k = i;
            var client = new RemoteClient(self, null, self.idCounter++);
            self.clients.push(client);
            client.init();

            var j = 0;
            var v = 0;
            var m = 0;
            setInterval(function() {
                v += 0.08 * Math.random() - 0.04;
                v *= 0.98;
                j += v;
                m += 0.002;

                var pos = new PositionPacket(0,
                    Math.floor(300 + Math.sin(m) * 200 + k * 200 + 100 + Math.cos(j) * 100),
                    100 + Math.floor(Math.sin(j) * 100));
                client.handleMessages([pos]);

            }, SEND_TIMEOUT);
        })();
    }*/
}

Server.prototype.getClients = function() {
    return this.clients;
}

Server.prototype.process = function() {
    if (getNow() - this.lastProcessTime > Config.PROCESS_TIMEOUT) {
        this.doProcess();
    } else {
        if (!this.processTimeout) {
            this.processTimeout = true;
            var self = this;
            setTimeout(function() {
                self.doProcess();
                self.processTimeout = false;
            }, Config.PROCESS_TIMEOUT - (getNow() - this.lastProcessTime));
        }
    }
}

Server.prototype.doProcess = function() {
    this.lastProcessTime = getNow();

    for (var i = 0; i < this.clients.length; i++) {
        this.clients[i].process();
    }

    for (var i = 0; i < this.clients.length; i++) {
        this.clients[i].postProcess();
    }
}

})(global);

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

var msgpack = require('msgpack-js');
var ws = require('ws');

global.RemoteClient = function(server, socket, id) {
    this.server = server;
    this.socket = socket;

    this.messageQueue = [];

    this.id = id;
    this.others = [];

    this.posDirty = false;
    this.lastReceiveTime = 0;
    this.x = 0;
    this.y = 0;

    this.stateDirty = false;
    this.down = false;

    this.nameDirty = true;
    this.name = this.generateName();

    this.colorDirty = true;
    this.color = this.generateColor();

    var self = this;
    if (this.socket != null) {
        this.socket.on('message', function(message) {
            try {
                self.handleMessages(Protocol.decode(msgpack.decode(message)));
            } catch (err) {
                log('Decode error: ' + err);
            }
        });
    }
}

RemoteClient.prototype.init = function() {
    this.server.process();
}

RemoteClient.prototype.destroy = function() {
    this.server.process();
}

RemoteClient.prototype.sendMessage = function(message) {
    this.messageQueue.push(message);
}

RemoteClient.prototype.flush = function() {
    if (this.messageQueue.length > 0 && this.socket != null) {
        if (this.socket.readyState == ws.OPEN) {
            this.socket.send(msgpack.encode(Protocol.encode(this.messageQueue)));
            this.messageQueue = [];
        } else {
            log('Error sending message: socket closed');
        }
    }
}

RemoteClient.prototype.handleMessages = function(messages) {
    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];

        if (message instanceof PositionPacket) {
            // todo filter
            this.x = message.x;
            this.y = message.y;
            this.posDirty = true;
            this.server.process();
        } else if (message instanceof MouseStatePacket) {
            this.down = message.down;
            this.stateDirty = true;
            this.server.process();
        } else if (message instanceof NamePacket) {
            var receivedName = message.name.substr(0, Config.MAX_NAME_LENGTH).trim();
            if (receivedName.length > 0) {
                var name = receivedName;
                var tries = 0;
                while (this.isNameUsed(name) && tries++ < 50) {
                    name = receivedName + '_';
                }

                this.name = name;
                this.nameDirty = true;
                this.server.process();
            }
        }
    }
}

RemoteClient.prototype.postProcess = function() {
    this.posDirty = false;
    this.stateDirty = false;
    this.nameDirty = false;
    this.colorDirty = false;
    this.flush();
}

RemoteClient.prototype.process = function() {
    var newlyCreated = [];

    var connections = this.server.getClients();

    // Creates on remote
    for (var i = 0; i < connections.length; i++) {
        var other = connections[i];
        if (other === this) continue;

        if (this.others.indexOf(other) < 0) {
            this.sendMessage(new CreatePacket(other.id));

            newlyCreated.push(other);

            this.others.push(other);
        }
    }

    // Deletes on remote
    for (var i = 0; i < this.others.length; i++) {
        var other = this.others[i];

        if (connections.indexOf(other) < 0) {
            this.sendMessage(new DestroyPacket(other.id));

            this.others.remove(other);
        }
    }

    // State updates
    for (var i = 0; i < this.others.length; i++) {
        var other = this.others[i];
        var newly = newlyCreated.indexOf(other) >= 0;

        if (newly || other.posDirty) {
            this.sendMessage(new PositionPacket(other.id, other.x, other.y));
        }

        if (newly || other.stateDirty) {
            this.sendMessage(new MouseStatePacket(other.id, other.down));
        }

        if (newly || other.nameDirty) {
            this.sendMessage(new NamePacket(other.id, other.name));
        }

        if (newly || other.colorDirty) {
            this.sendMessage(new ColorPacket(other.id, other.color));
        }
    }

    // Self state updates
    if (this.nameDirty) {
        this.sendMessage(new NamePacket(0, this.name));
    }

    if (this.colorDirty) {
        this.sendMessage(new ColorPacket(0, this.color));
    }
}

RemoteClient.prototype.isNameUsed = function(name) {
    for (var i = 0; i < this.others.length; i++) {
        if (this.others[i].name === name) {
            return true;
        }
    }

    return false;
}

RemoteClient.prototype.generateName = function() {
    var generatedName = Config.DEFAULT_NAME;
    var index = 0;
    var tries = 0;
    var name = generatedName + randomInt(1000);
    while (this.isNameUsed(name) && tries++ < 50) {
        name = generatedName + ++index;
    }

    return name;
}

RemoteClient.prototype.generateColor = function() {
    return randomInt(0xffffff);
}

})(global);

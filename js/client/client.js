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

global.Client = function(manager, url) {
    this.manager = manager;

    this.target = document.querySelector(Config.TARGET_ELEMENT);

    this.canvasManager = new CanvasManager(this);
    this.controls = new Controls(this);

    this.localCursor = new Cursor(-1, this, false);
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseTime = 0;
    this.mouseTimeout = false;
    this.mouseDown = false;
    this.drawTouch = -1;

    this.name = '';

    this.messageQueue = [];
    this.socket = null;

    this.others = [];

    this.mouseMoveFunc = null;
    this.mouseDownFunc = null;
    this.mouseUpFunc = null;
    this.resizeFunc = null;
    this.touchStartFunc = null;
    this.touchEndFunc = null;
    this.touchCancelFunc = null;
    this.touchMoveFunc = null;

    this.setupEvents();
    this.connect(url);
}

Client.prototype.destroy = function() {
    document.removeEventListener('mousemove', this.mouseMoveFunc, false);
    document.removeEventListener('mousedown', this.mouseDownFunc, false);
    document.removeEventListener('mouseup', this.mouseUpFunc, false);
    window.removeEventListener('resize', this.resizeFunc, false);
    document.removeEventListener('touchstart', this.touchStartFunc, false);
    document.removeEventListener('touchend', this.touchEndFunc, false);
    document.removeEventListener('touchcancel', this.touchCancelFunc, false);
    document.removeEventListener('touchmove', this.touchMoveFunc, false);

    for (var i = 0; i < this.others.length; i++) {
        this.others[i].destroy();
    }

    this.localCursor.destroy();
    this.canvasManager.destroy();
    this.controls.destroy();

    this.manager.onClose();
}

Client.prototype.onOpen = function() {
    this.controls.init();
    this.manager.onOpen();
}

Client.prototype.setupEvents = function() {
    var self = this;
    this.mouseMoveFunc = function(event) {
        var offset = getElementOffset(self.target);
        self.onMouseMove(event.pageX - offset[0], event.pageY - offset[1]);
    }
    document.addEventListener('mousemove', this.mouseMoveFunc, false);

    this.mouseDownFunc = function(event) {
        self.onMouseState(true);
    }
    document.addEventListener('mousedown', this.mouseDownFunc, false);

    this.mouseUpFunc = function(event) {
        self.onMouseState(false);
    }
    document.addEventListener('mouseup', this.mouseUpFunc, false);

    this.resizeFunc = function(event) {
        self.canvasManager.resize();
    }
    window.addEventListener('resize', this.resizeFunc, false);

    function handleTouch(list) {
        var justCreated = false;
        if (self.drawTouch >= 0) {
            var has = false;
            for (var i = 0; i < list.length; i++) {
                if (list[i].identifier == self.drawTouch) {
                    has = true;
                }
            }
            if (!has) {
                self.drawTouch = -1;
            }
        } else {
            for (var i = 0; i < list.length; i++) {
                self.drawTouch = list[i].identifier;
                justCreated = true;
                break;
            }
        }

        for (var i = 0; i < list.length; i++) {
            if (list[i].identifier == self.drawTouch) {
                var offset = getElementOffset(self.target);
                self.onMouseMove(list[i].pageX - offset[0], list[i].pageY - offset[1]);
                break;
            }
        }

        self.onMouseState(self.drawTouch >= 0);
    }

    this.touchStartFunc = function(event) {
        handleTouch(event.touches);
    }
    document.addEventListener('touchstart', this.touchStartFunc, false);

    this.touchEndFunc = function(event) {
        handleTouch(event.touches);
        // event.preventDefault();
    }
    document.addEventListener('touchend', this.touchEndFunc, false);

    this.touchCancelFunc = function(event) {
        handleTouch(event.touches);
        event.preventDefault();
    }
    document.addEventListener('touchcancel', this.touchCancelFunc, false);

    this.touchMoveFunc = function(event) {
        handleTouch(event.touches);
        event.preventDefault();
    }
    document.addEventListener('touchmove', this.touchMoveFunc, false);
}

Client.prototype.connect = function(url) {
    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer';
    var self = this;
    this.socket.onopen = function(event) {
        console.log('Connected');

        self.onOpen();
    }

    this.socket.onclose = function() {
        log('Closed');

        self.destroy();
    }

    this.socket.onmessage = function(event) {
        var message = event.data;
        try {
            self.handleMessages(Protocol.decode(msgpack.decode(message)));
        } catch (err) {
            log('Decode error: ' + err);
        }
    }
}

Client.prototype.sendMessage = function(message) {
    this.messageQueue.push(message);
}

Client.prototype.flush = function() {
    if (this.messageQueue.length > 0 && this.socket != null && this.socket.readyState == WebSocket.OPEN) {
        this.socket.send(msgpack.encode(Protocol.encode(this.messageQueue)));
        this.messageQueue = [];
    }
}

Client.prototype.handleMessages = function(messages) {
    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];

        if (message instanceof CreatePacket) {
            var cursor = new Cursor(message.id, this, true);
            this.others.push(cursor);
        } else if (message instanceof PositionPacket) {
            var cursor = this.getOther(message.id);
            if (cursor != null) {
                cursor.addPosition(message.x, message.y);
            }
        } else if (message instanceof DestroyPacket) {
            var cursor = this.getOther(message.id);
            if (cursor != null) {
                cursor.destroy();
                this.others.remove(cursor);
            }
        } else if (message instanceof MouseStatePacket) {
            var cursor = this.getOther(message.id);
            if (cursor != null) {
                cursor.down = message.down;
            }
        } else if (message instanceof NamePacket) {
            if (message.id > 0) {
                var cursor = this.getOther(message.id);
                if (cursor != null) {
                    cursor.setName(message.name);
                }
            } else {
                this.localCursor.setName(message.name);
                this.controls.setControlName(message.name);
            }
        } else if (message instanceof ColorPacket) {
            if (message.id > 0) {
                var cursor = this.getOther(message.id);
                if (cursor != null) {
                    cursor.setColor(message.color);
                }
            } else {
                this.localCursor.setColor(message.color);
            }
        }
    }
}

Client.prototype.getOther = function(id) {
    for (var i = 0; i < this.others.length; i++) {
        if (this.others[i].id == id) {
            return this.others[i];
        }
    }

    return null;
}

Client.prototype.onMouseState = function(down) {
    if (down != this.mouseDown) {
        this.mouseDown = down;

        this.sendMessage(new MouseStatePacket(0, down));
        this.flush();
        this.localCursor.down = down;
    }
}

Client.prototype.onMouseMove = function(x, y) {
    if (x == this.mouseX && y == this.mouseY) {
        return;
    }

    this.mouseX = x;
    this.mouseY = y;

    if (getNow() - this.lastMouseSendTime > Config.SEND_TIMEOUT) {
        this.sendPosition();
    } else {
        if (!this.mouseTimeout) {
            this.mouseTimeout = true;
            var self = this;
            setTimeout(function() {
                self.sendPosition();
                self.mouseTimeout = false;
            }, Config.SEND_TIMEOUT - (getNow() - this.lastMouseSendTime));
        }
    }
}

Client.prototype.sendPosition = function() {
    this.lastMouseSendTime = getNow();
    this.sendMessage(new PositionPacket(0, this.mouseX, this.mouseY));
    this.flush();
    this.localCursor.addPosition(this.mouseX, this.mouseY);
}

Client.prototype.setName = function(name) {
    if (name != this.name) {
        // this.name = name;
        this.sendMessage(new NamePacket(0, name));
        this.flush();
    }
}

})(window);

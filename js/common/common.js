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


global.vec2 = function(x, y) {
    this.x = x;
    this.y = y;
}

global.Map = function() {
    this.obj = {};
}

Map.prototype.get = function(key) {
    var res = this.obj[key];
    return res == undefined ? null : res;
}

Map.prototype.put = function(key, value) {
    this.obj[key] = value;
}

Map.prototype.contains = function(key) {
    return this.obj[key] != undefined;
}

Map.prototype.clear = function() {
    this.obj = {};
}

Map.prototype.keys = function() {
    return Object.keys(this.obj);
}


Array.prototype.remove = function(e) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === e) {
            this.splice(i, 1);
            return true;
        }
    }

    return false;
}

global.leftPad = function(value, length, pad) {
    while (value.length < length) {
        value = pad + value;
    }
    return value;
}

global.toRGB = function(value) {
    var r = leftPad(((value >> 16) & 0xff).toString(16), 2, '0'),
        g = leftPad(((value >> 8) & 0xff).toString(16), 2, '0'),
        b = leftPad(((value) & 0xff).toString(16), 2, '0');

    return '#' + r + g + b;
}

global.getElementOffset = function(element) {
    var bb = element.getBoundingClientRect();
    return [Math.floor(bb.left), Math.floor(bb.top)];
}

global.getNow = function() {
    if (global.process != undefined) {
        var time = process.hrtime();
        return time[0] * 1e3 + time[1] * 1e-6;
    } else {
        return performance.now();
    }
}

global.log = function(e) {
    console.log(e);
}

global.interpolate = function(a, b, x) {
    return a + ((b - a) * x);
}

global.clamp = function(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

global.randomInt = function(e) {
    return Math.floor(Math.random() * e);
}

global.CreatePacket = function(id) {
    this.id = id;
}

global.PositionPacket = function(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
}

global.DestroyPacket = function(id) {
    this.id = id;
}

global.MouseStatePacket = function(id, down) {
    this.id = id;
    this.down = down;
}

global.NamePacket = function(id, name) {
    this.id = id;
    this.name = name;
}

global.ColorPacket = function(id, color) {
    this.id = id;
    this.color = color;
}


global.isInt = function(n) {
   return typeof n === 'number' && n % 1 == 0;
}

global.isBoolean = function(e) {
    return typeof e === 'boolean';
}

global.isString = function(e) {
    return typeof e === 'string';
}

global.Protocol = {
    CREATE: 0,
    POSITION: 1,
    DESTROY: 2,
    MOUSE_STATE: 3,
    NAME: 4,
    COLOR: 5,
    decode: function(raw) {
        if (!Array.isArray(raw))
            throw new Error('Not an array');

        if (raw.length == 0)
            throw new Error('Length 0');

        var list = [];
        for (var i = 0; i < raw.length;) {
            if (!isInt(raw[i]) || raw[i] < 0)
                throw new Error('Id not an int');

            var id = raw[i];
            switch(id) {
            case Protocol.CREATE:
                if (!isInt(raw[i + 1]) || raw[i + 1] < 0) throw new Error('invalid');
                list.push(new CreatePacket(raw[i + 1]));
                i += 2;
            break;
            case Protocol.POSITION:
                if (!isInt(raw[i + 1]) || raw[i + 1] < 0) throw new Error('invalid');
                if (!isInt(raw[i + 2])) throw new Error('invalid');
                if (!isInt(raw[i + 3])) throw new Error('invalid');
                list.push(new PositionPacket(raw[i + 1], raw[i + 2], raw[i + 3]));
                i += 4;
            break;
            case Protocol.DESTROY:
                if (!isInt(raw[i + 1]) || raw[i + 1] < 0) throw new Error('invalid');
                list.push(new DestroyPacket(raw[i + 1]));
                i += 2;
            break;
            case Protocol.MOUSE_STATE:
                if (!isInt(raw[i + 1])) throw new Error('invalid');
                if (!isBoolean(raw[i + 2])) throw new Error('invalid');
                list.push(new MouseStatePacket(raw[i + 1], raw[i + 2]));
                i += 3;
            break;
            case Protocol.NAME:
                if (!isInt(raw[i + 1])) throw new Error('invalid');
                if (!isString(raw[i + 2])) throw new Error('invalid');
                list.push(new NamePacket(raw[i + 1], raw[i + 2]));
                i += 3;
            break;
            case Protocol.COLOR:
                if (!isInt(raw[i + 1])) throw new Error('invalid');
                if (!isInt(raw[i + 2])) throw new Error('invalid');
                list.push(new ColorPacket(raw[i + 1], raw[i + 2]));
                i += 3;
            break;
            default:
                throw new Error('Unknown packet');
            break;
            }
        }
        return list;
    }, encode: function(packets) {
        var list = [];
        for (var i = 0; i < packets.length; i++) {
            var packet = packets[i];
            if (packet instanceof CreatePacket) {
                list.push(Protocol.CREATE, packet.id);
            } else if (packet instanceof PositionPacket) {
                list.push(Protocol.POSITION, packet.id, packet.x, packet.y);
            } else if (packet instanceof DestroyPacket) {
                list.push(Protocol.DESTROY, packet.id);
            } else if (packet instanceof MouseStatePacket) {
                list.push(Protocol.MOUSE_STATE, packet.id, packet.down);
            } else if (packet instanceof NamePacket) {
                list.push(Protocol.NAME, packet.id, packet.name);
            } else if (packet instanceof ColorPacket) {
                list.push(Protocol.COLOR, packet.id, packet.color);
            } else {
                throw new Error('Unknown packet');
            }
        }
        return list;
    }
}

})(global);

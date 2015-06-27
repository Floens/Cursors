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

global.Cursor = function(id, client, show) {
    this.id = id;
    this.client = client;
    this.show = show;

    this.destroyed = false;

    this.lerp = 0;
    this.prevPos = [0, 0];
    this.nextPos = [0, 0];
    this.queue = [];
    this.lastTime = getNow();
    this.doLerp = false;
    this.animating = true;
    this.down = false;

    this.color = 0;

    if (this.show) {
        this.element = document.createElement('div');
        this.element.style.width = '17px';
        this.element.style.height = '23px';
        this.element.style.position = 'fixed';
        this.element.style.pointerEvents = 'none';
        this.element.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAXCAYAAADtNKTnAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAjnRFWHRDb21tZW50AGNIUk0gY2h1bmtsZW4gMzIgaWdub3JlZA1BU0NJSTogLi56JS4uLi4uLi4lLi4uLi4ubV8uLi5sLi48Li4uLlgNSEVYOiAwMDAwN0EyNTAwMDA4MDgzMDAwMEY0MjUwMDAwODREMTAwMDA2RDVGMDAwMEU4NkMwMDAwM0M4QjAwMDAxQjU4GN773QAAAgFJREFUeJyUlEtLAlEUx0cd7YFagUkvxKIgiB4USEREUNAqWgvtatEnaNVnaVWrNrVoEURFT6JCxBDDIpKScGG5EATR2/9MZ6ZrjjJe+MHMmXt+c+65c0cRQihEuVy2lUolO0HXetwKil31valN3SFFUVygFTQDJ7CBhiSHYA45ncAHvI2INMlH+lNAcgRWkDMI+kCbVZEmwYVg0SlYRc7of5EliSS6AGtIHLMqqpBIoiuwblVUJZFE12Yis+03leBbEanUu2VRlYQExWJRFAoF8fzyWlMkL61CIgvy+bzI5XIiHk/UFdH2GxIzQTabFZlMRkQiUTPR3wdJknqCdDqN/qTE7e2dwNwrJM2AEdDFx8SuSWTB01PSEODZjcQ1uGQJVRMAHuDQJLLA1ezL7ezuaRVw4pbb27OEyfNgGkyAIdAN3IZEEnyDDcQepSXEMHEBzIJxEOSD6uGT/7scFnyBMIJziJ3s7x+KZDJJkmOwyRJaRi8LnJqAd+cIyVmwiNthMIVYGEQTiYQ4OzsnUZTk9KyiF3y69aHy3tPWDThcPX1IPCBBLBYjyT1XEuJ+dHBOxaCymvgN7WikG4kB8AC2wTLik9zUfn5hlUQXqQyValNdfjugb8HPDQ3ydavRD31N8rpMBklb+O1eFlDM+OOZ/2RqV+mQK9Dn/wAAAP//AwCGMlcrSCX+UAAAAABJRU5ErkJggg==)';

        this.tag = document.createElement('div');
        this.tag.style.position = 'relative';
        this.tag.style.overflow = 'hidden';
        this.tag.style.width = '200px';
        this.tag.style.height = '10px';
        this.tag.style.top = '4px';
        this.tag.style.left = '19px';
        this.tag.style.fontFamily = 'Helvetica, Arial';
        this.tag.style.fontSize = '9px';
        // this.tag.style.background = 'red';

        this.element.appendChild(this.tag);

        document.body.appendChild(this.element);
    }

    this.animate();
}

Cursor.prototype.destroy = function() {
    this.destroyed = true;

    if (this.show) {
        document.body.removeChild(this.element);
    }
}

Cursor.prototype.setName = function(name) {
    if (this.show) {
        this.tag.innerHTML = '';
        this.tag.appendChild(document.createTextNode(name));
    }
}

Cursor.prototype.setColor = function(color) {
    if (this.show) {
        this.tag.style.color = toRGB(color);
    }

    this.color = color;
}

Cursor.prototype.draw = function(x1, y1, x2, y2) {
    if (this.down) {
        var ox = this.client.target.offsetLeft, oy = this.client.target.offsetTop;
        var sx = x1 + ox;
        var sy = y1 + oy;
        var ex = x2 + ox;
        var ey = y2 + oy;

        var dx = ex - sx;
        var dy = ey - sy;
        var d = Math.sqrt(dx * dx + dy * dy);
        // log(d);

        var alpha = clamp(0.8 - d * 0.005, 0, 1);
        var color = 'rgba(0, 0, 0, ' + alpha + ')';
        var width = 0.5;

        this.client.canvasManager.drawLine(sx, sy, ex, ey, color, width);
    }
}

Cursor.prototype.addPosition = function(x, y) {
    this.queue.push([x, y]);
    if (!this.doLerp) {
        this.doLerp = true;
        this.prevPos = [x, y];
        this.nextPos = [x, y];
    }

    if (!this.animating) {
        this.animate();
    }
}

Cursor.prototype.setPosition = function(x, y) {
    if (this.show) {
        var offset = getElementOffset(this.client.target);

        this.element.style.left = Math.floor(x + offset[0]) + 'px';
        this.element.style.top = Math.floor(y + offset[1]) + 'px';
    }
}

Cursor.prototype.animate = function() {
    if (this.destroyed)
        return;

    this.animating = true;

    if (this.lerp < 1) {
        this.lerp += (getNow() - this.lastTime) / (Config.PROCESS_TIMEOUT);
    }
    this.lastTime = getNow();

    // Animating this pos done, get the next one
    if (this.lerp >= 1) {
        var droppedPos = null;
        while (this.queue.length >= Config.DROP_COUNT) {
            // log('Dropped position because the client is not fast enough animating them.');

            var droppedPosNext = this.queue.shift();
            if (droppedPos == null) {
                this.draw(this.nextPos[0], this.nextPos[1], droppedPosNext[0], droppedPosNext[1]);
            } else {
                this.draw(droppedPos[0], droppedPos[1], droppedPosNext[0], droppedPosNext[1]);
            }

            droppedPos = droppedPosNext;
        }

        var followingPos = droppedPos == null ? this.nextPos : droppedPos;
        var pos = this.queue.shift();
        if (pos) {
            this.prevPos[0] = followingPos[0];
            this.prevPos[1] = followingPos[1];
            this.nextPos[0] = pos[0];
            this.nextPos[1] = pos[1];
            if (this.lerp > 1.5) {
                this.lerp = 0;
            } else {
                this.lerp -= 1;
            }
        } else {
            this.animating = false;
            return;
        }

        this.draw(this.prevPos[0], this.prevPos[1], this.nextPos[0], this.nextPos[1]);
    }

    var lerpClamped = clamp(this.lerp, 0, 1);
    this.setPosition(
        interpolate(this.prevPos[0], this.nextPos[0], lerpClamped),
        interpolate(this.prevPos[1], this.nextPos[1], lerpClamped)
    );

    var self = this;
    requestAnimationFrame(function() {
        self.animate();
    });
}

})(global);

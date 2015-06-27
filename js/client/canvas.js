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

global.Canvas = function(width, height) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
    this.canvas.style.zIndex = -1;
    this.c = this.canvas.getContext('2d');

    document.body.appendChild(this.canvas);
}

Canvas.prototype.destroy = function() {
    document.body.removeChild(this.canvas);
}

Canvas.prototype.setPosition = function(x, y) {
    this.canvas.style.left = (x) + 'px';
    this.canvas.style.top = (y) + 'px';
}

Canvas.prototype.setSize = function(width, height) {
    var tempCanvas = document.createElement('canvas')
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    var tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(this.canvas, 0, 0);

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.c.drawImage(tempCanvas, 0, 0);
}

Canvas.prototype.fillLine = function(sx, sy, dx, dy, color, width, secondColor) {
    var c = this.c;
    if (secondColor != undefined) {
        var gradient = c.createLinearGradient(sx, sy, dx, dy);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, secondColor);
        c.strokeStyle = gradient;
    } else {
        c.strokeStyle = color;
    }

    c.lineWidth = width == undefined ? 1 : width;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(dx, dy);
    c.stroke();
}

})(global);

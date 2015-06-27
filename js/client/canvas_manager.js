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

global.CanvasManager = function(client) {
    this.client = client;
    this.canvas = new Canvas(document.documentElement.clientWidth, document.documentElement.clientHeight);
}

CanvasManager.prototype.destroy = function() {
    this.canvas.destroy();
}

CanvasManager.prototype.resize = function() {
    this.canvas.setSize(document.documentElement.clientWidth, document.documentElement.clientHeight);
}

CanvasManager.prototype.drawLine = function(x1, y1, x2, y2, color, width) {
    this.canvas.fillLine(x1, y1, x2, y2, color, width);
}

})(global);

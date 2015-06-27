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

global.ClientManager = function(url) {
    this.url = url;
    this.reconnectCount = 0;
}

ClientManager.prototype.onOpen = function() {
}

ClientManager.prototype.onClose = function() {
    if (++this.reconnectCount > Config.RECONNECT_COUNT) {
        return;
    }

    var self = this;
    setTimeout(function() {
        self.connect();
    }, Config.RECONNECT_TIMEOUT);
}

ClientManager.prototype.connect = function() {
    new Client(this, this.url);
}

})(global);

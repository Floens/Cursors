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

global.Controls = function(client) {
    this.client = client;
    this.element = document.querySelector(Config.CONTROL_ELEMENT);

    this.inited = false;
    this.name = null;
    this.nameTimeout = -1;
}

Controls.prototype.init = function() {
    this.inited = true;

    var self = this;

    this.lastName = '';
    this.name = this.element.querySelector('#name');
    this.name.oninput = function() {
        if (self.name.value.length == 0) {
            // self.name.value = self.lastName;
            return;
        }
        self.lastName = self.name.value;

        if (self.nameTimeout >= 0) {
            clearTimeout(self.nameTimeout);
        }
        self.nameTimeout = setTimeout(function() {
            self.nameTimeout = -1;
            self.setName(self.name.value);
        }, 250);
    }


    var localName = localStorage.getItem('cursorsName');
    if (localName != null) {
        this.lastName = localName;
    }

    this.setName(this.lastName);

    this.show();
}

Controls.prototype.destroy = function() {
    if (this.inited) {
        this.name.value = '';
        this.name.oninput = null;
    }
    this.hide();
}

Controls.prototype.show = function() {
    this.element.style.opacity = 1;
}

Controls.prototype.hide = function() {
    this.element.style.opacity = 0;
}

Controls.prototype.setName = function(name) {
    this.setControlName(name);
    this.client.setName(name);
}

Controls.prototype.setControlName = function(name) {
    if (name != this.name.value) {
        this.name.value = name;
    }

    localStorage.setItem('cursorsName', name);
}

})(global);

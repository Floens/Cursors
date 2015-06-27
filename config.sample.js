(function(global) {
'use strict';

global.Config = {};

// Url for clients to connect to
Config.SERVER_URL = 'ws://url:9000';

// Time to wait before connecting again after an onClose
Config.RECONNECT_TIMEOUT = 5000;
Config.RECONNECT_COUNT = 10;

// Time between position sends
Config.SEND_TIMEOUT = 1000 / 60;

// Element to base the offset off
Config.TARGET_ELEMENT = '#foo';
Config.CONTROL_ELEMENT = '#controls';

// If the queue of positions is larger than or equal to DROP_COUNT, drop the remaining positions
Config.DROP_COUNT = 2;

Config.DEFAULT_NAME = 'User';
Config.MIN_NAME_LENGTH = 1;
Config.MAX_NAME_LENGTH = 12;

Config.MAX_CONNECTIONS = 64;

// Port for servers to listen to
Config.SERVER_PORT = 9000;

// Time between server processes
Config.PROCESS_TIMEOUT = 1000 / 120;

})(global);

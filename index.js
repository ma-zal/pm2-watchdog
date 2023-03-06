'use strict';


// Dependencies
const pmx = require('pmx');
const pm2 = require('pm2');
const ProcessWatchdog = require('./class-process-watchdog');


// Get PM2 module options
const moduleConfig = pmx.initModule((err, conf) => {
    if (err) {
        console.error('PMX initialization failed. ', err.message || err);
        return;
    }
});


// log/debug/error messages
console.debug = function(msg) { console.log(msg); };
console.trace = function(msg) { console.log(msg); };
require('console-stamp')(console, {
    pattern: `UTC:yyyy-mm-dd'T'HH:MM:ss'Z'`,
    extend: {
        debug: 5,
        trace: 6,
    },
    include: ['trace', 'debug', 'info', 'warm', 'error'],
    level: moduleConfig.debug,
});


console.trace('Module is starting.');


// Connect to local PM2
pm2.connect((err) => {
    if (err) {
        console.error('PM2 connect failed. ', err.message || err);
        return;
    }

    console.trace('Module connected to PM2.');

    // start the watchdog
    addWatchdogOfExistingProcesses();
});


/**
 * Creates and starts watchdogs for all existing PM2 processes.
 */
function addWatchdogOfExistingProcesses() {
    console.trace('Getting list of processes.');

    // Gets list of process managed by pm2
    pm2.list(
        /**
         *
         * @param {Error|null} err
         * @param {ProcessDescription[]} apps
         */
        function(err, apps) {

            if (err) {
                console.error(`PM2 get process list failed. ${err.message || err}`);
                pm2.disconnect();
                return;
            }

            apps.forEach((/*ProcessDescription*/ processDescription) => {
                if (processDescription.pm2_env.axm_options.isModule) {
                    console.trace(`Process ${processDescription.name} - is PM2 module. Ignoring it`);
                    return;
                    // TODO not neccesary
                } // Ignore PM2 modules

                if (processDescription.pm2_env.status === 'online') {
                    startOrRestartWatchdog(processDescription);
                } else {
                    console.trace(`Process ${processDescription.name} - is not online, no watdog yet`);
                }
            });
        });
}


// ----- APP INITIALIZATION -----

// Start listening on the PM2 BUS
pm2.launchBus(function(err, bus) {


    // Listen for PM2 events
    bus.on('process:event',
        /**
         *
         * @param {Object} data
         * @param {string} data.event - 'start'|'stop'|'restart'|'restart overlimit'|'delete'|'exit'|'online'.
         *                              See {@link https://github.com/rrrene/PM2/blob/master/doc/EVENTS.md}
         * @param {Pm2Env} data.process
         */
        function(data) {
            if (data.process.axm_options.isModule) { return; } // Ignore PM2 modules
            console.debug(`Process ${data.process.name} - event ${data.event}`);
            switch (data.event) {
                case 'start':
                case 'online':
                    // Start/update watchdog
                    if (data.process.status === 'online') {
                        startOrRestartWatchdog(data.process);
                    } else {
                        console.debug(`WARNING: Unexpexpected status of process when starting: ${data.process.status}`);
                    }
                    break;
                case 'stop':
                case 'exit':
                    // Kill the existing watchdog
                    removeWatchdog(data.process);
                    break;
                // case 'restart overlimit':
                // case 'delete':
                // case 'restart':
            }
        }

    );
});


/**
 * Key is `pm_id` of each PM2 process
 * @type {Map<number,ProcessWatchdog>}
 */
const watchdogs = new Map();


/**
 * @param {Pm2Env} pm2Env
 */
function startOrRestartWatchdog(pm2Env) {
    const watchedUrl = moduleConfig[`url-${pm2Env.name}`];

    if (!watchedUrl) {
        console.trace(`Process ${pm2Env.name} - no watchdog configuration`);
        return;
    }

    removeWatchdog(pm2Env);

    let watchdog = watchdogs.get(pm2Env.pm_id);

    // Create the new watchdog of new process
    watchdog = new ProcessWatchdog(pm2Env, {
        watchedUrl: watchedUrl,
        watchedUrlAuth: moduleConfig[`urlauth-${pm2Env.name}`],
        checkingInterval: parseInt(moduleConfig.checking_interval, 10) || 10,
        failsToRestart: moduleConfig.fails_to_restart,
        checkingTimeout: parseInt(moduleConfig.checking_timeout) || 5000
    });
    // Store new watchdog to watchdogs list
    watchdogs.set(pm2Env.pm_id, watchdog);
    // Start watchdog
    watchdog.start();
}


/**
 * @param {Pm2Env} pm2Env
 */
function removeWatchdog(pm2Env) {
    const watchdog = watchdogs.get(pm2Env.pm_id);
    if (watchdog) {
        watchdogs.delete(pm2Env.pm_id);
        watchdog.stop();
    } else {
        console.trace(`Process ${pm2Env.name} - no watchdog exists for removal`);
    }
}

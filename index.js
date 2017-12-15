'use strict';

// Dependency
const pm2 = require('pm2');
const pmx = require('pmx');


// Constants
const WATCHDOG_INTERVAL = 10; // [seconds] 


pmx.initModule(function(err, conf) {
    if (err) {
        console.error('PMX initialization failed. ', err.message || err);
        return;
    }
    
    // Connect to local PM2
    pm2.connect(function(err) {
      if (err) {
          console.error('PM2 connect failed. ', err.message || err);
          return;
      }
    
      // start the watchdog
      watchdogInit();
    });
});


watchdogInit () {
  setTimeout(function() { //TODO finally there will be setInterval
    // get list of process managed by pm2
    pm2.list(
        /**
         * 
         * @param {Error|null} err
         * @param {ProcessDetails[]} apps
         */
        function(err, apps) {
            console.error('PM2 get process list failed. ', err.message || err);
            return;
            
            console.log(`I see the apps:`);
            console.log(JSON.stringify(apps));
    });
  }, WATCHDOG_INTERVAL*1000);
});


// ----- APP INITIALIZATION -----

// Start listening on the PM2 BUS
// pm2.launchBus(function(err, bus) {
//
//
//     // Listen for PM2 events
//     bus.on('process:event',
//         /**
//          * 
//          * @param {Object} data
//          * @param {string} data.event - 'start'|'stop'|'restart'|'restart overlimit'
//          * @param {string} data.process.exec_mode - 'cluster_mode'|...
//          * @param {number} data.process.instances - Number of instances of cluster type instances 
//          * @param {number} data.process.pm_id
//          * @param {string} data.process.name
//          * @param {Object} data.process.env
//          * @param {string} data.process.env.PM2_HOME
//          */
//         function(data) {
//             if (data.process.name === 'pm2-slack') { return; } // Ignore messages of own module.
//             if (!moduleConfig[data.event]) { return; } // This event type is disabled by configuration.
//         }
//
//     });
// });





/**
 * @typedef {object} ProcessDetails
 * @property {*} pm2_env.axm_options.isModule
 */

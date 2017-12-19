'use strict';


// Dependencies
const rp = require('request-promise');
const pm2 = require('pm2');


/**
 * Checks the webserver of specified PM2 process and restart it when no response or error.
 */
class ProcessWatchdog {

    /**
     * @param {Pm2Env} pm2Env
     * @param {WatchdogOptions} options
     */
    constructor(pm2Env, options) {
        /** @type {string} */
        this.pm_id = pm2Env.pm_id;

        /** @type {string} */
        this.name = pm2Env.name;

        /** @type {boolean} */
        this.isRunning = false;

        /** @type {WatchdogOptions} */
        this.options = options;

        /** @type {function} */
        this.timeoutId = null;

        /** @type {number} */
        this.failsCountInRow = 0;
    }


    /**
     * Run/Restart the webserver checking.
     */
    start() {

        if (this.isRunning) {
            console.trace(`Process ${this.name} - cannot start watchdog, because it is already running`);
            return;
        }

        console.info(`Process ${this.name} - starting watching ${this.options.watchedUrl}`);

        this.isRunning = true;
        this.failsCountInRow = 0;

        this.healthCheckingLoop();
    }


    /**
     * Stop the webserver checking.
     */
    stop() {
        if (!this.isRunning) {
            console.trace(`Process ${this.name} - Cannot stop watchdog, because it is not running`);
            return;
        }

        console.info(`Process ${this.name} - stopping watchdog`);

        this.isRunning = false;

        if (this.timeoutId) {
            console.trace(`Process ${this.name} - Removing existing planned checking`);
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

    }


    /**
     * @return {Promise<ProcessDescription>} - Details of process
     */
    getProcessDetails() {
        console.trace(`Process ${this.name} - getting process details`);
        return new Promise((resolve, reject) => {
            pm2.describe(this.pm_id, (err, processDescription) => {
                if (err) {
                    return reject(err);
                }
                if (processDescription.length !== 1) {
                    return reject(new Error(`Process ${this.name} - details receiving failed. Unexpected number of results (${processDescription.length})`));
                }
                resolve(processDescription[0]);
            });
        });
    }


    /**
     * Internal function for continuously checking the webserver and restarting the PM2 process.
     */
    healthCheckingLoop() {
        if (!this.isRunning) { return; }

        // Get uptime to count uptime
        this.getProcessDetails().then(/**@param {ProcessDescription} processDescription*/ (processDescription) => {
            if (!this.isRunning) { return; }

            // Calculate time, when to execute the webserver check.
            const processUptime = (new Date().getTime()) - processDescription.pm2_env.created_at;
            const executeWatchdogAfter = Math.max(processDescription.pm2_env.min_uptime - processUptime, this.options.checkingInterval, 1000);
            console.trace(`Process ${this.name} - next checking after ${(executeWatchdogAfter/1000).toFixed(0)}s`);

            // Plan the next execution
            this.timeoutId = setTimeout(() => {
                this.timeoutId = null;

                if (!this.isRunning) { return; }

                console.trace(`Process ${this.name} - webserver checking executed`);

                rp(this.options.watchedUrl).then(() => {
                    this.failsCountInRow = 0;
                    console.debug(`Process ${this.name} - webserver response ok`);
                }).catch(() => {
                    if (!this.isRunning) { return; }

                    this.failsCountInRow++;
                    if (this.failsCountInRow < this.options.failsToRestart) {
                        console.info(`Process ${this.name} - webserver response ${this.failsCountInRow}/${this.options.failsToRestart} failed`);
                        return;
                    }

                    const m = `Process ${this.name} - restarting because of webserver is failing`;
                    console.info(m);
                    console.error(m);

                    // Process restart
                    return new Promise((resolve, reject) => {
                        pm2.restart(this.pm_id, (err) => {
                            if (err) {
                                console.error(`Process ${this.name} - restart failed. ${err.message || err}`);
                                reject(err);
                                return;
                            }
                            this.failsCountInRow = 0;
                            resolve();
                        });
                    });

                }).finally(() => {
                    this.healthCheckingLoop();
                });
            }, executeWatchdogAfter);

        }).catch((err) => {
            // Getting uptime failed.
            console.error(`Failed to receive of process details. ${err.message || err}`);
            if (!this.timeoutId) {
                setTimeout(() => {
                    this.healthCheckingLoop();
                }, 5000);
            }
        });
    }

}


module.exports = ProcessWatchdog;


/**
 * @typedef {object} ProcessDescription
 * @property {string} name
 * @property {number} pm_id
 * @property {number} monit.memory
 * @property {number} monit.cpu
 * @property {Pm2Env} pm2_env
 */


/**
 * @typedef {object} Pm2Env
 * @property {number} pm_id
 * @property {string} name
 * @property {string} exec_mode - 'fork_mode'|'cluster_mode'
 * @property {number} max_restarts
 * @property {number} min_uptime
 * @property {number} created_at
 * @property {string} status - “online”, “stopping”, “stopped”, “launching”, “errored”, or “one-launch-status”
 * @property {number} restart_time - Total count of restarts
 * @property {number} unstable_restarts
 * @property {true|undefined} axm_options.isModule
 */


/**
 * @typedef {object} WatchdogOptions
 * @property {string} watchedUrl
 * @property {number} checkingInterval
 * @property {number} failsToRestart
 */

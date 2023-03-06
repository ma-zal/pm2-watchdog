PM2 module: Webserver Watchdog
==============================

Module is continuously checking the health of PM2 NodeJS processes by calling the specified HTTP(s) endpoint. If the HTTP server is unavailable or response is not `2xx`, the PM2 process will be restarted.


Installation
------------

```bash
pm2 install ma-zal/pm2-watchdog
```


Basic configuration
-------------------

```bash
# Enable watching for PM2_PROCESS_NAME. Module will continuously checks the availability of URL.
pm2 set pm2-watchdog:url-PM2_PROCESS_NAME URL

```

Example:

```bash
pm2 set pm2-watchdog:url-helloworld http://localhost:3000/status
```

Optional advanced configuration
-------------------------------

```bash
# Adds the basic authorization to watching URL request.
# Use string in format `USERNAME:PASSWORD`
#
# Example: `pm2 set pm2-watchdog:urlauth-myapp foo:bar`
pm2 set pm2-watchdog:urlauth-PM2_PROCESS_NAME STRING

# Set the webserver checking for every NUMBER seconds.
# Default is 10 seconds (if no value is specified).
pm2 set pm2-watchdog:checking_interval NUMBER

# Set the app restart when NUMBER webserver checks had failed in a row.
# Default is 3 times (if no value is specified).
pm2 set pm2-watchdog:fails_to_restart NUMBER

# Enable message output level.
# Note: Log files are `~/.pm2/logs/pm2-watchdog-out.log`
#                 and `~/.pm2/logs/pm2-watchdog-error.log`
# Default is `info` (if no value is specified).
# Possible values (levels):
#   `info`  - info messages only (default)
#   `debug` - info + debug messages
#   `trace` - info + debug + trace messages
pm2 set pm2-watchdog:debug LEVEL

# Web request timeout in NUMBER milliseconds.
# Default is 5000 miliseconds (if no value is specified).
pm2 set pm2-watchdog:checking_timeout NUMBER
```


Logging
-------
The processes restarts are logged to error log file (to error output).
Therefore if you are tracking errors of your applications, you can redirect the error messages to get complete overview what is happening in your server.


Version Changelog
-----------------

###### 1.0.2 (6.3.2023)
- Added optional basic authorization.

###### 1.0.1 (17.1.2018)

- Added configurable request timeout.

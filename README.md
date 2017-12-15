PM2 module: Webserver Watchdog
==============================

Module is continually checking the health of PM2 NodeJS processes by calling the specified HTTP(s) endpoint. If the HTTP server is unavailable or response is not `2xx`, the PM2 process will be restarted.


Installation
------------

    pm2 install ma-zal/pm2-watchdog@development

Configuration
-------------

    pm2 set pm2-watchdog:url-{{PM2_PROCESS_NAME}} {{URL}}

Example:

    pm2 set pm2-watchdog:url-helloworld http://localhost:3000/status


---
Warning: Module is under develepoment process. No stable build yet.

---

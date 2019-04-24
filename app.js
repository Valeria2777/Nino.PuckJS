var NinoPuck = NinoPuck || (function ninoPuck() {
    'use strict';
    var debug = require('debug');
    var express = require('express');
    var path = require('path');
    var favicon = require('serve-favicon');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var routes = require('./routes/index');
    var users = require('./routes/users');
    var noble = require('noble');
    var app = express();
    
    var address = "c1:6b:be:53:55:3a";
    var command = "\x03\x10clearInterval()\n\x10setInterval(function() {LED3.set()}, 500);\n\x10print('Comando agregado')\n";
    var btDevice;
    var txCharacteristic;
    var rxCharacteristic;

    /** view engine setup*/
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    /** uncomment after placing your favicon in /public
    app.use(favicon(__dirname + '/public/favicon.ico'));
    */
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', routes);
    app.use('/users', users);

    /**catch 404 and forward to error handler
    */
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    /** error handlers
    development error handler
    will print stacktrace
    */
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    /*production error handler
    no stacktraces leaked to user
    */
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    app.set('port', process.env.PORT || 3000);

    var server = app.listen(app.get('port'), function () {
        debug('Express server listening on port ' + server.address().port);
    });

    /*Start the scan of devices.
     */
    noble.on('stateChange', function (state) {
        console.log("Noble: stateChange -> " + state);
        if (state === "poweredOn")
            noble.startScanning([], true);
    });
    /*Search the puck.js device, and send the command.
    */
    noble.on('discover', function (dev) {
        console.log("Found device: ", dev.address);
        if (dev.address !== address) {
            return;
        }
         noble.stopScanning();
        connect(dev, function () {
            // Connected!
            write(command, function () {
                disconnect();
            });
        });
    });
    /*
     *Performs the search for devices with certain features to connect.
     * @param {any} dev: is the device.
     * @param {any} callback
     */
    function connect(dev, callback) {
        btDevice = dev;
        console.log("BT> Connecting");
        btDevice.on('disconnect', function () {
            console.log("Disconnected");
        });
        btDevice.connect(function (error) {
            if (error) {
                console.log("BT> ERROR Connecting", error);
                btDevice = undefined;
                return;
            }
            console.log("BT> Connected");
            btDevice.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                function findByUUID(list, uuid) {
                    for (var i = 0; i < list.length; i++)
                        if (list[i].uuid === uuid) {
                            return list[i];
                        }
                    return undefined;
                }

                var btUARTService = findByUUID(services, "6e400001b5a3f393e0a9e50e24dcca9e");
                txCharacteristic = findByUUID(characteristics, "6e400002b5a3f393e0a9e50e24dcca9e");
                rxCharacteristic = findByUUID(characteristics, "6e400003b5a3f393e0a9e50e24dcca9e");
                if (error || !btUARTService || !txCharacteristic || !rxCharacteristic) {
                    console.log("BT> ERROR getting services/characteristics");
                    console.log("Service " + btUARTService);
                    console.log("TX " + txCharacteristic);
                    console.log("RX " + rxCharacteristic);
                    btDevice.disconnect();
                    txCharacteristic = undefined;
                    rxCharacteristic = undefined;
                    btDevice = undefined;
                    return openCallback();
                }

                rxCharacteristic.on('data', function (data) {
                    var s = "";
                    for (var i = 0; i < data.length; i++) {
                        s += String.fromCharCode(data[i]);
                    }
                    console.log("Received", JSON.stringify(s));
                });
                rxCharacteristic.subscribe(function () {
                    callback();
                });
            });
        });
    };
    /*
     * Write the obtained data.
     * @param {any} data
     * @param {any} callback
     */
    function write(data, callback) {
        function writeAgain() {
            if (!data.length) {
                return callback();
            }
            var d = data.substr(0, 20);
            data = data.substr(20);
            var buf = new Buffer(d.length);
            for (var i = 0; i < buf.length; i++) {
                buf.writeUInt8(d.charCodeAt(i), i);
            }
                txCharacteristic.write(buf, false, writeAgain);
        }
        writeAgain();
    }
    /**Dissconect the devices.
     **/
    function disconnect() {
        btDevice.disconnect();
    }
    var API = {
        connect: connect,
        write: write
    };
    return API;
})();
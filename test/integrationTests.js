var test = require('tap').test,
  healthy = require('../index'),
  request = require('request'),
  express = require('express'),
  async = require('async'),
  _     = require('underscore'),
  port = 3000;


test('Test middleware', function(t) {
  var stop = t.end.bind(t);

  var healthInstance = createServer(function(stopServer) {

    //first part of checks
    checkHealth(t, '/foo', function(defaultBody) {
      t.ok(defaultBody === 'nope', 'Route should have bypassed health check');

      checkHealth(t, function(health) {
        t.ok(health.status == 'ok', 'Good health check');

        var requestChild = healthInstance.addChildCheck('requests', {
          foo : 'bar'
        });

        var cpuChild = requestChild.addChildCheck('cpu', {
          beep: 'boop'
        }, { propigate : false });

        cpuChild.fail();
        checkHealth(t, function(health) { 

          t.equals(health.requests.foo, 'bar');
          t.equals(health.requests['requests-status'], 'ok');
          t.equals(health.requests.cpu.beep, 'boop');
          t.equals(health.requests.cpu['cpu-status'], 'not ok');
          
          //this will cause the main check to fail
          requestChild.set('status', 'not gude');

        });
      });
    });


    //this will only happen when 
    //the child check fails and bubbles up
    healthInstance.on('change:status', function(status) {
      t.equal(status, 'not ok');
      stopServer(stop);
    });

  });

});

test('Test custom rules', function(t) {
  var stop = t.end.bind(t);

  var healthInstance = createServer(function(stopServer) {

    var memoryCheck = healthInstance.addChildCheck('memory', 
      _.clone(process.memoryUsage()), {
        applyRules : function(data) {
          return (data.heapTotal < 100000000)
        }
      });


    healthInstance.on('failedCheck', function() {
      t.ok(true, 'applyRules appropriately caused a failed check');

      checkHealth(t, function(body) {
        t.equal(body.status, 'not ok');
        stopServer(stop);
      });
    });

    memoryCheck.set('heapTotal', 100000001);
  });
});

test('Test asyncCheck', function(t) {
  var stop = t.end.bind(t);

  var healthInstance = createServer(function(stopServer) {

    var fooCheck = healthInstance.addChildCheck('fooo', 
      { foo : 'bar'} , {
      });

    stopServer(stop);
  });
});


function checkHealth(t, route, cb) {
  if (!cb) {
    cb = route;
    route = '/health';
  }

  request('http://127.0.0.1:'+port+route, function (error, response, body) {
    t.ok((!error && (response.statusCode == 200)), 'status is okay');

    cb(response.headers['content-type'].indexOf('json')>0 
      ? JSON.parse(body) : body);
  })
}

function createServer(cb) {

  var app = express();
  healthInstance = healthy.HealthCheck();
  app.use(healthInstance.createMiddleware());
  app.use(function defualt (req, res, next) {
    res.status(200).send("nope");
  });

  console.log("starting server on port "+port);
  var server = app.listen(port, function() {
    console.log("server started");

    cb(function stopServer(stopCb) {
      stopCb = stopCb || function() {};
      server.close(stopCb);
    });

  });

  return healthInstance;

}
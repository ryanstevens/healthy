var middleware  = require('./lib/middleware'),
    HealthModel = require('./lib/HealthModel'),
    EE          = require('events').EventEmitter,
    _           = require('underscore');


function HealthCheck(initialModel, options) {

  if (!(this instanceof HealthCheck)) {
    return new HealthCheck(initialModel, options);
  }

  this.options = _.extend({
    baseRoute : 'health',
    runCheckHealth : false
  }, options || {});

  this.model = new HealthModel(initialModel || {}, this.options);
  //allow instances of HealthCheck to proxy events from model
  this.on = this.model.on.bind(this.model);
}

HealthCheck.prototype.createMiddleware = function createMiddleware() {
  return middleware.create(this.options.baseRoute, this.model);
};

//proxy to model's addChildCheck
HealthCheck.prototype.addChildCheck = function addChildCheck(name, healthInstance, options) {
  return this.model.addChildCheck(name, healthInstance, options);
};

//proxy checkHealth
HealthCheck.prototype.checkHealth = function checkHealth(cb) {
  this.model.checkHealth(cb);
};

module.exports = {
  HealthCheck : HealthCheck,
  HealthModel : HealthModel
};
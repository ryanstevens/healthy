var util  = require('util'),
    async = require('async'),
    Model = require('./Model'),
    _     = require('underscore');


function Health(attr, options) {

  if (!(this instanceof Health)) {
    return new Health(attr, options);
  }

  var self = this;

  options = _.extend({
    defaultStatus : 'ok',
    //can a child's status buble to parrent?
    propigate : true,
    serializer : function(data) {
      return JSON.stringify(data, null, 4);
    },

    applyRules : function() { return true; },
    checkChildren : false,
    asyncCheck : function(cb) {
      cb();
    }.bind(this), 
    checkInterval : -1

  }, options || {});

  attr =  _.extend({
    'status' : options.defaultStatus
  }, attr || {});

  Model.call(this, attr, options);

  function validate() { 
    if (!self.isHealthy()) self.fail();
  }

  //call it once since the initial attr's are set
  validate();

  function checkHealth(done) {
    options.asyncCheck(function(err) {
      if (err) return done(err);
      validate();
      if (_.isFunction(done)) done();
    });
  }

  this.checkHealth = checkHealth;
  this.on('change', _.debounce(validate, 2));
  if (options.checkInterval>0)
    (function healthTick() {
      setTimeout(function() {
        checkHealth(function doneCheck() {
          healthTick();
        });
      }, options.checkInterval);
    })();
}


util.inherits(Health, Model);

Health.prototype.isHealthy = function isHealthy() {
  return (this.get('status') === this.options.defaultStatus && 
    this.options.applyRules.call(this, this.getHealthObject()));
};

Health.prototype.getHealthObject = function getHealthObject() {

  var healthModels = {};
  var model = _.reduce(_.keys(this._attributes), function(memo, key) {
    var val = this._attributes[key];
    if (this._attributes[key] instanceof Health) healthModels[key] = val;
    else memo[key] = val;
    return memo;
  }, {}, this);

  _.each(healthModels, function(val, key) {
    var childModelObject = val.getHealthObject();

    //we prepend the key to the status 
    //because many (most) load balancers
    //simply check regex for `"status" : "ok"`
    //to determine to take an application out of the pool.  
    //This way a child status won't do this 
    childModelObject[key+'-status'] = childModelObject.status;
    delete childModelObject.status;
    model[key] = childModelObject;
  });

  return model;
};

Health.prototype.set = function healthSet(name, value) {

  if (this._attributes[name] === undefined && (value instanceof Model)) {
    value.on('change:status', checkChildStatus.bind(this, value));
  }

  Model.prototype.set.call(this, name, value);

};

Health.prototype.serialize = function serialize() {
  return this.options.serializer(this.getHealthObject());
};

Health.prototype.fail = function fail() {
  if (this._failed) return;
  this.set('status', 'not ' + this.options.defaultStatus);
  this.emit('failedCheck');
  this._failed = true;
};

function checkChildStatus(child) {
  if (child.options.propigate && !child.isHealthy()) {
    this.fail();
  }
}


Health.prototype.addChildCheck = function addChildCheck(name, healthInstance, options) {
 
  if (!(healthInstance instanceof Health)) {
    healthInstance = new Health(healthInstance, options);
  }

  this.set(name, healthInstance);
  return healthInstance;
};

module.exports = Health;
var test = require('tap').test,
  HealthModel = require('../lib/HealthModel');

test('Test setting object literal', function(t) {

  var model = HealthModel({
    foo : 'bar'
  });

  t.equals(model.get('foo'), 'bar');

  model.set({
    beep : 'boop',
    foo : 'boo'
  });

  t.equals(model.get('foo'), 'boo');
  t.equals(model.get('beep'), 'boop');

  t.end();
});

test('Test model change event', function(t) {

  var model = new HealthModel();
  model.set('foo', 'bar');
  model.on('change:foo', function(newVal, oldVal) {

    t.ok(newVal, 'bar2');
    t.ok(oldVal, 'bar');

    t.end();
  }); 

  model.set('foo', 'bar2');

});


test('Test model change event for deep equal', function(t) {

  var model = new HealthModel();
  model.set('obj', {beep : 'boop'});
  //make sure deep equal fires change
  model.on('change:obj', function(newObj, oldObj) {
    t.equal(oldObj.beep, 'boop', 'complex old object');
    t.equal(newObj.beep, 'bop', 'complex new object');
    t.end();
  });

  model.set('obj', {beep : 'bop'});

});


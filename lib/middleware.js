var parse = require('parseurl');

module.exports.create = function create(route, model) {

  return function healthyMiddelware (req, res, next) {

    var urlParts = parse(req);

    if (urlParts 
      && urlParts.pathname
      && urlParts.pathname.toLowerCase().trim() === 
        '/'+route.toLowerCase().trim()) {

      res.setHeader('Content-Type', 'application/json');
      res.status(200)
        .send(model.serialize());
    }
    else next();

  };
};
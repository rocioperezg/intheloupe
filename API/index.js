const express = require("express")
const app = express()
var constants = require("./constants")
var api = require('./api')
var freelancerRoutes = require('./routes/freelancer');

// Se conecta la base de datos
require('./database_connection')

// Se inicializa el servidor
app.listen(constants.API_PORT, () => {
  console.log("Api inicializada en el puerto en el puerto " + constants.API_PORT);
});

// Se inicializan las dependencias de la app
app.use('/api', api.router);
app.use('/api/freelancer', freelancerRoutes.router);

const logRequestStart = (req, res, next) => {
  console.info(`${req.method} ${req.originalUrl}`)
  next()
}

app.use(logRequestStart)

app.use(function (req, res, next) {
  var err = new Error('Ruta no encontrada1: ', req);
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
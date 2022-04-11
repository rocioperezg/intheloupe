var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

// load up the user model
var config = require('../configs/config'); // get db config file
var con;

passportFunction = function (passport) {

    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
    opts.secretOrKey = config.jwt_key;

    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {

        let user;
        var sqlquery = "SELECT * FROM dbloupe.user WHERE iduser=" + jwt_payload.iduser + ";";
        con.query(sqlquery, function (err, result) {
            if (err) return done(err, false);

            if (result.length > 0) {
                user = result[0];

                if (user.nombre_jugador !== jwt_payload.nombre_jugador) {
                    done(null, user, {
                        actualizar_jwt: true,
                        jwt_token: user.jwt_token,
                        nombre_jugador: user.nombre_jugador
                    })
                } else {
                    done(null, user);
                }

            } else {
                done(null, false);
            }

        });

    }));


    passport.use('server-authentication', new JwtStrategy(opts, function (jwt_payload, done) {

        console.log("se usa server-authentication")
        let user;
        var sqlquery = "SELECT * FROM dbloupe.usuarios WHERE idusuario=" + jwt_payload.idusuario + ";";
        con.query(sqlquery, function (err, result) {
            if (err) return done(err, false);

            if (result.length > 0) {
                user = result[0];
                var sqlquery = "SELECT * FROM dbloupe.unarmed_server WHERE idserver=" + jwt_payload.idusuario + ";";
                con.query(sqlquery, function (err, result) {
                    if (err) return done(err, false);

                    if (result.length > 0) {

                        if (user.nombre_jugador !== jwt_payload.nombre_jugador) {
                            done(null, user, {
                                actualizar_jwt: true,
                                jwt_token: user.jwt_token,
                                nombre_jugador: user.nombre_jugador
                            })
                        } else {
                            done(null, user);
                        }

                    } else {
                        done(null, false);
                    }
                });
            } else {
                done(null, false);
            }
        });
    }));
};

setConexion = function (conexion) {
    con = conexion;
}

module.exports = {
    passportFunction: passportFunction,
    setConexion: setConexion
}

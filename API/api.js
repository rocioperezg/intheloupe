var express = require('express')
var router = express.Router()
const jwt = require('jsonwebtoken')
const config = require('./configs/config')
var passport = require('passport')
var crypto = require('crypto')
require('./auth/passport').passportFunction(passport);
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('');


var GoogleStrategy = require('passport-google-oauth20').Strategy;

var con;
setConexion = function (conexion) {
    con = conexion;
    console.log("\nConexión con la base de datos establecida: ", con.config.connectionConfig.database)
}


passport.use(new GoogleStrategy({
    clientID: '',
    clientSecret: 'YeJ0ZyTFOjjhBM8yrvb8xy9V',
    callbackURL: "/return"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

router.get('/return',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    });

router.get('/freelancerlist', function (req, res) {
    var sqlquery = "SELECT * FROM dbloupe.freelancer;";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        return res.status(200).json(result)

    });
});


router.get('/emailinuse/:email', function (req, res) {

    var email = req.params.email;

    var sqlquery = "SELECT * FROM dbloupe.user WHERE email='"+ email +"';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;
            return res.status(200).json({respuesta: result.length > 0})
    });
});

router.get('/profiledata/:iduser', function (req, res) {

    var iduser = req.params.iduser;

    var sqlquery = "SELECT name, lastname, workareas, workplaces, countries, isfreelancer, company_name, descripcion FROM dbloupe.user WHERE iduser='" + iduser + "';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            return res.status(200).json({
                response: 'Guardado',
                result: result[0]
            })
        } else {
            return res.status(200).json({
                response: 'Guardado',
                result: null
            })
        }

    });
});

router.post('/formulariocontacto', function (req, res) {

    var name = req.body.name;
    var email = req.body.email;
    var telephone_number = req.body.telephone_number;
    var message = req.body.message;

    var sqlquery = "INSERT INTO dbloupe.contact (name, email, telephone_number, message) VALUES ('" + name + "','" + email + "','" + telephone_number + "','" + message + "');";
    con.query(sqlquery, function (err, result) {
        if (err) {
            console.log(err)
            return res.status(200).json({
                response: 'Se ha producido un error. Inténtalo de nuevo más tarde.',
            });
        } else {
            return res.status(200).json({
                response: "¡Muchas gracias por tu mensaje! ¡Nos pondremos en contacto contigo lo antes posible!"
            })
        }
    });


});

router.post('/signupgoogle', function (req, res) {

    var authToken = req.body.authToken;
    var idToken = req.body.idToken;
    var name = req.body.name;
    var email = req.body.email;

    var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + email + "';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            return res.status(400).json({
                response: 'El email ya está en uso',
                jwt_token: ''
            });
        } else {

            var password = '';
            var sqlquery = "INSERT INTO dbloupe.user (email, password, authtoken, idtoken) VALUES ('" + email + "','" + password + "','" + authToken + "','" + idToken + "');";
            con.query(sqlquery, function (err, result) {
                if (err) {
                    console.log(err)
                    return res.status(400).json({
                        response: 'Se ha producido un error en el proceso de registro',
                        jwt_token: ''
                    });
                } else {

                    var iduser = result.insertId;

                    return res.status(200).json({
                        response: 'Saved',
                        jwt_token: '',
                        name: name,
                        iduser: iduser
                    })

                }

            });


        }

    });

});

router.post('/signupnewsletter', function (req, res) {

    var email = req.body.email;


    var sqlquery = "SELECT * FROM dbloupe.newsletter WHERE email='" + email + "';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            return res.status(200).json({
                response: "Ya estás apuntado a esta newsletter ¡Muchas gracias!"
            })

        } else {

            var sqlquery = "INSERT INTO dbloupe.newsletter (email) VALUES ('" + email + "');";
            con.query(sqlquery, function (err, result) {
                if (err) {
                    console.log(err)
                    return res.status(200).json({
                        response: 'Se ha producido un error. Inténtalo de nuevo más tarde.',
                    });
                } else {
                    return res.status(200).json({
                        response: "¡Muchas gracias por apuntarte a la newsletter! ¡En tu correo podrás encontrar todas las novedades sobre Loupe!"
                    })
                }
            });
        }
    });

});

router.post('/signin', function (req, res) {

    var email = req.body.email;
    var password = req.body.password;

    var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + email + "';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            if (result[0].password == '') {
                return res.status(400).json({
                    response: "Este usuario se registró a través de la cuenta de google"
                })
            } else {
                var user = result[0];
                var salt = user.password.split("$")[0];

                password = encriptarPasswordConHalt(password, salt);

                var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + email + "' AND password='" + password + "';";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;

                    if (result.length > 0) {

                        if (result[0].basic_profile_completed) {
                            return res.status(200).json({
                                respuesta: 'ok',
                                jwt_token: result[0].jwt_token,
                                basic_profile_completed: 1
                            })
                        } else {
                            return res.status(200).json({
                                respuesta: 'ok',
                                jwt_token: '',
                                basic_profile_completed: 0
                            })
                        }

                    } else {
                        return res.status(400).json({
                            response: "La contraseña es incorrecta"
                        })
                    }

                });
            }


        } else {
            return res.status(400).json({
                response: "No se ha encontrado el email"
            })
        }

    });

});

router.post('/signingoogle', function (req, res, next) {


    var authToken = req.body.authToken;
    var idToken = req.body.idToken;
    var email = req.body.email;

    var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + email + "';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {


            if (result[0].password !== '') {
                return res.status(400).json({
                    response: "Este usuario no se registró a través de Google"
                })
            } else {

                login = function (req, res, next) {
                    async function verify() {
                        const ticket = await client.verifyIdToken({
                            idToken: idToken,
                            audience: ""
                        });
                        const payload = ticket.getPayload();
                        const userDetails = {
                            email: payload['email'],
                            firstname: payload['given_name'],
                            lastname: payload['family_name']
                        }

                        if (result[0].basic_profile_completed) {
                            return res.status(200).json({
                                respuesta: 'ok',
                                jwt_token: result[0].jwt_token,
                                basic_profile_completed: 1
                            })
                        } else {
                            return res.status(200).json({
                                respuesta: 'ok',
                                jwt_token: result[0].jwt_token,
                                basic_profile_completed: 0
                            })
                        }

                    }
                    verify().catch(() => {
                        return res.status(400).json({
                            response: "Error en el acceso con Google"
                        })
                    });
                }(req, res, next);

            }

        } else {
            return res.status(400).json({
                response: "No se ha encontrado el email"
            })
        }

    });

});



login = (req, res, next) => {
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: req.body.token,
            audience: ""
        });
        const payload = ticket.getPayload();
        const userDetails = {
            email: payload['email'],
            firstname: payload['given_name'],
            lastname: payload['family_name']
        }

    }
    verify().catch(console.error);
}




router.post('/editprofiledata', function (req, res, next) {

    var iduser = req.body.iduser;
    var actual_email = req.body.actual_email;
    var new_email = req.body.new_email;
    var name = req.body.name;
    var actual_password = req.body.actual_password
    var new_password = req.body.new_password;
    var descripcion = req.body.descripcion;

    passport.authenticate('jwt', { session: false }, function (err, user, info) {

        var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + actual_email + "';";
        con.query(sqlquery, function (err, result) {
            if (err) throw err;

            if (result.length > 0) {

                if (result[0].password == '') {
                    const token = generateToken(iduser, new_email, name);

                    var sqlquery = ''
                    if (!result[0].isfreelancer) {
                        sqlquery = "UPDATE dbloupe.user SET email='" + new_email + "', name='" + name + "', company_name='" + name + "', descripcion='" + descripcion + "', jwt_token='" + token + "' WHERE email='" + actual_email + "';"
                    } else {
                        sqlquery = "UPDATE dbloupe.user SET email='" + new_email + "', name='" + name + "', descripcion='" + descripcion + "', jwt_token='" + token + "' WHERE email='" + actual_email + "';"
                    }

                    con.query(sqlquery, function (err, result) {
                        if (err) {
                            console.log("Error: ", err)
                            return res.status(400).json({
                                response: 'Se ha producido un error',
                                jwt_token: ''
                            });
                        } else {
                            return res.status(200).json({
                                response: 'Usuario actualizado con éxito',
                                jwt_token: token
                            })
                        }
                    });
                } else {
                    var user = result[0];
                    var salt = user.password.split("$")[0];

                    password = encriptarPasswordConHalt(actual_password, salt);

                    var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + actual_email + "' AND password='" + password + "';";
                    con.query(sqlquery, function (err, result) {
                        if (err) throw err;

                        if (result.length > 0) {

                            new_password = encriptarPasswordSinHalt(new_password);
                            const token = generateToken(iduser, new_email, name);


                            var sqlquery = ''
                            if (!result[0].isfreelancer) {
                                sqlquery = "UPDATE dbloupe.user SET email='" + new_email + "', name='" + name + "', company_name='" + name + "', descripcion='" + descripcion + "', password='" + new_password + "', jwt_token='" + token + "' WHERE email='" + actual_email + "';"
                            } else {
                                sqlquery = "UPDATE dbloupe.user SET email='" + new_email + "', name='" + name + "', descripcion='" + descripcion + "', password='" + new_password + "', jwt_token='" + token + "' WHERE email='" + actual_email + "';"
                            }
                            con.query(sqlquery, function (err, result) {
                                if (err) {
                                    console.log("Error: ", err)
                                    return res.status(400).json({
                                        response: 'Se ha producido un error',
                                        jwt_token: ''
                                    });
                                } else {
                                    return res.status(200).json({
                                        response: 'Usuario actualizado con éxito',
                                        jwt_token: token
                                    })
                                }
                            });

                        } else {

                            var sqlquery = "UPDATE dbloupe.user SET descripcion='" + descripcion + "' WHERE email='" + actual_email + "';"
                            con.query(sqlquery, function (err, result) {
                                if (err) {
                                    console.log("Error: ", err)
                                    return res.status(400).json({
                                        response: 'Se ha producido un error',
                                        jwt_token: ''
                                    });
                                } else {
                                    return res.status(200).json({
                                        response: 'Usuario actualizado con éxito',
                                        jwt_token: null
                                    })
                                }
                            });

                        }

                    });
                }


            } else {
                return res.status(400).json({
                    response: "No se ha encontrado el email"
                })
            }

        });


















    })(req, res, next);

});


router.post('/completebasicprofiledata', function (req, res, next) {

    var email = req.body.email;
    var name = req.body.name;
    var lastname = req.body.lastname;
    var particular = req.body.particular;
    var company_name = req.body.nombre_empresa;
    var isfreelancer = req.body.isfreelancer;
    var selectedItemsProvinces = req.body.selectedItemsProvinces;
    var selectedItemsFreelancer = req.body.selectedItemsFreelancer;
    var selectedItemsCountries = req.body.selectedItemsCountries;

    passport.authenticate('jwt', { session: false }, function (err, user, info) {

        var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + email + "';";
        con.query(sqlquery, function (err, result) {
            if (err) throw err;

            if (result.length > 0) {

                var iduser = result[0].iduser

                const token = generateToken(iduser, email, name);

                if (!isfreelancer) { 
                    lastname = ''
                    name = company_name
                }

                var sqlquery = "UPDATE dbloupe.user SET jwt_token='" + token + "', name='" + name + "', lastname='" + lastname + "', particular=" + particular + ", company_name='" + company_name + "', isfreelancer=" + isfreelancer + ", workplaces='" + JSON.stringify(selectedItemsProvinces) + "', countries='" + JSON.stringify(selectedItemsCountries) + "', workareas='" + JSON.stringify(selectedItemsFreelancer) + "', basic_profile_completed=1 WHERE email='" + email + "';";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;
                    return res.status(200).json({
                        response: 'Saved',
                        jwt_token: token
                    })
                });

            } else {

                console.log("error: ", result)
                return res.status(400).json({
                    response: 'Se ha producido un error',
                    jwt_token: ''
                });


            }

        });

    })(req, res, next);

});




router.post('/signup', function (req, res) {

    var email = req.body.email;
    var password = req.body.password;
    var password_repeat = req.body.password_repeat;
    var name = req.body.name;
    var lastname = req.body.lastname;
    var nombre_empresa = req.body.nombre_empresa;
    var particular = req.body.particular;
    var sector = req.body.sector;

    var isfreelancer = req.body.isfreelancer;
    var selectedItemsProvinces = req.body.selectedItemsProvinces;
    var selectedItemsCountries = req.body.selectedItemsCountries;
    var selectedItemsFreelancer = req.body.selectedItemsFreelancer;

    if (password !== password_repeat) {
        return res.status(400).json({
            response: 'Las contraseñas no coinciden',
            jwt_token: ''
        });
    }

    var sqlquery = "SELECT * FROM dbloupe.user WHERE email='" + email + "';";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            return res.status(400).json({
                response: 'El email ya está en uso',
                jwt_token: ''
            });
        } else {

            var fecha = new Date();

            password = encriptarPasswordSinHalt(password);

            if (!isfreelancer) {
                lastname = ''
                name = nombre_empresa
            }

            var sqlquery = "INSERT INTO dbloupe.user (email, password, name, lastname, company_name, sector, particular) VALUES ('" + email + "','" + password + "','" + name + "','" + lastname + "','" + nombre_empresa + "','" + sector + "'," + particular + ");";
            con.query(sqlquery, function (err, result) {
                if (err) {
                    console.log(err)
                    return res.status(400).json({
                        response: 'Se ha producido un error en el proceso de registro',
                        jwt_token: ''
                    });
                } else {

                    var iduser = result.insertId;
                    const token = generateToken(iduser, email, name);

                    var sqlquery = "UPDATE dbloupe.user SET jwt_token='" + token + "', name='" + name + "', isfreelancer=" + isfreelancer + ", workplaces='" + JSON.stringify(selectedItemsProvinces) + "', countries='" + JSON.stringify(selectedItemsCountries) + "', workareas='" + JSON.stringify(selectedItemsFreelancer) + "', basic_profile_completed=1 WHERE email='" + email + "';";
                    con.query(sqlquery, function (err, result) {
                        if (err) throw err;
                        return res.status(200).json({
                            response: 'Saved',
                            jwt_token: token,
                            iduser: iduser
                        })
                    });

                }

            });


        }

    });

});



encriptarPasswordSinHalt = function (password) {

    let salt = crypto.randomBytes(16).toString('base64');
    let hash = crypto.createHmac('sha512', salt)
        .update(password)
        .digest("base64");
    password = salt + "$" + hash;

    return password;

}

encriptarPasswordConHalt = function (password, salt) {

    let hash = crypto.createHmac('sha512', salt)
        .update(password)
        .digest("base64");
    password = salt + "$" + hash;

    return password;

}



generateToken = function (iduser, email, name) {

    const payload = {
        iduser: iduser,
        email: email,
        name: name
    };

    const token = jwt.sign(payload, config.jwt_key);
    return token;
}

module.exports = {
    router: router,
    setConexion: setConexion,
    encriptarPasswordConHalt: encriptarPasswordConHalt,
    encriptarPasswordSinHalt: encriptarPasswordSinHalt,
    generateToken: generateToken
}


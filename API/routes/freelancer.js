const express = require('express');
const router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');


var multer = require('multer');

var fs = require('fs');
const imageToBase64 = require('image-to-base64');




var storage = multer.diskStorage({

    destination: function (req, file, cb) {
        var dir = '../uploads/album/' + req.user.iduser;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, '../uploads/album/' + req.user.iduser)
    },
    filename: function (req, file, cb) {
        cb(null, '' + file.originalname)
    }
})

var storagePortfolio = multer.diskStorage({
    destination: function (req, file, cb) {

        var dir = '../uploads/portfolio/' + req.user.iduser;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, '../uploads/portfolio/' + req.user.iduser)
    },
    filename: function (req, file, cb) {
        cb(null, '' + file.originalname)
    }
})


var upload = multer({ dest: '../uploads', limits: { fieldSize: 1 * 400 * 400 } });
var uploadAlbumFolder = multer({ storage: storage, limits: { fieldSize: 25 * 100 * 100 } })
var uploadPortfolioFolder = multer({ storage: storagePortfolio, limits: { fieldSize: 10 * 200 * 200 } })

var con;
setConexion = function (conexion) {
    con = conexion;
}

router.get('/imagenperfil/:iduser', passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var iduser = req.params.iduser;

    var sqlquery = "Select * FROM dbloupe.user WHERE iduser =" + iduser + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;


        if (result.length > 0) {

            var user = result[0];
            return res.status(200).json({
                response: 'Guardado',
                url: user.profile_image
            });

            /*
            if (result[0].imagenperfilpath != 'null' && result[0].imagenperfilpath != null) {
                fs.readFile('../uploads/' + result[0].imagenperfilpath, 'binary', function (err, data) {
                    if (err) throw err;

                    res.setHeader('Content-Length', user.sizeimagenperfil);
                    res.setHeader('Content-Type', user.mimetype);
                    res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
                    res.write(data, 'binary');
                    res.end();

                });
            } else {
                return res.status(200).json({
                    response: 'Fallo'
                });
            }
            */

        } else {
            return res.status(200).json({
                response: 'Fallo'
            });
        }

    });


});

router.post('/imagenperfil/:iduser', upload.array('image'), passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var iduser = req.params.iduser;
    var profile_image = req.body.profile_image

    var sqlquery = "SELECT * FROM dbloupe.user WHERE iduser =" + iduser + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            var sqlquery = "UPDATE dbloupe.user SET profile_image='" + profile_image + "' WHERE iduser =" + iduser + ";";
            con.query(sqlquery, function (err, result) {
                if (err) throw err;
                return res.status(200).json({
                    response: 'Guardado'
                });
            });

            /*
            var user = result[0];

            if (user.imagenperfilpath != "null" && user.imagenperfilpath != null) {

                fs.unlink('../uploads/' + user.imagenperfilpath, function (err) {
                    if (err) throw err;

                    var sqlquery = "UPDATE dbloupe.user SET imagenperfilpath='" + req.files[0].filename + "', mimetype='" + req.files[0].mimetype + "', sizeimagenperfil=" + req.files[0].size + " WHERE iduser =" + iduser + ";";
                    con.query(sqlquery, function (err, result) {
                        if (err) throw err;
                        return res.status(200).json({
                            response: 'Guardado'
                        });
                    });

                });

            } else {

                var sqlquery = "UPDATE dbloupe.user SET imagenperfilpath='" + req.files[0].filename + "', mimetype='" + req.files[0].mimetype + "', sizeimagenperfil=" + req.files[0].size + " WHERE iduser =" + iduser + ";";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;
                    return res.status(200).json({
                        response: 'Guardado'
                    });
                });
            }
            */
        }
    });


    /*
    upload(req, res, function (err) {
        if (err) {
            // An error occurred when uploading
            return res.status(422).send("an Error occured")

        }
        // No error occured.
        path = req.file.path;
        return res.status(200).json("[{'mensaje':'Guardado'}]");
    });
    */

});

router.post('/uploadportfolio', passport.authenticate('jwt', { session: false }), uploadPortfolioFolder.array('file'), (req, res, next) => {

    var imagenes_modificadas = JSON.parse(req.body.imagenes_modificadas);
    var portfolio_type = req.body.portfolio_type;

    passport.authenticate('jwt', { session: false }, function (err, user, info) {

        var idUser = user.iduser

        var sqlquery = "SELECT * FROM dbloupe.portfolio JOIN dbloupe.user_has_portfolio ON user_has_portfolio.idportfolio=portfolio.idportfolio WHERE iduser=" + idUser + ";";
        con.query(sqlquery, function (err, result) {
            if (err) throw err;

            if(result.length > 0){

                for(var portfolio of result){
                    if(portfolio.portfolio_type == portfolio_type){

                        var index = 0
                        var imagenesActualizadas = []
                        for(var imagen of imagenes_modificadas){
                            if(imagen.modificada){
                                imagenesActualizadas.push(JSON.stringify({'url': imagen.url}))
                            }else{
                                if(portfolio.images == null){
                                    imagenesActualizadas.push(JSON.stringify({'url': null}))
                                }else{
                                    imagenesActualizadas.push(JSON.stringify({'url': JSON.parse(portfolio.images)[index].url}))
                                }
                            }   
                            index = index + 1
                        }


                    
                        imagenesActualizadas = '[' + imagenesActualizadas + ']'                        
                        var sqlquery = "UPDATE dbloupe.portfolio SET images='" + imagenesActualizadas + "' WHERE idportfolio=" + portfolio.idportfolio + ";";
                        con.query(sqlquery, function (err, result) {
                            if (err) throw err;
            
                            return res.status(200).json({
                                response: 'Guardado'
                            });
            
                        });
            
                        index = index + 1


                    }
                }

            }else{
                return res.status(200).json({
                    response: 'Guardado'
                });
            }

            


        });

       


    })(req, res, next);



});



router.post('/album/uploadportfolio', passport.authenticate('jwt', { session: false }), uploadPortfolioFolder.array('file'), (req, res, next) => {

    var imagenes = req.files;
    var imagenes_existentes = JSON.parse(req.body.imagenes_existentes);
    var portfolio_type = req.body.portfolio_type;
    passport.authenticate('jwt', { session: false }, function (err, user, info) {

        var idUser = user.iduser


        var sqlquery = "SELECT * FROM dbloupe.portfolio JOIN dbloupe.user_has_portfolio ON user_has_portfolio.idportfolio=portfolio.idportfolio WHERE iduser=" + idUser + ";";
        con.query(sqlquery, function (err, result) {
            if (err) throw err;

            var idPortfolio = -1
            var encontrado = false
            if (result.length >= 0) {


                for (var portfolio of result) {
                    if (portfolio.portfolio_type == portfolio_type) {
                        encontrado = true
                        idPortfolio = portfolio.idportfolio
                    }
                }

                if (encontrado) {
                    var indexNuevas = 0
                    var data = []
                    var index = 0;
                    var indexEliminados = []
                    for (var imagen of imagenes_existentes) {
                        if (imagen == 'new') {
                            indexEliminados.push(index)
                            data.push([index + '_' + imagenes[indexNuevas].filename])
                            indexNuevas = indexNuevas + 1;
                        } else if (imagen == null) {
                            indexEliminados.push(index)
                        }
                        index = index + 1;
                    }


                    con.query(sqlquery, function (err, result) {
                        if (err) throw err;

                        var idsEliminar = []
                        for (var imagen of result) {
                            var numero = imagen.name.split('_')[0]
                            if (indexEliminados.includes(parseInt(numero))) {
                                idsEliminar.push(imagen.idimage)
                            }
                        }

                        if (idsEliminar.length == 0) {
                            idsEliminar.push(-1)
                        }


                        var sqlquery = "DELETE FROM dbloupe.image WHERE (idimage) IN (?);";
                        con.query(sqlquery, [idsEliminar], function (err, result) {
                            if (err) throw err;

                            if (data.length > 0) {
                                var sqlquery = "INSERT INTO dbloupe.image (name) VALUES ?;";
                                con.query(sqlquery, [data], function (err, result) {
                                    if (err) throw err;

                                    var ids = []
                                    var i = 0;
                                    for (i = result.insertId; i < result.insertId + result.affectedRows; i++) {
                                        ids.push([idPortfolio, i]);
                                    }

                                    var sqlquery = "INSERT INTO portfolio_has_image (idportfolio, idimage) VALUES ?";
                                    con.query(sqlquery, [ids], function (err, result) {
                                        if (err) throw err;
                                        return res.status(200).json({
                                            response: 'Guardado'
                                        });
                                    });


                                })
                            } else {
                                return res.status(200).json({
                                    response: 'Guardado'
                                });
                            }


                        });



                    });



                }


            }

            if (!encontrado) {
                var sqlquery = "INSERT INTO dbloupe.portfolio (portfolio_type) VALUES ('" + portfolio_type + "');";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;

                    idPortfolio = result.insertId;

                    var sqlquery = "INSERT INTO dbloupe.user_has_portfolio(iduser, idportfolio) VALUES (" + idUser + "," + idPortfolio + ");";
                    con.query(sqlquery, function (err, result) {
                        if (err) throw err;

                        var indexNuevas = 0
                        var data = []
                        var index = 0;
                        for (var imagen of imagenes_existentes) {
                            if (imagen == 'new') {
                                data.push([index + '_' + imagenes[indexNuevas].filename])
                                indexNuevas = indexNuevas + 1;
                            }
                            index = index + 1;
                        }

                        if (data.length > 0) {
                            var sqlquery = "INSERT INTO dbloupe.image (name) VALUES ?;";
                            con.query(sqlquery, [data], function (err, result) {
                                if (err) throw err;

                                var ids = []
                                var i = 0;
                                for (i = result.insertId; i < result.insertId + result.affectedRows; i++) {
                                    ids.push([idPortfolio, i]);
                                }

                                var sqlquery = "INSERT INTO portfolio_has_image (idportfolio, idimage) VALUES ?";
                                con.query(sqlquery, [ids], function (err, result) {
                                    if (err) throw err;
                                    return res.status(200).json({
                                        response: 'Guardado'
                                    });
                                });


                            })
                        } else {
                            return res.status(200).json({
                                response: 'Guardado'
                            });
                        }





                    });

                });
            }

        });


    })(req, res, next);



});





router.post('/album/uploadimages/:idalbum', passport.authenticate('jwt', { session: false }), uploadAlbumFolder.array('file'), (req, res, next) => {

    var imagenes = req.files;
    //var etiquetas = req.body.data;
    //if (typeof etiquetas == "string") {
    //    etiquetas = JSON.parse(etiquetas)
    //}
    var name = req.body.name;
    var description = req.body.description;
    var categoria = req.body.categoria;
    var type = req.body.type;
    var styles = req.body.styles;
    var labels = req.body.labels;
    var imagenes_existentes = JSON.parse(req.body.imagenes_existentes);
    var array_imagenes_urls = JSON.parse(req.body.array_imagenes_urls)
   

    //var album_type = req.body.albumtype;

    passport.authenticate('jwt', { session: false }, function (err, user, info) {

        var idUser = user.iduser
        var idAlbum = req.params.idalbum;

        if (idAlbum == -1) {

            var sqlquery = "INSERT INTO dbloupe.album (album_name, album_description, album_categoria, album_type, album_styles, album_labels) VALUES ('" + name + "','" + description + "','" + categoria + "','" + type + "','" + styles + "','" + labels + "');";
            con.query(sqlquery, function (err, result) {
                if (err) throw err;

                idAlbum = result.insertId;

                var sqlquery = "INSERT INTO dbloupe.user_has_album (iduser, idalbum) VALUES (" + idUser + "," + idAlbum + ");";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;

                    var data = []
                    for (var imagen of array_imagenes_urls) {
                        data.push(["generic_name", imagen])
                    }

                    var sqlquery = "INSERT INTO dbloupe.image (name, url) VALUES ?;";
                    con.query(sqlquery, [data], function (err, result) {
                        if (err) throw err;

                        var ids = []
                        var i = 0;
                        for (i = result.insertId; i < result.insertId + result.affectedRows; i++) {
                            ids.push([idAlbum, i]);
                        }

                        var sqlquery = "INSERT INTO album_has_image (idalbum, idimage) VALUES ?";
                        con.query(sqlquery, [ids], function (err, result) {
                            if (err) throw err;
                            return res.status(200).json({
                                response: 'Guardado'
                            });
                        });


                    })
                });

            });
        } else {

            var sqlquery = "UPDATE dbloupe.album set album_name='" + name + "', album_description='" + description + "', album_categoria='" + categoria + "', album_type='" + type + "', album_styles='" + styles + "', album_labels='" + labels + "' WHERE idalbum=" + idAlbum + "";
            con.query(sqlquery, function (err, result) {
                if (err) throw err;

                var sqlquery = "SELECT * FROM dbloupe.image JOIN dbloupe.album_has_image ON album_has_image.idimage=image.idimage JOIN dbloupe.album ON album.idalbum=album_has_image.idalbum JOIN dbloupe.user_has_album ON dbloupe.user_has_album.idalbum = dbloupe.album.idalbum WHERE iduser=" + idUser + ";";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;


                    var array_eliminar = []

                    for (var imagen of result) {
                        if (imagenes_existentes.includes(imagen.idimage) && idAlbum == imagen.idalbum) {
                        } else if (!imagenes_existentes.includes(imagen.idimage) && idAlbum == imagen.idalbum) {
                            array_eliminar.push(imagen.idimage)
                        }
                    }

                    if (array_eliminar.length > 0) {
                        var sqlquery = "DELETE FROM dbloupe.image WHERE (idimage) IN (?);";
                        con.query(sqlquery, [array_eliminar], function (err, result) {
                            if (err) throw err;

                        });
                    }

                    if (array_imagenes_urls.length > 0) {

                        var data = []
                        for (var imagen of array_imagenes_urls) {
                            data.push(["generic_name", imagen])
                        }

                        var sqlquery = "INSERT INTO dbloupe.image (name, url) VALUES ?;";
                        con.query(sqlquery, [data], function (err, result) {
                            if (err) throw err;

                            var ids = []
                            var i = 0;
                            for (i = result.insertId; i < result.insertId + result.affectedRows; i++) {
                                ids.push([idAlbum, i]);
                            }

                            var sqlquery = "INSERT INTO album_has_image (idalbum, idimage) VALUES ?";
                            con.query(sqlquery, [ids], function (err, result) {
                                if (err) throw err;
                                return res.status(200).json({
                                    response: 'Guardado'
                                });
                            });

                        })
                    } else {
                        return res.status(200).json({
                            response: 'Guardado'
                        });
                    }




                });



            });

        }

    })(req, res, next);



});

router.delete('/album/delete/:idalbum', uploadAlbumFolder.array('file'), (req, res, next) => {

    var idalbum = req.params.idalbum;

    passport.authenticate('jwt', { session: false }, function (err, user, info) {


        var sqlquery = "SELECT * FROM dbloupe.user_has_album WHERE iduser=" + user.iduser + " AND idalbum=" + idalbum + ";";
        con.query(sqlquery, function (err, result) {
            if (err) throw err;

            if (result.length > 0) {

                var sqlquery = "DELETE FROM dbloupe.album WHERE idalbum=" + idalbum + ";";
                con.query(sqlquery, function (err, result) {
                    if (err) throw err;

                    return res.status(200).json({
                        response: 'Guardado'
                    });

                });
            } else {
                return res.status(500).json({
                    response: 'El album que quieres borrar no te pertenece'
                });
            }

        })

    })(req, res, next);

});


router.get('/albums/:iduser', function (req, res) {

    var idUser = req.params.iduser;

    var sqlquery = "SELECT * FROM dbloupe.image JOIN dbloupe.album_has_image ON album_has_image.idimage=image.idimage JOIN dbloupe.album ON album.idalbum=album_has_image.idalbum JOIN dbloupe.user_has_album ON dbloupe.user_has_album.idalbum = dbloupe.album.idalbum WHERE iduser=" + idUser + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
            res.setHeader('Content-Type', 'text/plain');

            devolverImagenes(res, result, idUser, () => {
                res.end();

            })

        } else {
            return res.status(500).json({
                response: 'Se ha producido un error'
            });
        }

    });
});

router.get('/album/:idalbum/:iduser', function (req, res) {

    var idalbum = req.params.idalbum;
    var idUser = req.params.iduser;

    var sqlquery = "SELECT * FROM dbloupe.image JOIN dbloupe.album_has_image ON album_has_image.idimage=image.idimage WHERE idalbum=" + idalbum + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
            res.setHeader('Content-Type', 'text/plain');

            return res.status(200).json(result);

            /*
            devolverImagenes(res, result, idUser, () => {
                res.end();
                //return res.status(200).json(result)

            })*/

        } else {
            return res.status(200).json({
                response: 'Se ha producido un error'
            });
        }

    });
});

router.get('/albumsids/:iduser', function (req, res) {

    var idUser = req.params.iduser;

    var sqlquery = "SELECT idalbum FROM dbloupe.user_has_album WHERE iduser=" + idUser + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            var ids = []
            for (var resultado of result) {
                ids.push(resultado.idalbum)
            }

            if (ids.length <= 0) {
                return res.status(200).json({
                    response: []
                });
            }

            var sqlquery = "SELECT * FROM dbloupe.album WHERE idalbum IN (?);";
            con.query(sqlquery, [ids], function (err, result) {
                if (err) throw err;

                return res.status(200).json({
                    response: result
                });

            });



        } else {
            return res.status(200).json({
                response: []
            });
        }

    });
});

router.get('/portfolios/:iduser', function (req, res) {

    var idUser = req.params.iduser;

    var sqlquery = "SELECT * FROM dbloupe.portfolio JOIN dbloupe.user_has_portfolio ON dbloupe.user_has_portfolio.idportfolio = dbloupe.portfolio.idportfolio WHERE iduser=" + idUser + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            return res.status(200).json({
                response: 'Guardado',
                data: result
            });

        } else {
            return res.status(200).json({
                response: 'Guardado'
            });
        }

    });
});

devolverImagenesPortfolio = function (res, result, idUser, callback) {
    var numeroImagenes = result.length;
    var index = 0;
    var dataArray = []


    for (var image of result) {
        (function (image) {
            var indexImagenEnPortfolio = image.name.split('_')[0]
            imageToBase64('../uploads/portfolio/' + idUser + '/' + image.name.substring(indexImagenEnPortfolio.length + 1))
                .then(
                    (data) => {
                        var imageName = image.name
                        var idportfolio = image.idportfolio
                        var portfolio_type = image.portfolio_type
                        dataArray.push({ imageName, idportfolio, portfolio_type, data, indexImagenEnPortfolio })
                        index++;
                        if (index == numeroImagenes) {
                            res.write(JSON.stringify(dataArray), 'UTF-8');
                            callback();
                        }
                    }
                )
                .catch(
                    (error) => {
                    }
                )

        })(image)

    }
}


devolverImagenes = function (res, result, idUser, callback) {
    var numeroImagenes = result.length;
    var index = 0;
    var dataArray = []

    for (var image of result) {
        (function (image) {
            imageToBase64('../uploads/album/' + idUser + '/' + image.name)
                .then(
                    (data) => {
                        var imageName = image.name
                        var albumName = image.album_name
                        var album_description = image.album_description
                        var album_styles = image.album_styles
                        var album_labels = image.album_labels
                        var idalbum = image.idalbum
                        var labels = image.labels
                        var album_type = image.album_type
                        dataArray.push({ idalbum, albumName, album_description, album_styles, album_labels, imageName, data, labels, album_type })
                        index++;
                        if (index == numeroImagenes) {
                            res.write(JSON.stringify(dataArray), 'UTF-8');
                            callback();
                        }
                    }
                )
                .catch(
                    (error) => {
                    }
                )

        })(image)

    }
}

router.get('/imagetypes/:typeid', function (req, res) {

    var typeid = req.params.typeid;

    var sqlquery = "SELECT * FROM dbloupe.freelancer WHERE idfreelancer=" + typeid + ";";
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
            res.setHeader('Content-Type', 'text/plain');

            devolverImagenesFreelancer(res, result, () => {
                res.end();
            })

        }

    });
});



devolverImagenesFreelancer = function (res, result, callback) {

    var index = 0;
    var dataArray = []

    const path = require('path');
    const fs = require('fs');
    const directoryPath = path.join(__dirname, '../uploads/album/' + result[0].name + "/");
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
        }

        var numeroImagenes = files.length;

        for (var imageName of files) {
            (function (imageName) {
                imageToBase64('../uploads/album/' + result[0].name + '/' + imageName)
                    .then(
                        (data) => {

                            dataArray.push({ imageName, data })
                            index++;
                            if (index == numeroImagenes) {
                                res.write(JSON.stringify(dataArray), 'UTF-8');
                                callback();
                            }
                        }
                    )
                    .catch(
                        (error) => {
                        }
                    )

            })(imageName)

        }

    });


}

router.get('/imagestyles/', passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var idfreelancer = req.query.idfreelancer;
    var tipo = req.query.tipo;

    var sqlquery = "SELECT * FROM dbloupe.image JOIN dbloupe.album_has_image ON album_has_image.idimage=image.idimage JOIN dbloupe.album ON album.idalbum=album_has_image.idalbum JOIN dbloupe.freelancer_has_album ON dbloupe.freelancer_has_album.idalbum = dbloupe.album.idalbum WHERE idfreelancer=" + idfreelancer + " AND album_type='" + tipo + "';"
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
            res.setHeader('Content-Type', 'text/plain');

            devolverImagenesAlbumFreelancer(res, result, tipo, () => {
                res.end();
            })

        }

    });


});




router.get('/imagestyles2/', passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var tipo = req.query.tipoImagenesSeleccionado
    var areas_seleccionadas = req.query.areas_seleccionadas

    var sqlquery = "SELECT * FROM dbloupe.album WHERE album_type LIKE '%" + tipo + "%';"
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {

            var puntuacionAlbumes = []
            var puntuacionSum = 0
            for (var album of result) {
                var puntuacionyalbum = { album: album, puntuacion: 0 }
                for (var area_seleccionada of areas_seleccionadas) {
                    if (album.album_labels.includes(area_seleccionada)) {

                        puntuacionyalbum.puntuacion = puntuacionyalbum.puntuacion + 1;
                        puntuacionSum = puntuacionSum + 1;
                    }

                }
                puntuacionAlbumes.push(puntuacionyalbum)
            }

            var albumesSorted = Object.keys(puntuacionAlbumes).map(function (key) {
                return puntuacionAlbumes[key];
            }).sort(function (itemA, itemB) {
                return itemA.puntuacion > itemB.puntuacion ? -1 : 1;
            });

            var index = 0
            var maxIndex = 8 
            var idsAlbumesSeleccionados = []
            for (var albumSorted of albumesSorted) {

                idsAlbumesSeleccionados.push(albumSorted.album.idalbum)
                index = index + 1
                if (index >= maxIndex) {
                    break;
                }
            }
            var sqlquery = "SELECT user.iduser, user.name, user.email, user_has_album.*, album.idalbum, album.album_name, album_has_image.*, image.idimage, image.url FROM user JOIN user_has_album ON user.iduser=user_has_album.iduser JOIN album ON user_has_album.idalbum=album.idalbum JOIN album_has_image ON album.idalbum=album_has_image.idalbum JOIN image ON album_has_image.idimage=image.idimage WHERE album.idalbum IN (?);"
            con.query(sqlquery, [idsAlbumesSeleccionados], function (err, result) {
                if (err) throw err;

                if (result.length > 0) {

                    var resultadosElegidos = []
                    for (var albumSorted of albumesSorted) {
                        var proporcion = Math.round(albumSorted.puntuacion / puntuacionSum * 8);
                        var index = 0;
                        for (var resultado of result) {
                            if (resultado.idalbum == albumSorted.album.idalbum) {
                                resultadosElegidos.push(resultado)
                                index = index + 1;
                            }

                            if (index >= proporcion) {
                                break;
                            }
                        }

                    }

                    if (resultadosElegidos.length > 8) { 
                        resultadosElegidos.splice(8, resultadosElegidos.length)
                    }

                    res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
                    res.setHeader('Content-Type', 'text/plain');

                    return res.status(200).json(resultadosElegidos);

                    /*
                    res.setHeader('Content-Disposition', 'attachment; filename=your_file_name');
                    res.setHeader('Content-Type', 'text/plain');

                    devolverImagenesAlbumFreelancer(res, result, tipo, () => {
                        res.end();
                    })*/

                }

            });

        } else {
            return res.status(200).json({
                response: 'Guardado'
            });
        }


    });



});

router.get('/finalstyles/', passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var tipo = req.query.tipo;
    var etiquetasFinales = req.query.estilosFinales

    var dictPesos = new Object();
    for (var etiqueta of etiquetasFinales) {
        if (dictPesos[etiqueta] == NaN || dictPesos[etiqueta] == undefined)
            dictPesos[etiqueta] = 0
        dictPesos[etiqueta] = dictPesos[etiqueta] + 1
    }

    var dictLength = Object.keys(dictPesos).length
    for (const [key, value] of Object.entries(dictPesos)) {
        dictPesos[key] = dictPesos[key] / dictLength
    }

    var sqlquery = "SELECT * FROM dbloupe.image JOIN dbloupe.album_has_image ON album_has_image.idimage=image.idimage JOIN dbloupe.album ON album.idalbum=album_has_image.idalbum JOIN dbloupe.user_has_album ON dbloupe.user_has_album.idalbum = dbloupe.album.idalbum WHERE album_type='" + tipo + "';"
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
           
            var dict = new Object();
            for (var imagen of result) {

                var arrayLabelsImagen = JSON.parse(imagen.labels)
                for (var label of arrayLabelsImagen) {
                    for (var labelFinal of etiquetasFinales) {
                        if (label == labelFinal) {
                            if (dict['{"pareja":{"iduser": "' + imagen.iduser + '", "idalbum": "' + imagen.idalbum + '", "label": "' + labelFinal + '"}}'] == undefined)
                                dict['{"pareja":{"iduser": "' + imagen.iduser + '", "idalbum": "' + imagen.idalbum + '", "label": "' + labelFinal + '"}}'] = 0

                            dict['{"pareja":{"iduser": "' + imagen.iduser + '", "idalbum": "' + imagen.idalbum + '", "label": "' + labelFinal + '"}}'] += 1
                        }
                    }
                }
            }

            for (const [key1, value1] of Object.entries(dict)) {
                var keyJson = JSON.parse(key1)
                for (const [key2, value2] of Object.entries(dictPesos)) {
                    if (keyJson.pareja.label == key2)
                        dict[key1] = dict[key1] * dictPesos[key2]
                }
            }

            var dictFinal = new Object();
            for (const [key, value] of Object.entries(dict)) {
                var keyJson = JSON.parse(key)
                if (dictFinal[keyJson.pareja.idalbum] == undefined)
                    dictFinal[keyJson.pareja.idalbum] = 0
                dictFinal[keyJson.pareja.idalbum] += value
            }

            var clausule = "";
            clausule = "(";

            for (const [key, value] of Object.entries(dictFinal)) {
                clausule += parseInt(key) + ",";
            }
            clausule = clausule.slice(0, -1);
            clausule += ")";


            var sqlquery = "SELECT * FROM dbloupe.user JOIN dbloupe.user_has_album ON user_has_album.iduser=user.iduser WHERE idalbum IN " + clausule + ";"
            con.query(sqlquery, function (err, result) {
                if (err) throw err;

            });


        }

    });



});

router.get('/photographers/', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    var categoria = req.query.categoria
    var tipo = req.query.tipoImagenesSeleccionado
    var areas_seleccionadas = JSON.parse(req.query.areas_seleccionadas)
    var estilosSeleccionados = JSON.parse(req.query.estilosSeleccionados)
    var selectedItemsCountries = JSON.parse(req.query.selectedItemsCountries)
    var selectedItemsProvinces = JSON.parse(req.query.selectedItemsProvinces)

    var estilosFinales = []
    for(var estilo1 of estilosSeleccionados['1']){
        estilosFinales.push(estilo1)
    }for(var estilo2 of estilosSeleccionados['2']){
        estilosFinales.push(estilo2)
    }for(var estilo3 of estilosSeleccionados['3']){
        estilosFinales.push(estilo3)
    }

    var dictPesos = new Object();
    for (var etiqueta of estilosFinales) {
        if (dictPesos[etiqueta] == NaN || dictPesos[etiqueta] == undefined)
            dictPesos[etiqueta] = 0
        dictPesos[etiqueta] = dictPesos[etiqueta] + 1
    }

    var dictLength = Object.keys(dictPesos).length
    for (const [key, value] of Object.entries(dictPesos)) {
        dictPesos[key] = dictPesos[key] / dictLength
    }


    var sqlquery = "SELECT * FROM dbloupe.image JOIN dbloupe.album_has_image ON album_has_image.idimage=image.idimage JOIN dbloupe.album ON album.idalbum=album_has_image.idalbum JOIN dbloupe.user_has_album ON dbloupe.user_has_album.idalbum = dbloupe.album.idalbum WHERE album_type LIKE '%" + tipo + "%';"
    con.query(sqlquery, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
        
            var dict = new Object();
            for (var imagen of result) {

                for (var estiloEscogido of imagen.album_styles.split(',')) {
                    for (var estiloAlbum of estilosFinales) {
                        if (estiloEscogido == estiloAlbum) {
                            if (dict['{"pareja":{"iduser": "' + imagen.iduser + '", "idalbum": "' + imagen.idalbum + '", "label": "' + estiloAlbum + '"}}'] == undefined)
                                dict['{"pareja":{"iduser": "' + imagen.iduser + '", "idalbum": "' + imagen.idalbum + '", "label": "' + estiloAlbum + '"}}'] = 0

                            dict['{"pareja":{"iduser": "' + imagen.iduser + '", "idalbum": "' + imagen.idalbum + '", "label": "' + estiloAlbum + '"}}'] += 1
                        }
                    }
                }
            }

            for (const [key1, value1] of Object.entries(dict)) {
                var keyJson = JSON.parse(key1)
                for (const [key2, value2] of Object.entries(dictPesos)) {
                    if (keyJson.pareja.label == key2)
                        dict[key1] = dict[key1] * dictPesos[key2]
                }
            }

            var dictFinal = new Object();
            for (const [key, value] of Object.entries(dict)) {
                var keyJson = JSON.parse(key)
                if (dictFinal[keyJson.pareja.idalbum] == undefined)
                    dictFinal[keyJson.pareja.idalbum] = 0
                dictFinal[keyJson.pareja.idalbum] += value
            }

            var clausule = "";


            for (const [key, value] of Object.entries(dictFinal)) {
                clausule += parseInt(key) + ",";
            }
            clausule = clausule.slice(0, -1);
            clausule += ")";


            var sqlquery = "SELECT * FROM dbloupe.user JOIN dbloupe.user_has_album ON user_has_album.iduser=user.iduser WHERE idalbum IN " + clausule + ";"
            con.query(sqlquery, function (err, result) {
                if (err) throw err;

                var raw_data = []
                for (var user of result) {
                    raw_data.push({ url: user.profile_image, iduser: user.iduser, name: user.name })
                }

                return res.status(200).json({
                    response: 'Guardado',
                    raw_data: raw_data
                });
    
                
            });


        }

    });

});



devolverImagenesAlbumFreelancer = function (res, result, tipo, callback) {

    var index = 0;
    var dataArray = []

    const path = require('path');
    const fs = require('fs');
    const directoryPath = path.join(__dirname, '../uploads/album/' + tipo + "/");
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
        }

        var numeroImagenes = files.length;

        for (var imageName of files) {
            (function (imageName) {
                imageToBase64('../uploads/album/' + tipo + '/' + imageName)
                    .then(
                        (data) => {

                            var labels = []
                            for (var imageDB of result) {
                                if (imageDB.name == imageName) {
                                    labels = imageDB.labels
                                }
                            }
                            dataArray.push({ imageName, data, labels })
                            index++;
                            if (index == numeroImagenes) {
                                res.write(JSON.stringify(dataArray), 'UTF-8');
                                callback();
                            }

                        }
                    )
                    .catch(
                        (error) => {
                        }
                    )

            })(imageName)

        }
    });
}

module.exports = {
    router: router,
    setConexion: setConexion
}
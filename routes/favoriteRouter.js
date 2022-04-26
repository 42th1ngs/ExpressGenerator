const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({user: req.user._id})
    .populate('User')
    .populate('Campsite')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorite => {
        if(favorite) {
            req.body.forEach(fav => {
                if (!favorite.campsites.includes(fav._id)) {
                    if (fav._id) {
                        favorite.campsites.push(fav._id)
                    }
                }
            });
            favorite.save()
            .then(favorite => {
                //res.statusCode = 200; don't need these with res.json
                //res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
        } else {
            Favorite.create({
                user: req.user._id,
                campsite: [req.params.campsiteId]
            })
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader ('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
        }
    });
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`Post operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({user: req.user._id})
    .then(favorite => {
        if(favorite) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        } else {
            err = new Error('Favorite not found');
            err.status = 404;
            return next(err);
        }
    })
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`Post operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne( {user: req.user._id} )
    .then(favorite => {
        if (favorite) {
            if (!favorite.campsite.includes(req.params.campsiteId)) {
                favorite.campsites.push({_id: req.params.campsiteId});
                favorite.save()
                .then(favorite => {
                    res.json(favorite);
                })
                .catch(err => next(err));
            } else {
                err = new Error('That campsite is already in the list of favorites!');
                err.status = 404;
                return next(err);
            }
        } else {
            Favorite.create({
                user: req.user._id,
                campsite: req.body
            })
            .then(favorite => {
                res.json(favorite);
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`Post operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne( {user: req.user._id} )
    .then(favorite => {
        if (favorite) {
            const campsiteIndex = favorite.campsites.indexOf(req.params.campsiteId);
            if(campsiteIndex !== -1) {
                favorite.campsites.splice(campsiteIndex, 1);
                favorite.save()
                .then(favorite => {
                    res.json(favorite);
                })
                .catch(err => next(err));
            } else {
                err = new Error('This campsite is not one of your favorites');
                err.status = 404;
                return next(err);
            }
        } else {
            err = new Error('There is no favorite to delete.');
                err.status = 404;
                return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = favoriteRouter;
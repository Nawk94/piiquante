//on importe le modèle des sauces et fs pour modifier les fichiers
const Sauce = require('../models/Sauce');

const fs = require('fs');
const { pluralize } = require('mongoose');


//création d'une sauce
exports.createSauce = (req, res, next) => {
    
    //on parse l'objet pour pouvoir exploiter les données
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject, imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
    });
    //on sauvegarde la nouvelle sauce 
    sauce.save()
    .then(() => res.status(201).json({message : 'Sauce sauvegardé'}))
    .catch(error => res.status(400).json({error}));
  };

//modification d'une sauce
exports.modifySauce = (req,res,next) => {
    // on vérifie si une image est présente
    const sauceObject = req.filename?{
        //si oui 
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body}; // si pas d'images on récup le "corps"

    
    delete sauceObject._userId;
   
    Sauce.findOne({_id:req.params.id})
    .then((sauce) => {
        
        if(sauce.userId != req.auth.userId) { 
            res.status(400).json({message: 'Action non autorisée'});
        } else { 
            Sauce.updateOne({_id: req.params.id},{...sauceObject,_id:req.params.id})
            .then(() => res.status(200).json({message: 'Sauce modifiée'}))
            .catch(error => res.status(401).json({error}));
        }
    })
    .catch((error) => {res.status(400).json({error})});
};

//suppresion d'une sauce 
exports.deleteSauce = (req,res,next) => {
    Sauce.findOne({_id : req.params.id})
    .then( sauce => { 
        if (sauce.userId != req.auth.userId) { 
            res.status(400).json({message: 'Action non autorisée'})
        } else { 
             const filename = sauce.imageUrl.split('/images/')[1];
             //on supprime l'image
             fs.unlink(`images/${filename}`, () => {
                //suppresion de la sauce de la base de donnée 
                Sauce.deleteOne({_id:req.params.id})
                .then(() => res.status(200).json({message: 'Sauce supprimée'}))
                .catch(error => res.status(401).json({error}));
             });
        }

    })
    .catch(error => res.status(500).json({error}));
  };

//récupération d'une sauce 
exports.findOneSauce = (req,res,next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};

//récupération de toutes les sauces
exports.findAllSauces = (req, res, next) => {
    Sauce.find()
    //le tableau des sauces
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
   };

// Les likes
exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            // Si pas encore voté et like
            if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId) && req.body.like === 1) {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: 1 }, $push: { usersLiked: req.body.userId } })
                    .then(() => res.status(201).json({ message: 'Vous aimez cette sauce' }))
                    .catch((error) => res.status(400).json({ error }));
            }

            // Si pas encore voté et dislike
            if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: 1 }, $push: { usersDisliked: req.body.userId } })
                    .then(() => res.status(201).json({ message: 'Vous n\'aimez pas cette sauce' }))
                    .catch((error) => res.status(400).json({ error }));
            }

            // Si n'aime plus
            if (sauce.usersLiked.includes(req.body.userId) && req.body.like === 0) {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { usersLiked: req.body.userId } })
                    .then(() => res.status(201).json({ message: 'Vous n\'aimez plus cette sauce' }))
                    .catch((error) => res.status(400).json({ error }));
            }

            // Si supprime le dislike
            if (sauce.usersDisliked.includes(req.body.userId) && req.body.like === 0) {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: req.body.userId } })
                    .then(() => res.status(201).json({ message: 'Merci d\'avoir modifié votre vote' }))
                    .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch((error) => res.status(400).json({ message: 'Vous ne pouvez pas voter plusieurs fois pour la même sauce' }));
};

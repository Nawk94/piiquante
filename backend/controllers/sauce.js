//on importe le modèle des sauces et fs pour modifier les fichiers
const Sauce = require('../models/Sauce');

const fs = require('fs');

const { pluralize } = require('mongoose');


//récupération de toutes les sauces
exports.findAllSauces = (req, res, next) => {
    Sauce.find()
    //le tableau des sauces
    .then(response => res.status(200).json(response))
    .catch(error => res.status(400).json({error}));
   };


//création d'une sauce
exports.createSauce = (req, res, next) => {
    
    //on parse l'objet pour pouvoir exploiter les données
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        likes : 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked : [],
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
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
        if (sauce.userId !== req.auth.userId) { 
            res.status(403).json({message: 'Action non autorisée'})
        } else { 
             const filename = sauce.imageUrl.split("/").at[-1];
             //on supprime l'image
             fs.unlink(`images/${filename}`, () => {
                //suppresion de la sauce de la base de donnée 
                Sauce.deleteOne({_id:req.params.id})
                .then(() => res.status(200).json({message: 'Sauce supprimée'}))
                .catch(error => res.status(400).json({error}));
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


   //les likes 
exports.likeSauce = (req,res,next) => {
        console.log(req.body);
    Sauce.findOne({_id:req.params.id})
    .then(sauce => {
        if (req.body.like === 1) {
            if (sauce.usersLiked.includes(req.body.userId)) {
                res.status(401).json({error: 'Vous aimez déjà cette sauce'});
            } else {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: req.body.like++ }, $push: { usersLiked: req.body.userId } })
                    .then(() => res.status(200).json({ message: 'Vous aimez cette sauce' }))
                    .catch(error => res.status(400).json({ error }))
            }
        } 
        else if (req.body.like === -1) {
            if (sauce.usersDisliked.includes(req.body.userId)) {
                res.status(401).json({error: 'Vous ne pouver pas voter plusieurs fois pour la même sauce'});
            } else {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: (req.body.like++) * -1 }, $push: { usersDisliked: req.body.userId } })
                    .then(() => res.status(200).json({ message: 'Vous n\'aimez pas cette sauce' }))
                    .catch(error => res.status(400).json({ error }));
            }
        } else {
            if (sauce.usersLiked.includes(req.body.userId)) {
                Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
                    .then(() => { res.status(200).json({ message: 'Vous n\'aimez plus cette sauce' }) })
                    .catch(error => res.status(400).json({ error }));
            } else if (sauce.usersDisliked.includes(req.body.userId)) {
                Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                        .then(() => { res.status(200).json({ message: 'Merci d\'avoir modifié votre votre' }) })
                        .catch(error => res.status(400).json({ error }));
            }
        }
    })
    .catch(error => res.status(400).json({ error }));   
};
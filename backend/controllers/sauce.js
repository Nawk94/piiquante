//On importe le modèle des sauces et fs pour modifier les fichiers
const Sauce = require('../models/Sauce');

const fs = require('fs');



//Récupération de toutes les sauces
exports.findAllSauces = (req, res, next) => {
    Sauce.find()
    //Le tableau des sauces
    .then(response => res.status(200).json(response))
    .catch(error => res.status(400).json({error}));
   };


//Création d'une sauce
exports.createSauce = (req, res, next) => {
    
    //On "parse" l'objet pour pouvoir exploiter les données
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
    //On sauvegarde la nouvelle sauce 
    sauce.save()
    .then(() => res.status(201).json({message : 'Sauce sauvegardé'}))
    .catch(error => res.status(400).json({error}));
  };

  //Modification d'une sauce
exports.modifySauce = (req,res,next) => {
    //On vérifie si une image est présente
    const sauceObject = req.filename?{
        //Si oui 
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body}; //Si pas d'images on use les données du body de la requête

    //On supprime la propriété 
    delete sauceObject._userId;
   
    Sauce.findOne({_id:req.params.id})
    .then((sauce) => {
        //On vérifie si l'user peut modifier la sauce
        if(sauce.userId != req.auth.userId) { 
            res.status(400).json({message: 'Action non autorisée'});
        } else { 
            //Mise a jour de la base 
            Sauce.updateOne({_id: req.params.id},{...sauceObject,_id:req.params.id})
            .then(() => res.status(200).json({message: 'Sauce modifiée'}))
            .catch(error => res.status(401).json({error}));
        }
    })
    .catch((error) => {res.status(400).json({error})});
};

//Suppresion d'une sauce 
exports.deleteSauce = (req,res,next) => {
    Sauce.findOne({_id : req.params.id})
    .then( sauce => { 
        if (sauce.userId !== req.auth.userId) { 
            res.status(403).json({message: 'Action non autorisée'})
        } else { 
             const filename = sauce.imageUrl.split("/").at[-1];
             //On supprime l'image
             fs.unlink(`images/${filename}`, () => {
                //On supprime de la base de donnée 
                Sauce.deleteOne({_id:req.params.id})
                .then(() => res.status(200).json({message: 'Sauce supprimée'}))
                .catch(error => res.status(400).json({error}));
             });
        }

    })
    .catch(error => res.status(500).json({error}));
  };

//Récupération d'une sauce 
exports.findOneSauce = (req,res,next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};


   //Les likes 
   exports.likeSauce = (req, res, next) => {
    const likeValue = req.body.like; //Valeur possible : 1, -1, 0
    const userId = req.body.userId; //ID de l'user

    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (likeValue === 1) {
                //S'il aime déjà la sauce
                if (sauce.usersLiked.includes(userId)) {
                    res.status(401).json({ error: 'Vous aimez déjà cette sauce' });
                } else {
                    //S'il aime la sauce
                    //On ajoute son ID aux "liker"
                    sauce.usersLiked.push(userId); 
                    //On augmente les likes
                    sauce.likes++; 
                }
            } else if (likeValue === -1) {
                // S'il a déjà "disliker"
                if (sauce.usersDisliked.includes(userId)) {
                    res.status(401).json({ error: 'Vous ne pouvez pas voter plusieurs fois pour la même sauce' });
                } else {
                    //S'il n'aime pas la sauce
                    //On ajoute son ID aux "disliker"
                    sauce.usersDisliked.push(userId);
                    //On augmente les dislikes 
                    sauce.dislikes++; 
                }
            } else {
                // Annulation du like/dislike
                if (sauce.usersLiked.includes(userId)) {
                    //S'il annule son like
                    //On supprime son ID des "liker"
                    sauce.usersLiked.pull(userId);
                    //On réduit les likes
                    sauce.likes--; 
                } else if (sauce.usersDisliked.includes(userId)) {
                    //S'il annule son dislike
                    //On supprime son ID des "disliker" 
                    sauce.usersDisliked.pull(userId);
                    //On réduit les dislikes 
                    sauce.dislikes--; 
                }
            }

            // Mise à jour de la sauce dans la base de données
            sauce.save()
                .then(() => {
                    if (likeValue === 1) {
                        res.status(200).json({ message: 'Vous aimez cette sauce' });
                    } else if (likeValue === -1) {
                        res.status(200).json({ message: 'Vous n\'aimez pas cette sauce' });
                    } else {
                        res.status(200).json({ message: 'Votre changement d\'avis est bien pris en compte' });
                    }
                })
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};

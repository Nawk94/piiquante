// on importe user, le cryptage, le token 

const User = require('../models/User');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');



//fonction de création d'utilisateur
exports.signup = (req, res, next) => {
    User.findOne({ email: req.body.email })
      .then((existingUser) => {
        if (existingUser) {
          // Si un utilisateur est trouvé renvoyer une erreur indiquant que l'adresse e-mail existe déjà 
          console.log("Erreur : cet e-mail est déjà utilisé");
          return res
            .status(409)
            .json({ message: "cet e-mail est déjà utilisé" });
        }
        // on "hash" le mot de passe 
        bcrypt
          .hash(req.body.password, 10)
          .then((hash) => {
            // On créér le nouvel user avec ce que l'on a "hash"
            const user = new User({
              email: req.body.email,
              password: hash,
            });
            // On sauvegarde dans la base
            user
              .save()
              .then(() => {
                //On informe de la création
                console.log("Utilisateur créé !");
                res.status(201).json({ message: "Utilisateur créé !" });
              })
              .catch((error) => {
                // Si erreur de save
                console.log("Erreur de sauvegarde  :", error);
                res.status(400).json({ error });
              });
          })
          .catch((error) => {
            //si erreur de hash
            console.log("Erreur lors de hash  :", error);
            res.status(500).json({ error });
          });
      })
      .catch((error) => {
        //Si erreur de recherche 
        console.log("Erreur de recherche d'user existant :", error);
        res.status(500).json({ error });
      });
  };
  

//fonction de connection
exports.login = (req,res,next) => {
    //On recherche l'user avec son mail 
    User.findOne({email: req.body.email})
    .then(user => {
        if(!user) {
            //SI aucun user est trouvé 
            return res.status(401).json({message : 'Combinaison mot de passe/id incorrecte'});
        }
        //On compare le mot de passe entré avec le mot de passe "hash" de l'user 
        bcrypt.compare(req.body.password, user.password)
        .then(valid => {
            if(!valid) {
                //Si les mots de passes sont différent 
                return res.status(401).json({message: 'Combinaison mot de passe/id incorrecte'});
            }
            //Si ils correspondent on créer un token pour 24H
            res.status(200).json({
                userId: user._id,
                token: jwt.sign(
                    {userId: user._id},
                    `${process.env.TOKEN_S}`,
                    {expiresIn: '24h'}
                ),
            });
        })
        .catch(error => res.status(500).json({error}));
    })
     .catch(error => res.status(500).json({error}));
};
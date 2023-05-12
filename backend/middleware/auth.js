require('dotenv').config();
const jwt = require('jsonwebtoken');

//Fonction de décodage 
module.exports = (req,res,next) => {
    try{
        //On extrait le token 
        const token = req.headers.authorization.split(' ')[1];
        //On vérifie et on décode le token
        const decodedToken = jwt.verify(token, `${process.env.TOKEN_S}`);
        //On extrait l'ID de l'user à partir du token décodé
        const userId = decodedToken.userId;
        //On ajoute l'id de l'user à req.auth
        req.auth = {
            userId: userId
        };
        //On passe au middleware / controllers suivant 
        next();
    } catch(error) {
        res.status(401).json({error})
    };
};
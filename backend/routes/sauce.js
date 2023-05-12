//On importe express, middleware d'auth, multer pour les images et le modele des sauces 
const express = require('express');

const auth = require('../middleware/auth');

const multer = require('../middleware/multer-config');

const productCtrl = require('../controllers/sauce');


const router = express.Router();


//---------------------ROUTES-------------------------//

//Récupération de toutes les sauces 
router.get('/', auth, productCtrl.findAllSauces);

//Nouvelle sauce
router.post('/', auth, multer, productCtrl.createSauce);

//Modification
router.put('/:id', auth,multer,  productCtrl.modifySauce);

//Suppression 
router.delete('/:id', auth, productCtrl.deleteSauce);

//Récupération d'une sauce spécifique
router.get('/:id', auth, productCtrl.findOneSauce);

//Les likes 
router.post('/:id/like',auth , productCtrl.likeSauce);




module.exports = router;
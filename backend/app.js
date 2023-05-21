// import de express, mongoose, dotenv, du routeur et l'accès au chemin du serveur 

const express = require('express');

require('dotenv').config();

const mongoose = require('mongoose');

//pour gerer les chemins des fichiers
const path = require('path');

const productRoutes = require('./routes/sauce');

const userRoutes = require('./routes/user');

//.env => process.env.MAVA
//Connection à la base de données
mongoose.connect(process.env.F_VAR,
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));



//Création de l'application
const app = express();


//CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });


app.use(express.json());



app.use('/api/sauces', productRoutes);
app.use('/api/auth', userRoutes);
//Définition de la destination des images
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
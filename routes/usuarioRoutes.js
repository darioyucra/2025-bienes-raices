import express from 'express';
import { formularioLogin, autenticar, cerrarSesion, formularioRegistro, formularioOlvidePassword, registrar, confirmar, resetPassword, comprobarToken, nuevoPassword } from '../controllers/usuarioController.js';

const router = express.Router();

//Routing
router.get('/login', formularioLogin);
router.post('/login', autenticar);

//Cerrar sesión
router.post('/cerrar-sesion', cerrarSesion);

router.get('/registro', formularioRegistro);
router.post('/registro', registrar);

router.get('/confirmar/:token', confirmar)

router.get('/olvide-password', formularioOlvidePassword);
router.post('/olvide-password', resetPassword);

//Almacena el nuevo password
router.get('/olvide-password/:token', comprobarToken);
router.post('/olvide-password/:token', nuevoPassword);


/*router.route('/')
    .get(function(req,res) {
        res.send('Hola mundo en express')
    })
    .post(function(req,res) {
        res.json({msg: 'Respuesta de tipo post'})
    })*/ //Variante que se puede usar para agruparlas


export default router
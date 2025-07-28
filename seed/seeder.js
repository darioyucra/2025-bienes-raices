import { exit } from 'node:process'
import categorias from './categorias.js';
import precios from './precios.js';
import usuarios from './usuarios.js';
import db from '../config/db.js';
import { Categoria, Precio, Usuario} from '../models/index.js';

const importarDatos = async () => {
    try {
        //Autenticar
        await db.authenticate();

        //Generar las columnas
        await db.sync();

        //Insertamos los datos
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios),
            Usuario.bulkCreate(usuarios)
        ]);

        console.log('Datos importados correctamente');
        exit()//Esto quiere decir que se hizo bien, si le paso un 1 quiere decir que hubo un error
        
    } catch (error) {
        console.log(error);
        exit(1);
    }
}

const eliminarDatos = async () => {
    try {

        await Promise.all([
            /*Categoria.destroy({where: {}, truncate: true}),
            Precio.destroy({where: {}, truncate: true})*/ //---> se puede hacer de esta manera y lo hace uno por uno

            await db.sync({force: true}) //---> de esta forma elimina todo de una, es mejor si tengo muchos modelos y no quiero declarar uno por uno
        ]);
        console.log('Datos eliminados correctamente');
        exit()
        
    } catch (error) {
        console.log(error);
        exit(1);
    }
}

if(process.argv[2] === '-i') {
    importarDatos();
}

if(process.argv[2] === '-e') {
    eliminarDatos();
}
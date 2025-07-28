import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator';
import {Precio, Categoria, Propiedad, Mensaje, Usuario} from '../models/index.js';
import { esVendedor, formatearFecha } from '../helpers/index.js';

const admin = async (req, res) => {

    //Leer queryString
    const { pagina: paginaActual } = req.query;

    const expresion = /^[1-9]$/;

    if(!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1');
    }

    try {
        const { id } = req.usuario;
        
        //Limites y offset para el paginador
        const limit = 10;
        const offset = ((paginaActual * limit) - limit );

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit: limit,
                offset: offset,
                where: {
                    usuarioId: id
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'}
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })
        ])
        
        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            propiedades: propiedades, //como se llaman igual, puedo poner solamente propiedades
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
        })
    } catch (error) {
        console.log(error);
    }
}

//Formulario para crear una nueva propiedad
const crear = async (req, res) => {
    //Consultar modelo de precios y categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias: categorias,
        precios: precios,
        datos: {}
    })
}

const guardar = async (req, res) => {


    //Validación
    let resultado = validationResult(req);
    //Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {

        //Consultar modelo de precios y categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        //Errores
        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias: categorias,
            precios: precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    //Crear un registro

    const { titulo, descripcion, categoria: categoriaId, precio: precioId, habitaciones, estacionamiento, wc, calle, lat, lng } = req.body;

    const { id: usuarioId} = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo: titulo,
            descripcion: descripcion,
            categoriaId: categoriaId,
            precioId: precioId,
            habitaciones: habitaciones,
            estacionamiento: estacionamiento,
            wc: wc,
            calle: calle,
            lat: lat,
            lng: lng,
            imagen: '',
            usuarioId: usuarioId,
            imagen: ''

        })

        const { id } = propiedadGuardada;
        res.redirect(`/propiedades/agregar-imagen/${id}`)
        
    } catch (error) {
        console.log(error);
    }
}

const agregarImagen = async (req, res) => {

    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }


    //Validar que la propiedad no este publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades');
    }


    //Validar que la propiedad pertenece a quien visita esta pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades');
    }

    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad: propiedad
    })
}

const almacenarImagen = async (req, res, next) => {
    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }


    //Validar que la propiedad no este publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades');
    }


    //Validar que la propiedad pertenece a quien visita esta pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades');
    }

    try {
        //Almacenar la imagen y publicar la propiedad
        propiedad.imagen = req.file.filename;
        propiedad.publicado = 1;

        await propiedad.save();

        next()


    } catch (error) {
        console.log(error)
    }
}

const editar = async (req, res) => {

    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    //Revisar que quien visita la url, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }
    
     //Consultar modelo de precios y categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias: categorias,
        precios: precios,
        datos: propiedad
    })
}

const guardarCambios = async (req, res) => {

    //Verificar la validación
    let resultado = validationResult(req);
    //Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {

        //Consultar modelo de precios y categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias: categorias,
            precios: precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    //Reescribir el objeto y actualizarlo
    try {
        const { titulo, descripcion, categoria: categoriaId, precio: precioId, habitaciones, estacionamiento, wc, calle, lat, lng } = req.body;

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            categoriaId,
            precioId
        });

        await propiedad.save();

        res.redirect('/mis-propiedades');

    } catch (error) {
        console.log(error);
    }
}

const eliminar = async (req, res) => {

    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad pertenece a quien visita esta pagina
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }

    //Eliminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`);

    console.log(`Se elimino la imagen ${propiedad.imagen}`);

    //Eliminar la propiedad

    await propiedad.destroy();

    res.redirect('/mis-propiedades');


}

//Modifica el estado de la propiedad
const cambiarEstado = async (req,res) => {
    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad pertenece a quien visita esta pagina
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }

    //Actualizar
    propiedad.publicado = !propiedad.publicado;

    await propiedad.save();

    res.json({
        resultado: true
    })
}

//muestra una propiedad
const mostrarPropiedad = async (req, res) => {

    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio'},
            { model: Categoria, as: 'categoria'}
        ]
    });

    if(!propiedad || !propiedad.publicado) {
        return res.redirect('/404');
    }

    

    res.render('propiedades/mostrar', {
        propiedad: propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}

const enviarMensaje = async (req, res) => {

    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio'},
            { model: Categoria, as: 'categoria'}
        ]
    });

    if(!propiedad) {
        return res.redirect('/404');
    }

    //Renderizar los errores en caso de tenerlos

    //Validación
    let resultado = validationResult(req);
    //Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad: propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }

    const { mensaje } = req.body;
    const { id: propiedadId } = req.params;
    const { id: usuarioId } = req.usuario;

    //Almacenar mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })


    /*res.render('propiedades/mostrar', {
        propiedad: propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        enviado: true
    })*/

    res.redirect('/')

}

//Leer mensajes recibidos

const verMensajes = async (req, res) => {

    const { id } = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes',
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
             }
        ]
    });

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad pertenece a quien visita esta pagina
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}
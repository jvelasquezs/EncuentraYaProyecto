const Comercio = require('../models/Comercio');

// Obtener todos los comercios registrados
const obtenerComercios = async (req, res) => {
    try {
        const comercios = await Comercio.find();
        res.status(200).json(comercios);
    } catch (error) {
        res.status(500).json({ error: 'Error interno en el servidor de Antigravity.' });
    }
};

// Registrar un nuevo comercio georreferenciado
const crearComercio = async (req, res) => {
    try {
        const { nombre, descripcion, plataformas, monedas, latitud, longitud } = req.body;

        const nuevoComercio = new Comercio({
            nombre,
            descripcion,
            plataformas,
            monedas,
            ubicacion: {
                type: 'Point',
                coordinates: [parseFloat(longitud), parseFloat(latitud)]
            }
        });

        await nuevoComercio.save();
        res.status(201).json({ mensaje: '¡Comercio registrado con éxito!', comercio: nuevoComercio });
    } catch (error) {
        res.status(400).json({ error: 'Error en la estructura de los datos geométricos.' });
    }
};

module.exports = {
    obtenerComercios,
    crearComercio
};
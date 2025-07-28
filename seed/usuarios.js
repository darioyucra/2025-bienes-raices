import bcrypt from 'bcrypt';
const usuarios = [
    {
        nombre: 'Dario',
        email: 'yucradario95@gmail.com',
        confirmado: 1,
        password: bcrypt.hashSync('Seferina1!',10)
    }
]

export default usuarios;
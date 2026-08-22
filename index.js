const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11) {
        return false;
    }

    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }

    let resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) {
        resto = 0;
    }

    if (resto !== parseInt(cpf.charAt(9))) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) {
        resto = 0;
    }

    if (resto !== parseInt(cpf.charAt(10))) {
        return false;
    }

    return true;
}

exports.handler = async (event) => {

    console.log('EVENT RECEBIDO:');
    console.log(JSON.stringify(event, null, 2));

    try {

        let body;

        if (event.body) {
            body =
                typeof event.body === 'string'
                    ? JSON.parse(event.body)
                    : event.body;
        } else {
            body = event;
        }

        const cpf = body.cpf;

        if (!cpf) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'CPF é obrigatório'
                })
            };
        }

        if (!validarCPF(cpf)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'CPF inválido'
                })
            };
        }

        const result = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                documento,
                status
            FROM clientes
            WHERE documento = $1
              AND tipo_documento = 'CPF'
            LIMIT 1
            `,
            [cpf]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: 'Cliente não encontrado'
                })
            };
        }

        const cliente = result.rows[0];

        if (!cliente.status) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    message: 'Cliente inativo'
                })
            };
        }

        const token = jwt.sign(
            {
                id: cliente.id,
                cpf: cliente.documento,
                nome: cliente.nome
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            }
        );

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: token,
                token_type: 'Bearer',
                expires_in: process.env.JWT_EXPIRES_IN || '24h',
                cliente: {
                    id: cliente.id,
                    nome: cliente.nome,
                    cpf: cliente.documento
                }
            })
        };

    } catch (error) {

        console.error('ERRO NA EXECUÇÃO:');
        console.error(error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Erro interno',
                error: error.message
            })
        };
    }
};
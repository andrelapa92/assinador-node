import axios from "axios";

async function getCNPJInfo(cnpj) {
    try {
        const response = await axios.get(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
        if (response.data && response.data.status === 'OK') {
            return response.data; // Dados retornados da API
        } else {
            throw new Error('CNPJ não encontrado ou inválido.');
        }
    } catch (error) {
        console.error('Erro ao consultar CNPJ:', error.message);
        throw new Error('Erro na consulta ao CNPJ');
    }
}

export default {
    getCNPJInfo
}
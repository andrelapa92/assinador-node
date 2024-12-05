/**
 * Função para limpar caracteres especiais do CNPJ.
 * @param {string} cnpj - O CNPJ a ser limpo.
 * @returns {string} - O CNPJ limpo, sem caracteres especiais.
 */
function cleanCNPJ(cnpj) {
    return cnpj.replace(/[^\d]/g, ''); // Remove tudo que não for número
}

export default {
    cleanCNPJ
}
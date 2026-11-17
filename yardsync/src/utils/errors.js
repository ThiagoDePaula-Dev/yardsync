// Erro "esperado" com código HTTP (400, 401, 404...). O handler de erros transforma em resposta JSON.
class HttpError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = { HttpError };

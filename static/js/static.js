/**
 * script.js
 * -------------------------------------------------------------------------
 * Responsável por:
 *  1) Capturar os cliques nos botões da calculadora.
 *  2) Montar a expressão (número -> operador -> número) e mostrá-la no visor.
 *  3) Quando o usuário pede o resultado ("="), chamar a API Flask (app.py)
 *     via fetch(), enviando a operação escolhida e os números envolvidos.
 *  4) Exibir o resultado (ou uma mensagem de erro) devolvido pelo back-end.
 *
 * IMPORTANTE: este arquivo NÃO faz nenhuma conta sozinho (soma, divisão etc).
 * Toda a matemática acontece em Python (calculadora.py), no servidor.
 * O JavaScript só monta a "pergunta" e mostra a "resposta" que vem da API.
 */

// -----------------------------------------------------------------------
// Referências aos elementos da página que vamos manipular.
// -----------------------------------------------------------------------
const visorEl = document.getElementById("visor");
const expressaoEl = document.getElementById("expressao");
const mensagemErroEl = document.getElementById("mensagem-erro");
const botoes = document.querySelectorAll(".btn");

// -----------------------------------------------------------------------
// Estado da calculadora (guardado em memória, no próprio JavaScript).
// -----------------------------------------------------------------------
// 'valorAtual'    -> string que está sendo digitada/exibida no visor agora.
// 'valorAnterior' -> número guardado quando o usuário escolhe um operador
//                    (ex: ao clicar em "+", guardamos o primeiro número aqui).
// 'operadorAtual' -> qual operação foi escolhida ('soma', 'subtracao', etc.)
// 'aguardandoNovoNumero' -> true logo após escolher um operador, indica que
//                    o próximo dígito clicado deve começar um número novo,
//                    em vez de continuar concatenando no valor antigo.
let valorAtual = "0";
let valorAnterior = null;
let operadorAtual = null;
let aguardandoNovoNumero = false;

// Mapeia o identificador interno da operação para o símbolo mostrado
// na linha de expressão (ex: 'soma' -> '+').
const SIMBOLOS = {
    soma: "+",
    subtracao: "−",
    multiplicacao: "×",
    divisao: "÷",
    porcentagem: "%",
};

/**
 * Atualiza o texto exibido no visor principal, garantindo que o HTML
 * sempre reflita o estado atual armazenado nas variáveis JS.
 */
function atualizarVisor() {
    visorEl.textContent = valorAtual;
}

/**
 * Limpa qualquer mensagem de erro anterior. Chamada sempre que o usuário
 * inicia uma nova ação, para não deixar erros antigos "grudados" na tela.
 */
function limparMensagemErro() {
    mensagemErroEl.textContent = "";
}

/**
 * Reseta a calculadora para o estado inicial (equivalente a apertar "C").
 */
function limparTudo() {
    valorAtual = "0";
    valorAnterior = null;
    operadorAtual = null;
    aguardandoNovoNumero = false;
    expressaoEl.textContent = "";
    limparMensagemErro();
    atualizarVisor();
}

/**
 * Adiciona um dígito (ou o ponto decimal) ao número que está sendo digitado.
 * @param {string} digito - o caractere clicado ('0'-'9' ou '.').
 */
function digitarNumero(digito) {
    limparMensagemErro();

    // Se estávamos "aguardando um novo número" (porque o usuário acabou
    // de clicar em um operador), começamos do zero em vez de continuar
    // concatenando no número anterior.
    if (aguardandoNovoNumero) {
        valorAtual = "0";
        aguardandoNovoNumero = false;
    }

    if (digito === ".") {
        // Evita adicionar um segundo ponto decimal ao mesmo número.
        if (valorAtual.includes(".")) {
            return;
        }
        valorAtual += ".";
    } else if (valorAtual === "0") {
        // Substitui o "0" inicial em vez de virar "07", por exemplo.
        valorAtual = digito;
    } else {
        valorAtual += digito;
    }

    atualizarVisor();
}

/**
 * Remove o último caractere digitado (tecla "⌫").
 */
function apagarUltimoDigito() {
    limparMensagemErro();
    valorAtual = valorAtual.length > 1 ? valorAtual.slice(0, -1) : "0";
    atualizarVisor();
}

/**
 * Chamada quando o usuário clica em um operador (+, −, ×, ÷, %).
 * Guarda o valor atual como "valorAnterior" e marca que o próximo dígito
 * deve iniciar um número novo.
 * @param {string} operador - identificador interno da operação.
 */
function escolherOperador(operador) {
    limparMensagemErro();

    // Se o usuário já tinha escolhido um operador antes e digitou um novo
    // número, mas clicou em outro operador sem apertar "=", resolvemos a
    // conta pendente primeiro (permite encadear contas, ex: 5 + 3 + 2).
    if (operadorAtual !== null && !aguardandoNovoNumero) {
        calcularResultado(() => {
            valorAnterior = parseFloat(valorAtual);
            operadorAtual = operador;
            aguardandoNovoNumero = true;
            atualizarExpressao();
        });
        return;
    }

    valorAnterior = parseFloat(valorAtual);
    operadorAtual = operador;
    aguardandoNovoNumero = true;
    atualizarExpressao();
}

/**
 * Atualiza a linha de expressão (ex: "12 +") acima do visor principal,
 * mostrando o primeiro número e o operador escolhido.
 */
function atualizarExpressao() {
    if (valorAnterior === null || operadorAtual === null) {
        expressaoEl.textContent = "";
        return;
    }
    expressaoEl.textContent = `${valorAnterior} ${SIMBOLOS[operadorAtual]}`;
}

/**
 * Calcula a raiz quadrada do número atualmente exibido no visor,
 * chamando a API. É uma operação "unária" (usa só um número).
 */
async function calcularRaizQuadrada() {
    limparMensagemErro();
    const a = parseFloat(valorAtual);

    const resultado = await chamarApiCalculo("raiz", a, null);
    if (resultado !== null) {
        expressaoEl.textContent = `√(${a})`;
        valorAtual = formatarResultado(resultado);
        atualizarVisor();
        // Depois de calcular a raiz, reiniciamos os operandos, pois a
        // "conta" foi encerrada.
        valorAnterior = null;
        operadorAtual = null;
        aguardandoNovoNumero = true;
    }
}

/**
 * Executa a operação pendente (soma, subtração, etc.), chamando a API
 * com o valor anterior e o valor atual, e atualiza o visor com o
 * resultado devolvido pelo servidor Python.
 *
 * @param {Function} [aoFinalizar] - callback opcional executado depois
 *        que o resultado for calculado com sucesso (usado para encadear
 *        operações, como em "5 + 3 + 2").
 */
async function calcularResultado(aoFinalizar) {
    if (operadorAtual === null || valorAnterior === null) {
        return;
    }

    const a = valorAnterior;
    const b = parseFloat(valorAtual);

    const resultado = await chamarApiCalculo(operadorAtual, a, b);

    if (resultado !== null) {
        expressaoEl.textContent = `${a} ${SIMBOLOS[operadorAtual]} ${b} =`;
        valorAtual = formatarResultado(resultado);
        atualizarVisor();

        if (typeof aoFinalizar === "function") {
            aoFinalizar();
        } else {
            // Conta finalizada por "=": reseta os operandos, mas mantém
            // o resultado no visor para o usuário ver.
            valorAnterior = null;
            operadorAtual = null;
            aguardandoNovoNumero = true;
        }
    }
}

/**
 * Formata o número resultante antes de exibir no visor, removendo casas
 * decimais desnecessárias (ex: 10.0 -> "10") mas preservando decimais
 * relevantes (ex: 3.3333333333333335 -> "3.3333333333").
 * @param {number} numero
 * @returns {string}
 */
function formatarResultado(numero) {
    // Arredonda para no máximo 10 casas decimais para evitar problemas
    // de ponto flutuante (ex: 0.1 + 0.2 = 0.30000000000000004).
    const arredondado = Math.round((numero + Number.EPSILON) * 1e10) / 1e10;
    return arredondado.toString();
}

/**
 * Faz a chamada HTTP (fetch) para a API Flask, enviando a operação e os
 * números envolvidos, e devolve o resultado numérico (ou null em caso de
 * erro, já exibindo a mensagem de erro na tela).
 *
 * @param {string} operacao - 'soma' | 'subtracao' | 'multiplicacao' |
 *                             'divisao' | 'porcentagem' | 'raiz'
 * @param {number} a - primeiro número.
 * @param {number|null} b - segundo número (não usado na operação 'raiz').
 * @returns {Promise<number|null>}
 */
async function chamarApiCalculo(operacao, a, b) {
    try {
        const corpoRequisicao = { operacao, a };
        if (b !== null) {
            corpoRequisicao.b = b;
        }

        const resposta = await fetch("/api/calcular", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(corpoRequisicao),
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            // O servidor respondeu com um erro tratado (ex: divisão por
            // zero), cuja mensagem vem pronta no campo "erro".
            exibirErro(dados.erro || "Ocorreu um erro ao calcular.");
            return null;
        }

        return dados.resultado;
    } catch (erro) {
        // Erro de rede/conexão (ex: servidor Flask não está rodando).
        exibirErro("Não foi possível conectar ao servidor.");
        return null;
    }
}

/**
 * Exibe uma mensagem de erro abaixo dos botões.
 * @param {string} texto
 */
function exibirErro(texto) {
    mensagemErroEl.textContent = texto;
}

// -----------------------------------------------------------------------
// Registro dos eventos de clique em cada botão.
// -----------------------------------------------------------------------
// Em vez de escrever um "addEventListener" para cada botão individualmente,
// percorremos todos os botões e decidimos o que fazer com base nos atributos
// "data-*" definidos no HTML (data-numero, data-operador, data-acao).
// Essa abordagem é conhecida como "event delegation por atributos".
botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
        const numero = botao.dataset.numero;
        const operador = botao.dataset.operador;
        const acao = botao.dataset.acao;

        if (numero !== undefined) {
            digitarNumero(numero);
        } else if (operador !== undefined) {
            escolherOperador(operador);
        } else if (acao === "limpar") {
            limparTudo();
        } else if (acao === "apagar") {
            apagarUltimoDigito();
        } else if (acao === "raiz") {
            calcularRaizQuadrada();
        } else if (acao === "igual") {
            calcularResultado();
        }
    });
});

// -----------------------------------------------------------------------
// Suporte ao teclado físico, para melhorar a usabilidade em desktop.
// -----------------------------------------------------------------------
document.addEventListener("keydown", (evento) => {
    const tecla = evento.key;

    if (/^[0-9]$/.test(tecla)) {
        digitarNumero(tecla);
    } else if (tecla === ".") {
        digitarNumero(".");
    } else if (tecla === "+") {
        escolherOperador("soma");
    } else if (tecla === "-") {
        escolherOperador("subtracao");
    } else if (tecla === "*") {
        escolherOperador("multiplicacao");
    } else if (tecla === "/") {
        evento.preventDefault(); // evita abrir a busca rápida do navegador
        escolherOperador("divisao");
    } else if (tecla === "%") {
        escolherOperador("porcentagem");
    } else if (tecla === "Enter" || tecla === "=") {
        evento.preventDefault();
        calcularResultado();
    } else if (tecla === "Backspace") {
        apagarUltimoDigito();
    } else if (tecla === "Escape") {
        limparTudo();
    }
});

// Inicializa o visor assim que a página carrega.
atualizarVisor();

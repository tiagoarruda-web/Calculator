"""
app.py
----------------
Servidor web feito com Flask. É a "ponte" entre o front-end (HTML/CSS/JS,
rodando no navegador) e a lógica de cálculo em Python (calculadora.py).

Fluxo geral de uma operação:
    1) O usuário clica nos botões no navegador.
    2) O JavaScript (static/js/script.js) monta a operação e faz uma
       requisição HTTP (fetch) para a rota "/api/calcular" deste servidor.
    3) Este servidor recebe a requisição, extrai os dados (operação, a, b),
       chama a função correspondente em calculadora.py e devolve o
       resultado (ou erro) em formato JSON.
    4) O JavaScript recebe essa resposta e atualiza o visor na tela.

Por que Flask?
    Flask é um micro-framework web em Python, leve e simples de configurar,
    ideal para uma API local pequena como esta. Ele nos dá:
        - Um servidor HTTP embutido (não precisa configurar nada externo).
        - Uma forma simples de definir rotas (endereços da API) com decorators.
        - Suporte nativo para servir arquivos estáticos (CSS/JS) e templates
          HTML (pasta "templates/").
"""

from flask import Flask, render_template, request, jsonify

# Importamos as funções de cálculo e a exceção customizada do nosso
# módulo de lógica pura (calculadora.py).
from calculadora import (
    somar,
    subtrair,
    multiplicar,
    dividir,
    porcentagem,
    raiz_quadrada,
    CalculadoraError,
)

# Cria a aplicação Flask. O parâmetro __name__ ajuda o Flask a localizar
# as pastas "templates/" e "static/" corretamente em relação a este arquivo.
app = Flask(__name__)

# Dicionário que mapeia o nome da operação (recebido do front-end em texto,
# ex: "soma") para a função Python correspondente. Isso evita um bloco
# gigante de "if/elif" e torna fácil adicionar novas operações no futuro:
# basta criar a função em calculadora.py e adicionar uma linha aqui.
OPERACOES_BINARIAS = {
    "soma": somar,
    "subtracao": subtrair,
    "multiplicacao": multiplicar,
    "divisao": dividir,
    "porcentagem": porcentagem,
}

# Operações que usam apenas UM número (ao contrário das binárias acima,
# que usam dois: "a" e "b").
OPERACOES_UNARIAS = {
    "raiz": raiz_quadrada,
}


@app.route("/")
def pagina_inicial():
    """
    Rota principal (GET /).

    Serve a página HTML da calculadora (templates/index.html), que por
    sua vez carrega o CSS e o JavaScript a partir da pasta "static/".
    """
    return render_template("index.html")


@app.route("/api/calcular", methods=["POST"])
def api_calcular():
    """
    Rota da API (POST /api/calcular).

    Recebe um JSON no corpo da requisição com o seguinte formato:

        Para operações binárias (soma, subtracao, multiplicacao,
        divisao, porcentagem):
            { "operacao": "soma", "a": 10, "b": 5 }

        Para operações unárias (raiz):
            { "operacao": "raiz", "a": 16 }

    Devolve um JSON de sucesso:
        { "resultado": 15 }

    Ou, em caso de erro (ex: divisão por zero, dados inválidos), devolve
    um JSON de erro junto com o código de status HTTP 400:
        { "erro": "Não é possível dividir por zero." }
    """
    dados = request.get_json(silent=True)

    # Validação básica: o corpo da requisição precisa ser um JSON válido.
    if dados is None:
        return jsonify({"erro": "Requisição inválida: corpo JSON ausente ou malformado."}), 400

    operacao = dados.get("operacao")
    valor_a = dados.get("a")
    valor_b = dados.get("b")  # pode ser None em operações unárias, como a raiz

    # Validação: o campo "operacao" precisa existir e ser uma das conhecidas.
    if operacao not in OPERACOES_BINARIAS and operacao not in OPERACOES_UNARIAS:
        return jsonify({"erro": f"Operação '{operacao}' não é suportada."}), 400

    # Validação: o campo "a" é sempre obrigatório.
    if valor_a is None:
        return jsonify({"erro": "O campo 'a' é obrigatório."}), 400

    try:
        if operacao in OPERACOES_UNARIAS:
            # Operações que usam apenas um número (ex: raiz quadrada).
            funcao = OPERACOES_UNARIAS[operacao]
            resultado = funcao(valor_a)
        else:
            # Operações que usam dois números (soma, subtração, etc.).
            if valor_b is None:
                return jsonify({"erro": "O campo 'b' é obrigatório para esta operação."}), 400

            funcao = OPERACOES_BINARIAS[operacao]
            resultado = funcao(valor_a, valor_b)

        return jsonify({"resultado": resultado})

    except CalculadoraError as erro:
        # Erros "esperados" e tratados dentro de calculadora.py (ex:
        # divisão por zero, raiz de número negativo, entrada inválida).
        # Devolvemos o texto do erro para o front-end mostrar ao usuário.
        return jsonify({"erro": str(erro)}), 400

    except Exception:
        # Qualquer outro erro inesperado (não deveria acontecer em uso
        # normal, mas é uma boa prática nunca deixar o servidor "explodir"
        # sem resposta para o front-end).
        return jsonify({"erro": "Erro interno ao processar o cálculo."}), 500


# Ponto de entrada: só executa o servidor de desenvolvimento do Flask se
# este arquivo for rodado diretamente com "python app.py".
if __name__ == "__main__":
    # debug=True reinicia o servidor automaticamente a cada alteração no
    # código e mostra mensagens de erro detalhadas — ótimo para
    # desenvolvimento local, mas deve ser desligado em produção.
    app.run(debug=True, port=5000)

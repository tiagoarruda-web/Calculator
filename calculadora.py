"""
calculadora.py
----------------
Este módulo contém toda a LÓGICA PURA da calculadora, ou seja, as funções
matemáticas que realizam os cálculos propriamente ditos.

A ideia de manter esse arquivo separado do servidor (app.py) é justamente
permitir que essa lógica possa ser testada, reaproveitada ou até importada
em outro projeto sem depender de Flask, HTML, ou qualquer outra camada de
interface. É o núcleo "puro" da aplicação.

Cada operação é implementada em sua própria função, com nome claro e
docstring explicando parâmetros, retorno e possíveis erros.
"""

import math


class CalculadoraError(Exception):
    """
    Exceção customizada usada para representar erros de cálculo
    (ex: divisão por zero, raiz de número negativo, entrada inválida).

    Usar uma exceção própria (em vez de deixar o Python levantar
    ValueError/ZeroDivisionError "crus") facilita capturar e tratar
    esses erros de forma padronizada lá no servidor (app.py).
    """
    pass


def _validar_numero(valor, nome_parametro="valor"):
    """
    Função auxiliar (privada, por isso o "_" no início do nome) que garante
    que o valor recebido é um número (int ou float) válido.

    Isso evita, por exemplo, que uma string, None, ou um valor NaN
    quebre os cálculos mais adiante de forma inesperada.

    Parâmetros:
        valor: o valor a ser validado.
        nome_parametro (str): nome do parâmetro, usado apenas para
            deixar a mensagem de erro mais clara.

    Levanta:
        CalculadoraError: se o valor não for um número válido.
    """
    if isinstance(valor, bool):
        # bool é subclasse de int em Python (True == 1, False == 0),
        # então precisamos barrar explicitamente para não aceitar
        # True/False como se fossem números "de verdade".
        raise CalculadoraError(f"O parâmetro '{nome_parametro}' não pode ser booleano.")

    if not isinstance(valor, (int, float)):
        raise CalculadoraError(f"O parâmetro '{nome_parametro}' deve ser um número.")

    if isinstance(valor, float) and (math.isnan(valor) or math.isinf(valor)):
        raise CalculadoraError(f"O parâmetro '{nome_parametro}' é inválido (NaN ou infinito).")

    return valor


def somar(a, b):
    """
    Realiza a soma de dois números: a + b

    Parâmetros:
        a (int|float): primeira parcela.
        b (int|float): segunda parcela.

    Retorna:
        float: resultado da soma.
    """
    a = _validar_numero(a, "a")
    b = _validar_numero(b, "b")
    return a + b


def subtrair(a, b):
    """
    Realiza a subtração de dois números: a - b

    Parâmetros:
        a (int|float): minuendo.
        b (int|float): subtraendo.

    Retorna:
        float: resultado da subtração.
    """
    a = _validar_numero(a, "a")
    b = _validar_numero(b, "b")
    return a - b


def multiplicar(a, b):
    """
    Realiza a multiplicação de dois números: a * b

    Parâmetros:
        a (int|float): primeiro fator.
        b (int|float): segundo fator.

    Retorna:
        float: resultado da multiplicação.
    """
    a = _validar_numero(a, "a")
    b = _validar_numero(b, "b")
    return a * b


def dividir(a, b):
    """
    Realiza a divisão de dois números: a / b

    Trata especificamente o erro de DIVISÃO POR ZERO, que é um dos
    erros mais comuns em calculadoras, levantando uma CalculadoraError
    com uma mensagem amigável em vez de deixar o ZeroDivisionError
    "estourar" sem tratamento.

    Parâmetros:
        a (int|float): dividendo.
        b (int|float): divisor.

    Retorna:
        float: resultado da divisão.

    Levanta:
        CalculadoraError: se b for igual a zero.
    """
    a = _validar_numero(a, "a")
    b = _validar_numero(b, "b")

    if b == 0:
        # Tratamento explícito do erro comum de divisão por zero.
        raise CalculadoraError("Não é possível dividir por zero.")

    return a / b


def porcentagem(a, b):
    """
    Calcula "a por cento de b", ou seja: (a / 100) * b

    Exemplo: porcentagem(10, 200) -> 10% de 200 -> 20.0

    Parâmetros:
        a (int|float): o percentual desejado (ex: 10 para 10%).
        b (int|float): o valor base sobre o qual o percentual será aplicado.

    Retorna:
        float: o valor correspondente ao percentual calculado.
    """
    a = _validar_numero(a, "a")
    b = _validar_numero(b, "b")
    return (a / 100) * b


def raiz_quadrada(a):
    """
    Calcula a raiz quadrada de um número: √a

    Trata o erro comum de tentar calcular a raiz quadrada de um número
    negativo, o que não é definido dentro do conjunto dos números reais.

    Parâmetros:
        a (int|float): número do qual se deseja extrair a raiz quadrada.

    Retorna:
        float: raiz quadrada de 'a'.

    Levanta:
        CalculadoraError: se 'a' for negativo.
    """
    a = _validar_numero(a, "a")

    if a < 0:
        # Tratamento explícito: raiz quadrada de número negativo
        # não é um número real.
        raise CalculadoraError("Não é possível calcular a raiz quadrada de um número negativo.")

    return math.sqrt(a)


# Bloco de teste manual: só é executado se rodarmos "python calculadora.py"
# diretamente (não é executado quando o módulo é importado por app.py).
# É útil para uma verificação rápida da lógica sem precisar subir o servidor.
if __name__ == "__main__":
    print("Testes rápidos da calculadora:")
    print("2 + 3 =", somar(2, 3))
    print("10 - 4 =", subtrair(10, 4))
    print("6 * 7 =", multiplicar(6, 7))
    print("20 / 4 =", dividir(20, 4))
    print("10% de 200 =", porcentagem(10, 200))
    print("raiz de 16 =", raiz_quadrada(16))

    try:
        dividir(5, 0)
    except CalculadoraError as erro:
        print("Erro esperado (divisão por zero):", erro)

    try:
        raiz_quadrada(-9)
    except CalculadoraError as erro:
        print("Erro esperado (raiz negativa):", erro)

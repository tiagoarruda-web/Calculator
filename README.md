# 🧮 Calculadora Python + Flask

Calculadora funcional completa, com back-end em Python (lógica dos cálculos)
integrado a um front-end em HTML, CSS e JavaScript via uma API Flask local.

## 📁 Estrutura do projeto

```
calculadora-python/
├── app.py                  # Servidor Flask: rotas da API e da página HTML
├── calculadora.py           # Lógica pura das operações matemáticas (Python)
├── requirements.txt          # Dependências do projeto
├── templates/
│   └── index.html            # Estrutura da interface da calculadora
└── static/
    ├── css/
    │   └── style.css         # Estilização (visor LCD, botões, responsivo)
    └── js/
        └── script.js          # Interatividade e chamadas à API (fetch)
```

## 🧠 Como a integração funciona

1. O Flask (`app.py`) serve a página `templates/index.html` na rota `/`.
2. O HTML carrega `static/css/style.css` e `static/js/script.js`.
3. Quando o usuário clica nos botões, o `script.js` monta a operação
   (ex: `10 + 5`) e envia uma requisição `POST` para `/api/calcular`,
   com um corpo JSON como:
   ```json
   { "operacao": "soma", "a": 10, "b": 5 }
   ```
4. O `app.py` recebe essa requisição, chama a função correspondente em
   `calculadora.py` (ex: `somar(10, 5)`) e devolve o resultado em JSON:
   ```json
   { "resultado": 15 }
   ```
5. Se ocorrer um erro tratado (ex: divisão por zero), a API devolve:
   ```json
   { "erro": "Não é possível dividir por zero." }
   ```
   e o `script.js` exibe essa mensagem abaixo dos botões.

Ou seja: **todo o cálculo acontece em Python, no servidor** — o
JavaScript só monta a pergunta e mostra a resposta.

## ▶️ Como rodar o projeto localmente

### Pré-requisitos
- Python 3.8 ou superior instalado.

### Passo 1 — Criar um ambiente virtual (recomendado)
```bash
python3 -m venv venv

# Ativar o ambiente virtual:
# Linux/Mac:
source venv/bin/activate
# Windows (PowerShell):
venv\Scripts\Activate.ps1
```

### Passo 2 — Instalar as dependências
```bash
pip install -r requirements.txt
```

### Passo 3 — Iniciar o servidor
```bash
python app.py
```
Você verá uma mensagem parecida com:
```
 * Running on http://127.0.0.1:5000
```

### Passo 4 — Abrir no navegador
Acesse **http://127.0.0.1:5000** no navegador. A calculadora estará
pronta para uso — basta clicar nos botões (ou usar o teclado físico:
números, `+ - * /`, `Enter` para igual, `Backspace` para apagar e `Esc`
para limpar).

## ✅ Operações suportadas
| Operação          | Botão | Observação                          |
|-------------------|:-----:|--------------------------------------|
| Soma              | `+`   | —                                     |
| Subtração         | `−`   | —                                     |
| Multiplicação     | `×`   | —                                     |
| Divisão           | `÷`   | Trata divisão por zero                |
| Porcentagem       | `%`   | `a % b` calcula "a% de b"             |
| Raiz quadrada     | `√`   | Trata número negativo                 |

## 🧪 Testando a lógica sem o servidor
O arquivo `calculadora.py` pode ser executado sozinho para rodar alguns
testes rápidos das funções, sem precisar subir o Flask:
```bash
python calculadora.py
```

## 🛠️ Tecnologias utilizadas
- **Python 3** — lógica de cálculo.
- **Flask** — servidor web e API REST local.
- **HTML5 / CSS3** — estrutura e estilo da interface.
- **JavaScript (Fetch API)** — interatividade e comunicação com o back-end.

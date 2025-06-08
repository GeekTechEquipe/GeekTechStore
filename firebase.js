// ==================== CONFIGURAÇÃO FIREBASE ====================
// Importações dos módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  child
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuração do projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAyM4-NvD8v9dY5AKkI3Z4kkf1QgAkixkU",
  authDomain: "geektechprojeto.firebaseapp.com",
  projectId: "geektechprojeto",
  storageBucket: "geektechprojeto.appspot.com",
  messagingSenderId: "562761476074",
  appId: "1:562761476074:web:2eb566d5384261c79cb493",
  measurementId: "G-XWEVBTCPZ3"
};

// Inicialização dos serviços Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Serviço de autenticação
const db = getDatabase(); // Serviço de banco de dados em tempo real
const provider = new GoogleAuthProvider(); // Provedor de autenticação do Google

// Variáveis globais
let carrinho = []; // Array para armazenar itens do carrinho
let usuarioAtual = null; // Armazena dados do usuário logado

// ==================== FUNÇÕES UTILITÁRIAS ====================
/**
 * Exibe mensagens temporárias para o usuário
 * @param {string} texto - Mensagem a ser exibida
 * @param {string} tipo - Tipo de mensagem ('sucesso' ou 'erro')
 */
function exibirMensagem(texto, tipo) {
  const msg = document.getElementById('mensagem');
  if (!msg) return;
  msg.textContent = texto;
  msg.className = `mensagem ${tipo}`;
  msg.classList.remove('oculto');
  setTimeout(() => msg.classList.add('oculto'), 4000); // Esconde após 4 segundos
}

// ==================== AUTENTICAÇÃO ====================
/**
 * Cadastra novo usuário com email e senha
 */
window.cadastrar = async function () {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    exibirMensagem('Cadastro realizado com sucesso!', 'sucesso');
    fecharModal();
  } catch (error) {
    exibirMensagem(`Erro ao cadastrar: ${error.message}`, 'erro');
  }
};

/**
 * Login com email e senha
 */
window.fazerLogin = async function () {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    exibirMensagem('Login realizado com sucesso!', 'sucesso');
    fecharModal();
  } catch (error) {
    exibirMensagem('Erro ao fazer login: Conta inexistente ou dados incorretos.', 'erro');
  }
};

/**
 * Login com conta Google
 */
window.loginComGoogle = async function () {
  try {
    await signInWithPopup(auth, provider);
    exibirMensagem('Login com Google realizado!', 'sucesso');
    fecharModal();
  } catch (error) {
    exibirMensagem(`Erro no login com Google: ${error.message}`, 'erro');
  }
};

// ==================== CARRINHO DE COMPRAS ====================
/**
 * Salva o carrinho no Firebase
 */
function salvarCarrinhoFirebase() {
  if (!usuarioAtual) return;
  set(ref(db, 'carrinhos/' + usuarioAtual.uid), carrinho);
}

/**
 * Carrega o carrinho do Firebase
 */
function carregarCarrinhoFirebase() {
  if (!usuarioAtual) return;
  get(child(ref(db), 'carrinhos/' + usuarioAtual.uid)).then(snapshot => {
    if (snapshot.exists()) {
      carrinho = snapshot.val();
      atualizarContadorVisual();
      atualizarCarrinhoModal();
    }
  });
}

/**
 * Adiciona item ao carrinho
 * @param {string} nome - Nome do produto
 * @param {number} preco - Preço do produto
 */
function adicionarAoCarrinho(nome, preco) {
  if (!usuarioAtual) {
    exibirMensagem("Você precisa estar logado para adicionar ao carrinho.", 'erro');
    return;
  }
  carrinho.push({ nome, preco });
  salvarCarrinhoFirebase();
  atualizarCarrinhoModal();
  atualizarContadorVisual();
}

/**
 * Atualiza o modal do carrinho com os itens atuais
 */
function atualizarCarrinhoModal() {
  const div = document.getElementById('cart-items');
  if (!div) return;
  
  if (carrinho.length === 0) {
    div.innerHTML = "<p style='color: white;'>Seu carrinho está vazio.</p>";
    return;
  }
  
  div.innerHTML = carrinho.map(item => `
    <div style="background:#2c2c2c; color:white; border-radius:6px; margin-bottom:10px; padding:10px;">
      <strong>${item.nome}</strong><br>
      <small>R$ ${item.preco.toFixed(2)}</small>
    </div>
  `).join('');
}

/**
 * Atualiza o contador visual de itens no carrinho
 */
function atualizarContadorVisual() {
  const contador = document.querySelector('.cart-text span');
  if (contador) {
    contador.textContent = `${carrinho.length} item${carrinho.length !== 1 ? 's' : ''}`;
  }
}

// ==================== OBSERVADOR DE AUTENTICAÇÃO ====================
/**
 * Monitora mudanças no estado de autenticação
 */
onAuthStateChanged(auth, (user) => {
  usuarioAtual = user;
  const loginBtn = document.getElementById('loginBtn');
  
  if (user) {
    // Usuário logado - atualiza interface
    const nome = user.displayName || user.email;
    if (loginBtn) {
      loginBtn.innerHTML = `
        <img src="images/1_5.svg" alt="Account Icon" class="nav-icon">
        <div class="nav-text">
          <span class="text-style-roboto-10-400">Bem-vindo</span>
          <strong class="text-style-roboto-13-700">${nome}</strong>
          <button id="logoutBtn" style="margin-top: 5px; background:#8a0000; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Sair</button>
        </div>
      `;
      document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));
    }
    carregarCarrinhoFirebase();
  } else {
    // Usuário não logado - reseta interface
    if (loginBtn) {
      loginBtn.innerHTML = `
        <img src="images/1_5.svg" alt="Account Icon" class="nav-icon">
        <div class="nav-text">
          <span class="text-style-roboto-10-400">Minha conta</span>
          <strong class="text-style-roboto-13-700">Entrar / Cadastro</strong>
        </div>
      `;
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModal();
      });
    }
    carrinho = [];
    atualizarContadorVisual();
    atualizarCarrinhoModal();
  }
});

// ==================== EVENTOS ====================
/**
 * Configura eventos quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', () => {
  // Eventos para botões "Adicionar ao Carrinho"
  document.querySelectorAll('.add-to-cart-btn').forEach(botao => {
    botao.addEventListener('click', () => {
      const card = botao.closest('.product-card');
      const nome = card.querySelector('.product-name')?.textContent.trim();
      const precoTexto = card.querySelector('.product-price-main')?.textContent.trim();
      const preco = parseFloat(precoTexto.replace('R$', '').replace(/\./g, '').replace(',', '.'));

      if (!isNaN(preco)) {
        adicionarAoCarrinho(nome, preco);
        botao.textContent = "Adicionado!";
        setTimeout(() => botao.textContent = "Adicionar ao Carrinho", 1500);
      }
    });
  });

  // Eventos para botões "Comprar"
  document.querySelectorAll('.comprar-btn').forEach(botao => {
    botao.addEventListener('click', () => {
      if (!usuarioAtual || carrinho.length === 0) {
        exibirMensagem("Você precisa estar logado e ter itens no carrinho.", 'erro');
        return;
      }

      const msg = document.getElementById('compra-msg');
      msg.textContent = "✅ A sua simulação de compra foi feita com sucesso!";
      msg.classList.remove('oculto');
      msg.classList.add('ativo');

      setTimeout(() => {
        msg.classList.remove('ativo');
        msg.classList.add('oculto');
      }, 3500);
    });
  });

  // Eventos para botões de compra direta
  document.querySelectorAll('.produto-comprar').forEach(botao => {
    botao.addEventListener('click', () => {
      botao.disabled = true;
      botao.style.backgroundColor = '#1e1e1e';
      botao.style.color = 'white';
      botao.style.cursor = 'default';
      botao.textContent = '✅ Compra Realizada! Obrigado.';
    });
  });
  
  // Evento para abrir modal do carrinho
  const cartBtn = document.querySelector('.cart-button');
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('cart-modal').classList.remove('hidden');
      atualizarCarrinhoModal();
    });
  }
});

// ==================== FUNÇÕES GLOBAIS ====================
/**
 * Fecha o modal do carrinho
 */
window.fecharCarrinho = () => {
  document.getElementById('cart-modal').classList.add('hidden');
};

/**
 * Limpa todos os itens do carrinho
 */
window.limparCarrinho = () => {
  if (!usuarioAtual) {
    exibirMensagem("Você precisa estar logado para limpar o carrinho.", 'erro');
    return;
  }

  carrinho = [];
  salvarCarrinhoFirebase();
  atualizarCarrinhoModal();
  atualizarContadorVisual();
  exibirMensagem("Carrinho limpo com sucesso.", 'sucesso');
};
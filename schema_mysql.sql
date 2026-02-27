-- =========================================================================
-- BeyondApp - Database Schema (Adaptado para MySQL)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS beyond_app;
USE beyond_app;

-- 1. Tabela de Usuários
-- Comporta os 3 níveis de permissão: Consumidor, Comerciante e Administrador.
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    tipo_perfil ENUM('Consumidor', 'Comerciante', 'Administrador') NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_exclusao TIMESTAMP NULL DEFAULT NULL -- Implementação de Soft Delete (LGPD)
);

-- 2. Tabela de Estabelecimentos
-- Regra de Negócio: O identificador único deve ser obrigatoriamente o Place_ID do Google.
CREATE TABLE estabelecimentos (
    place_id VARCHAR(255) PRIMARY KEY,
    proprietario_id INT,
    nome VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (proprietario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 3. Tabela de Mídias (Vídeos e Fotos)
-- Armazena a URL e gerencia a fila de moderação da Inteligência Artificial.
CREATE TABLE midias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id VARCHAR(255) NOT NULL,
    autor_id INT NOT NULL,
    url_midia TEXT NOT NULL,
    tipo ENUM('Video', 'Foto') NOT NULL,
    origem ENUM('Instagram', 'TikTok', 'Upload_Direto') NOT NULL,
    score_seguranca_ia DECIMAL(5, 2), -- Índice de "Conteúdo Inseguro" retornado pelo Webhook de IA
    status_moderacao ENUM('Aprovado', 'Pendente', 'Rejeitado', 'Oculto') DEFAULT 'Pendente',
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_exclusao TIMESTAMP NULL DEFAULT NULL, -- Soft delete para quando o lojista desconectar a rede social
    FOREIGN KEY (place_id) REFERENCES estabelecimentos(place_id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Tabela de Avaliações
-- Permite que consumidores avaliem os locais.
CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id VARCHAR(255) NOT NULL,
    consumidor_id INT NOT NULL,
    nota INT CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES estabelecimentos(place_id) ON DELETE CASCADE,
    FOREIGN KEY (consumidor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =========================================================================
-- QUERY DE JOIN (Para mostrar domínio de buscas relacionais)
-- Objetivo: Listar as mídias ativas e aprovadas de um estabelecimento
-- =========================================================================
SELECT 
    e.nome AS Nome_Estabelecimento,
    u.nome AS Nome_Proprietario,
    m.origem AS Plataforma,
    m.url_midia AS Link_Video
FROM estabelecimentos e
INNER JOIN usuarios u ON e.proprietario_id = u.id
INNER JOIN midias m ON e.place_id = m.place_id
WHERE m.status_moderacao = 'Aprovado' AND m.data_exclusao IS NULL;
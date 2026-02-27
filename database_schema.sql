-- ==============================================================================
-- PROJETO INTEGRADOR: BEYONDAPP
-- Banco de Dados: PostgreSQL
-- Extensão Espacial: PostGIS (Obrigatório para cálculos de raio geolocalizado)
-- ==============================================================================

-- 1. Habilitando a extensão espacial do PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabela de Usuários (Consumidor, Comerciante e Admin)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('consumer', 'merchant', 'admin')) NOT NULL,
    oauth_provider VARCHAR(50), -- Ex: google, instagram, tiktok
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Implementação de Soft Delete (LGPD)
);

-- 3. Tabela de Locais (Fonte Única da Verdade baseada no Google Places)
CREATE TABLE places (
    place_id VARCHAR(255) PRIMARY KEY, -- Identificador único do Google API
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    geom GEOMETRY(Point, 4326) NOT NULL, -- Coordenadas nativas (PostGIS)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Mídias (Conteúdo Agregado das Redes ou Upload Direto)
CREATE TABLE media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    place_id VARCHAR(255) REFERENCES places(place_id),
    user_id UUID REFERENCES users(id),
    media_url TEXT NOT NULL, -- Armazena apenas a URL (AWS S3 ou Embed), nunca o arquivo em si
    source VARCHAR(50) CHECK (source IN ('instagram', 'tiktok', 'direct_upload')) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')) DEFAULT 'pending',
    ai_confidence_score DECIMAL(5,2), -- Índice de segurança gerado pelo Webhook de IA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete para quando o lojista "Desconectar Instagram"
);

-- 5. Tabela de Avaliações (Reviews do Consumidor)
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    place_id VARCHAR(255) REFERENCES places(place_id),
    user_id UUID REFERENCES users(id),
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- QUERY DE EXEMPLO (Insights de Mídia)
-- Busca todas as mídias aprovadas de um local específico usando JOIN
-- ==============================================================================
SELECT p.name AS local, m.source AS origem, m.media_url, m.status
FROM places p
INNER JOIN media m ON p.place_id = m.place_id
WHERE m.status = 'approved' AND m.deleted_at IS NULL;

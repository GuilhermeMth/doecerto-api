#!/usr/bin/env node
/**
 * Script para gerar um arquivo SQL com os dados mockados do seed
 * Exécuta durante o build do Docker
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const seedAdminName = process.env.SEED_ADMIN_NAME && process.env.SEED_ADMIN_NAME.trim();
const seedAdminEmail = process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_EMAIL.trim();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

function generateSeedSQL() {
  console.log('🌱 Gerando SQL de seed...');

  if (!seedAdminName || !seedAdminEmail || !seedAdminPassword) {
    throw new Error(
      'Missing admin seed environment variables. Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.',
    );
  }

  // Hash das senhas - usando bcrypt sincronamente
  const adminPasswordHash = bcrypt.hashSync(seedAdminPassword, 10);

  let sql = `-- Dados mockados gerados durante o build
-- Admin gerado a partir de variáveis de ambiente

SET FOREIGN_KEY_CHECKS = 0;

-- Limpar dados existentes (se houver)
TRUNCATE TABLE users;
TRUNCATE TABLE admins;

SET FOREIGN_KEY_CHECKS = 1;

`;

  // Inserir admin gerado por ambiente
  sql += `-- Criar admin a partir de variáveis de ambiente
INSERT INTO users (name, email, password, role, createdAt, updatedAt) 
VALUES ('${seedAdminName}', '${seedAdminEmail}', '${adminPasswordHash}', 'admin', NOW(), NOW());

INSERT INTO admins (userId, createdAt, updatedAt)
SELECT id, NOW(), NOW() FROM users WHERE email = '${seedAdminEmail}';

`;

  // Escrever arquivo
  const outputPath = path.join(__dirname, '..', 'seed-data.sql');
  
  try {
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`✅ SQL de seed gerado: ${outputPath}`);
    console.log(`📊 Dados: 1 admin via variáveis de ambiente`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar SQL: ${error.message}`);
    process.exit(1);
  }
}

generateSeedSQL();

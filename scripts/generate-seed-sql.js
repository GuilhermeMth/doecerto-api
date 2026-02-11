#!/usr/bin/env node
/**
 * Script para gerar um arquivo SQL com os dados mockados do seed
 * Exécuta durante o build do Docker
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const PASSWORDS = {
  admin: 'Admin@123456',
};

function generateSeedSQL() {
  console.log('🌱 Gerando SQL de seed...');

  // Hash das senhas - usando bcrypt sincronamente
  const adminPasswordHash = bcrypt.hashSync(PASSWORDS.admin, 10);

  let sql = `-- Dados mockados gerados durante o build
-- Admin padrão para desenvolvimento/testes

SET FOREIGN_KEY_CHECKS = 0;

-- Limpar dados existentes (se houver)
TRUNCATE TABLE users;
TRUNCATE TABLE admins;

SET FOREIGN_KEY_CHECKS = 1;

`;

  // Inserir admin mockado
  const adminEmail = 'admin@doecerto.com';
  const adminName = 'DoeCerto Admin';

  sql += `-- Criar admin mockado
INSERT INTO users (name, email, password, role, createdAt, updatedAt) 
VALUES ('${adminName}', '${adminEmail}', '${adminPasswordHash}', 'admin', NOW(), NOW());

INSERT INTO admins (userId, createdAt, updatedAt)
SELECT id, NOW(), NOW() FROM users WHERE email = '${adminEmail}';

`;

  // Escrever arquivo
  const outputPath = path.join(__dirname, '..', 'seed-data.sql');
  
  try {
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`✅ SQL de seed gerado: ${outputPath}`);
    console.log(`📊 Dados: 1 admin mockado`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar SQL: ${error.message}`);
    process.exit(1);
  }
}

generateSeedSQL();

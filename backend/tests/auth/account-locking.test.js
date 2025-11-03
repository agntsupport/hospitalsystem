const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const { prisma } = require('../../utils/database');
const authRoutes = require('../../routes/auth.routes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Account Locking (Anti Brute-Force)', () => {
  let testUser;
  const TEST_USERNAME = 'test_account_lock_user';
  const TEST_PASSWORD = 'correct_password_123';

  beforeAll(async () => {
    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);
    testUser = await prisma.usuario.create({
      data: {
        username: TEST_USERNAME,
        passwordHash: hashedPassword,
        email: `${TEST_USERNAME}@test.com`,
        rol: 'cajero',
        activo: true,
        intentosFallidos: 0
      }
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.usuario.deleteMany({
      where: { username: TEST_USERNAME }
    });
  });

  beforeEach(async () => {
    // Resetear intentos antes de cada test
    await prisma.usuario.update({
      where: { id: testUser.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null }
    });
  });

  it('should increment intentos fallidos on wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERNAME,
        password: 'wrong_password'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.intentosRestantes).toBe(4); // 5 - 1 = 4

    const user = await prisma.usuario.findUnique({
      where: { id: testUser.id }
    });
    expect(user.intentosFallidos).toBe(1);
  });

  it('should block account after 5 failed attempts', async () => {
    // Realizar 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERNAME,
          password: 'wrong_password'
        });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: testUser.id }
    });

    expect(user.intentosFallidos).toBe(5);
    expect(user.bloqueadoHasta).not.toBeNull();
    expect(new Date(user.bloqueadoHasta)).toBeInstanceOf(Date);
  });

  it('should reject login when account is blocked', async () => {
    // Bloquear cuenta manualmente
    const bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await prisma.usuario.update({
      where: { id: testUser.id },
      data: {
        intentosFallidos: 5,
        bloqueadoHasta
      }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERNAME,
        password: TEST_PASSWORD // Password correcto pero cuenta bloqueada
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('bloqueada');
    expect(response.body.bloqueadoHasta).toBeTruthy();
  });

  it('should reset intentos fallidos on successful login', async () => {
    // Establecer algunos intentos fallidos
    await prisma.usuario.update({
      where: { id: testUser.id },
      data: { intentosFallidos: 3 }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTruthy();

    const user = await prisma.usuario.findUnique({
      where: { id: testUser.id }
    });
    expect(user.intentosFallidos).toBe(0);
    expect(user.bloqueadoHasta).toBeNull();
  });

  it('should allow login after block period expires', async () => {
    // Bloquear cuenta con tiempo expirado
    const bloqueadoHasta = new Date(Date.now() - 1000); // Expiró hace 1 segundo
    await prisma.usuario.update({
      where: { id: testUser.id },
      data: {
        intentosFallidos: 5,
        bloqueadoHasta
      }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const user = await prisma.usuario.findUnique({
      where: { id: testUser.id }
    });
    expect(user.intentosFallidos).toBe(0);
    expect(user.bloqueadoHasta).toBeNull();
  });

  it('should show remaining attempts in error message', async () => {
    // Realizar 2 intentos fallidos
    await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_USERNAME, password: 'wrong1' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_USERNAME, password: 'wrong2' });

    expect(response.status).toBe(401);
    expect(response.body.intentosRestantes).toBe(3); // 5 - 2 = 3
  });

  it('should show block message on 5th failed attempt', async () => {
    // Realizar 4 intentos fallidos primero
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: TEST_USERNAME, password: 'wrong' });
    }

    // 5to intento debería bloquear
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_USERNAME, password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('bloqueada');
    expect(response.body.message).toContain('15 minutos');
    expect(response.body.intentosRestantes).toBe(0);
  });
});

describe('Account Unlock Endpoint', () => {
  let adminUser;
  let blockedUser;
  let adminToken;
  const ADMIN_USERNAME = 'test_admin_unlock';
  const BLOCKED_USERNAME = 'test_blocked_user';

  beforeAll(async () => {
    // Crear admin
    const adminHash = await bcrypt.hash('admin123', 12);
    adminUser = await prisma.usuario.create({
      data: {
        username: ADMIN_USERNAME,
        passwordHash: adminHash,
        email: `${ADMIN_USERNAME}@test.com`,
        rol: 'administrador',
        activo: true
      }
    });

    // Login admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: ADMIN_USERNAME, password: 'admin123' });
    adminToken = loginResponse.body.data.token;

    // Crear usuario bloqueado
    const blockedHash = await bcrypt.hash('password123', 12);
    blockedUser = await prisma.usuario.create({
      data: {
        username: BLOCKED_USERNAME,
        passwordHash: blockedHash,
        email: `${BLOCKED_USERNAME}@test.com`,
        rol: 'cajero',
        activo: true,
        intentosFallidos: 5,
        bloqueadoHasta: new Date(Date.now() + 15 * 60 * 1000)
      }
    });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: {
        username: { in: [ADMIN_USERNAME, BLOCKED_USERNAME] }
      }
    });
  });

  it('should allow admin to unlock account', async () => {
    const response = await request(app)
      .post('/api/auth/unlock-account')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: BLOCKED_USERNAME });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('desbloqueada');

    const user = await prisma.usuario.findFirst({
      where: { username: BLOCKED_USERNAME }
    });
    expect(user.intentosFallidos).toBe(0);
    expect(user.bloqueadoHasta).toBeNull();
  });

  it('should reject unlock from non-admin user', async () => {
    // Crear usuario no-admin
    const cajeroHash = await bcrypt.hash('cajero123', 12);
    const cajero = await prisma.usuario.create({
      data: {
        username: 'test_cajero_unlock',
        passwordHash: cajeroHash,
        email: 'cajero@test.com',
        rol: 'cajero',
        activo: true
      }
    });

    const cajeroLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_cajero_unlock', password: 'cajero123' });
    const cajeroToken = cajeroLogin.body.data.token;

    const response = await request(app)
      .post('/api/auth/unlock-account')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ username: BLOCKED_USERNAME });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);

    // Cleanup
    await prisma.usuario.delete({ where: { id: cajero.id } });
  });

  it('should return 404 for non-existent user', async () => {
    const response = await request(app)
      .post('/api/auth/unlock-account')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'non_existent_user_12345' });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('should require username in request body', async () => {
    const response = await request(app)
      .post('/api/auth/unlock-account')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

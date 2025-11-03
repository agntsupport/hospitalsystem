const { prisma } = require('./database');
const logger = require('./logger');

/**
 * Servicio para limpiar tokens expirados de la blacklist
 * Debe ejecutarse periódicamente (cron job)
 */
class TokenCleanupService {
  /**
   * Eliminar tokens expirados de la blacklist
   * @returns {Promise<number>} Número de tokens eliminados
   */
  static async cleanupExpiredTokens() {
    try {
      const now = new Date();

      const result = await prisma.tokenBlacklist.deleteMany({
        where: {
          fechaExpira: {
            lt: now // Menor que la fecha actual
          }
        }
      });

      logger.info(`Token cleanup: ${result.count} tokens expirados eliminados`);

      return result.count;
    } catch (error) {
      logger.error('Error en limpieza de tokens:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de la blacklist
   * @returns {Promise<Object>} Estadísticas de tokens
   */
  static async getBlacklistStats() {
    try {
      const total = await prisma.tokenBlacklist.count();
      const expirados = await prisma.tokenBlacklist.count({
        where: {
          fechaExpira: {
            lt: new Date()
          }
        }
      });
      const activos = total - expirados;

      return {
        total,
        activos,
        expirados,
        lastCheck: new Date()
      };
    } catch (error) {
      logger.error('Error obteniendo stats de blacklist:', error);
      throw error;
    }
  }

  /**
   * Iniciar servicio de limpieza automática
   * @param {number} intervalHours - Intervalo en horas (default: 24)
   */
  static startAutoCleanup(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    logger.info(`Token cleanup service iniciado. Limpieza cada ${intervalHours} horas`);

    // Ejecutar inmediatamente
    this.cleanupExpiredTokens();

    // Programar ejecuciones periódicas
    setInterval(async () => {
      logger.info('Ejecutando limpieza programada de tokens...');
      await this.cleanupExpiredTokens();
    }, intervalMs);
  }
}

module.exports = TokenCleanupService;

// ABOUTME: Servicio API para obtener ocupación en tiempo real del hospital (consultorios, habitaciones, quirófanos)

import axios from 'axios';
import type { OcupacionResponse } from '../types/ocupacion.types';
import { APP_CONFIG } from '../utils/constants';

const API_URL = APP_CONFIG.API_BASE_URL;

export const ocupacionService = {
  /**
   * Obtener ocupación en tiempo real del hospital
   * @returns {Promise<OcupacionResponse>} Datos de ocupación de consultorios, habitaciones y quirófanos
   */
  async getOcupacion(): Promise<OcupacionResponse> {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await axios.get<OcupacionResponse>(
      `${API_URL}/dashboard/ocupacion`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },
};

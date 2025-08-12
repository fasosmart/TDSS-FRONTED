import axiosInstance from 'src/utils/axios';
// eslint-disable-next-line import/no-named-default
import { default as API } from 'src/utils/api';

/**
 * Service pour gérer les données du dashboard agent
 */
export const AgentDashboardService = {
  /**
   * Récupère les données du dashboard agent
   * @param {string} year - Année pour filtrer les données (optionnel)
   * @returns {Promise} Promesse contenant les données du dashboard
   */
  getDashboardData: async ( year = null) => {
    try {
      // Construire l'URL avec le paramètre year si fourni
      const url = API.agentDashboard(year);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard agent:', error);
      throw error;
    }
  },

  /**
   * Exporte les données du dashboard agent
   * @param {Object} filters - Filtres pour l'exportation (company, period, etc.)
   * @returns {Promise} Promesse contenant l'URL du fichier exporté
   */
  exportDashboardData: async (filters = {}) => {
    try {
      const { company = 'all', period = 'all' } = filters;
      
      // Construction des paramètres de requête
      const params = new URLSearchParams();
      if (company && company !== 'all') params.append('company', company);
      if (period && period !== 'all') params.append('period', period);
      
      // Ajout des paramètres à l'URL
      params.append('export', 'true');
      
      const url = `${API.agentDashboard()}?${params.toString()}`;
      const response = await axiosInstance.get(url, { responseType: 'blob' });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données du dashboard agent:', error);
      throw error;
    }
  },
};

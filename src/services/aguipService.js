import axios from 'src/utils/axios';
import API from 'src/utils/api';

class AguipService {
  /**
   * Récupère les données du tableau de bord AGUIP
   * @param {Object} params - Paramètres de requête
   * @param {string} [params.startDate] - Date de début au format YYYY-MM-DD
   * @param {string} [params.endDate] - Date de fin au format YYYY-MM-DD
   * @returns {Promise<Object>} Les données du tableau de bord formatées
   */
  static async getDashboardData({ startDate, endDate } = {}) {
    try {
      // Valider et formater les dates si elles sont fournies
      const params = {};

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const url = API.getAguipDashboard(params.start_date, params.end_date);
      console.log('AguipService - Appel API vers:', url);

      const response = await axios.get(url);
      console.log('AguipService - Réponse API reçue:', response.data);

      // Vérifier si la réponse contient des données
      if (!response.data) {
        console.error('AguipService - Aucune donnée dans la réponse');
        throw new Error("Aucune donnée reçue de l'API");
      }

      // Formater les données pour correspondre à la structure attendue
      const formattedData = {
        stats: {
          total_declarations: response.data.statistiques_cards?.total_declarations || 0,
          total_facture: response.data.statistiques_cards?.total_facture || 0,
          total_payment: response.data.statistiques_cards?.total_payment || 0,
          taux_payment: response.data.statistiques_cards?.taux_payment || 0,
        },
        statistique_shart: {
          declaration: response.data.statistique_shart?.declaration || {},
          facture: response.data.statistique_shart?.facture || {},
          payment: response.data.statistique_shart?.payment || {},
        },
        recentDeclarations: response.data.laste_declaration_liste || [],
      };

      console.log('AguipService - Données formatées:', formattedData);
      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord AGUIP:', error);
      // Retourner des données vides en cas d'erreur
      return {
        stats: {
          total_declarations: 0,
          total_facture: 0,
          total_payment: 0,
          taux_payment: 0,
        },
        statistique_shart: {
          declaration: {},
          facture: {},
          payment: {},
        },
        recentDeclarations: [],
      };
    }
  }

  /**
   * Formate les données pour les graphiques
   * @param {Object} data - Données brutes de l'API
   * @returns {Object} Données formatées pour les graphiques
   */
  static formatChartData(data) {
    if (!data || !data.statistique_shart) {
      return {
        series: [],
        categories: Array(12)
          .fill()
          .map((_, i) => (i + 1).toString()),
      };
    }

    const { declaration = {}, facture = {}, payment = {} } = data.statistique_shart;

    // Créer les catégories (mois de l'année)
    const categories = Array(12)
      .fill()
      .map((_, i) => {
        const date = new Date(2023, i, 1);
        return date.toLocaleString('fr-FR', { month: 'short' });
      });

    // Fonction pour convertir les objets en tableaux triés par clé numérique
    const convertToArray = (obj) =>
      Object.entries(obj)
        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
        .map(([_, value]) => value || 0);

    // Créer les séries pour chaque type de données
    const series = [
      {
        name: 'Déclarations',
        type: 'line',
        data: convertToArray(declaration),
      },
      {
        name: 'Factures',
        type: 'line',
        data: convertToArray(facture),
      },
      {
        name: 'Paiements',
        type: 'line',
        data: convertToArray(payment),
      },
    ];

    return { series, categories };
  }
}

export default AguipService;

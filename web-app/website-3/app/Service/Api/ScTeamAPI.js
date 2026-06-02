import apiClient from './api';
import logger from '../../../utils/logger';

/**
 * SC Team API Service
 * Handles fetching Student Council team members
 */
class ScTeamAPI {
    /**
     * Get SC team members grouped by category
     * @returns {Promise<Object>} Response with grouped team members
     */
    async getMembersGrouped() {
        try {
            const response = await apiClient.get('/sc-team/grouped');
            return response.data;
        } catch (error) {
            logger.error('Error fetching grouped SC team members:', error);
            throw error;
        }
    }
}

export default new ScTeamAPI();

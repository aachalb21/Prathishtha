/**
 * Leaderboard API Service
 */

import apiClient from './api';

class LeaderboardAPI {
  async getLeaderboard(page = 1, limit = 20) {
    try {
      const response = await apiClient.get('/users/leaderboard', {
        params: { page, limit },
      });
      if (response.data?.success) {
        return { success: true, data: response.data.data, message: response.data.message };
      }
      return { success: false, data: null, message: 'Failed to fetch leaderboard' };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch leaderboard');
    }
  }

  async buildLeaderboard() {
    try {
      const response = await apiClient.post('/users/leaderboard/build');
      if (response.data?.success) {
        return { success: true, data: response.data.data, message: response.data.message };
      }
      return { success: false, data: null, message: 'Failed to build leaderboard' };
    } catch (error) {
      return this._handleError(error, 'Failed to build leaderboard');
    }
  }

  transformLeaderboardData(leaderboardData = []) {
    return leaderboardData.map((entry) => ({
      id: entry.user?._id || entry.user,
      rank: entry.rank,
      name: entry.user?.name || 'Unknown User',
      exp: entry.exp || 0,
      department: entry.user?.Department || 'N/A',
      prn: entry.user?.student_prn || 'N/A',
      email: entry.user?.email || 'N/A',
      gender: entry.user?.Gender || '',
      collegeName: entry.user?.College_name || 'SAKEC',
      year: entry.user?.Year || 'N/A',
    }));
  }

  _handleError(error, defaultMessage = 'An error occurred') {
    const errorMessage = error?.response?.data?.message || error.message || defaultMessage;
    return { success: false, data: null, message: errorMessage };
  }
}

export default new LeaderboardAPI();

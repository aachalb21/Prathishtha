'use client';

import { useState, useEffect } from 'react';
import { LeaderboardAPI } from '../../app/Service/Api';
import logger from '@/utils/logger';
import './Leaderboard.css';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const itemsPerPage = 20;
  const POLL_INTERVAL = 30000; // 30 seconds for real-time updates

  // Fetch leaderboard data from API service
  const fetchLeaderboard = async (page = 1, skipBuild = false) => {
    try {
      if (!skipBuild) {
        setLoading(true);
      }
      setError(null);

      // Only build leaderboard on initial load, not on every poll
      if (!skipBuild) {
        await LeaderboardAPI.buildLeaderboard();
      }

      const response = await LeaderboardAPI.getLeaderboard(page, itemsPerPage);

      if (response.success && response.data) {
        // Transform data using service method
        const transformedData = LeaderboardAPI.transformLeaderboardData(
          response.data.leaderboard
        );

        setPlayers(transformedData);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.totalUsers);
        setLastUpdated(new Date());
      } else {
        setError(response.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      logger.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(1);

    // Real-time polling every 30 seconds for live updates
    const pollInterval = setInterval(() => {
      fetchLeaderboard(currentPage, true); // true = skip rebuild, just fetch
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (currentPage > 1) {
      fetchLeaderboard(currentPage);
    }
  }, [currentPage]);

  const getRankMedal = (rank) => {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[rank - 1] || '⭐';
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Compute top girl and top boy for the podium
  const topGirl = players.find(
    (p) => p.gender?.toLowerCase() === 'female' || p.gender?.toLowerCase() === 'f'
  );
  const topBoy = players.find(
    (p) => p.gender?.toLowerCase() === 'male' || p.gender?.toLowerCase() === 'm'
  );

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">HALL OF LEGENDS</h1>
        <p className="leaderboard-subtitle">Top Performers Ranking</p>
        {totalUsers > 0 && (
          <p className="leaderboard-stats">Total Users: {totalUsers.toLocaleString()}</p>
        )}
        {lastUpdated && (
          <p className="leaderboard-last-updated">
            Last Updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh every 30s
          </p>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => fetchLeaderboard(currentPage)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && players.length > 0 && (
        <>
          <div className="leaderboard-wrapper">
            {/* Top Girl & Boy Podium Section */}
            {currentPage === 1 && (topGirl || topBoy) && (
              <div className="podium-section podium-two">
                {topGirl && (
                  <div className="podium-card podium-girl" title={topGirl.email}>
                    <div className="podium-gender-label">👧 Student Of The Year Female</div>
                    <div className="medal-badge">🏆</div>
                    <div className="player-name">{topGirl.name}</div>
                    <div className="exp-display">{topGirl.exp}</div>
                    <div className="exp-label">EXP</div>
                    <div className="dep-badge">{topGirl.department}</div>
                    <div className="year-badge">{topGirl.year}</div>
                  </div>
                )}
                {topBoy && (
                  <div className="podium-card podium-boy" title={topBoy.email}>
                    <div className="podium-gender-label">👦 Student Of The Year Male</div>
                    <div className="medal-badge">🏆</div>
                    <div className="player-name">{topBoy.name}</div>
                    <div className="exp-display">{topBoy.exp}</div>
                    <div className="exp-label">EXP</div>
                    <div className="dep-badge">{topBoy.department}</div>
                    <div className="year-badge">{topBoy.year}</div>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="leaderboard-table-wrapper">
              <div className="leaderboard-table-header">
                <div className="table-col rank-col">RANK</div>
                <div className="table-col name-col">NAME</div>
                <div className="table-col exp-col">EXP</div>
                <div className="table-col dep-col">DEPARTMENT</div>
              </div>

              <div className="leaderboard-list">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`leaderboard-row rank-${player.rank}`}
                    title={`${player.email} (PRN: ${player.prn})`}
                  >
                    <div className="table-col rank-col">
                      <span className="rank-badge">{getRankMedal(player.rank)} #{player.rank}</span>
                    </div>
                    <div className="table-col name-col">
                      <span className="player-name-text">{player.name}</span>
                    </div>
                    <div className="table-col exp-col">
                      <span className="exp-value">{player.exp}</span>
                    </div>
                    <div className="table-col dep-col">
                      <span className="dep-label">{player.department}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>

            <button
              className="pagination-button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {!loading && !error && players.length === 0 && (
        <div className="empty-container">
          <p>No leaderboard data available yet.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import UserAPI from '@/app/Service/Api/UserAPI';

export default function EventRegisteredSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch registered events on component mount
  useEffect(() => {
    fetchRegisteredEvents();
  }, []);

  const fetchRegisteredEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await UserAPI.getRegisteredEvents();
      
      if (response.success) {
        setEvents(response.data);
        console.log('Registered Events:', response.data);
      } else {
        setError(response.message || 'Failed to fetch events');
        console.error('Error fetching events:', response);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = (eventId) => {
    // TODO: Implement unregister functionality
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 p-1">
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="text-xl font-black comic-style-text text-gray-900 mb-2">
              LOADING EVENTS...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-red-100 via-red-50 to-red-100 p-1">
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-xl font-black comic-style-text text-gray-900 mb-2">
              ERROR LOADING EVENTS
            </h3>
            <p className="text-sm text-gray-600 font-semibold mb-4">{error}</p>
            <button 
              onClick={fetchRegisteredEvents}
              className="px-6 py-2 bg-blue-600 text-white font-black rounded-xl border-2 border-black hover:bg-blue-700"
            >
              🔄 RETRY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-red-100 via-pink-50 to-rose-50 p-1">
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-2xl font-black comic-style-text text-gray-900 mb-2">
            🎪 REGISTERED EVENTS
          </h2>
          <p className="text-sm text-gray-600 font-semibold">
            You are registered for {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        /* Empty State */
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 p-1">
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-black comic-style-text text-gray-900 mb-2">
              NO EVENTS REGISTERED
            </h3>
            <p className="text-sm text-gray-600 font-semibold">
              Head over to the events page to register for upcoming events!
            </p>
          </div>
        </div>
      ) : (
        /* Events Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => {
            const eventName = event.eventName || 'Event Name Not Available';
            const eventDate = event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD';
            const eventDescription = event.eventDescription || 'No description available';
            const eventCategory = event.eventCategory || 'N/A';
            const eventType = event.eventType || 'N/A';
            const registrationDate = new Date(event.registrationDate).toLocaleDateString();
            const paymentStatus = event.paymentStatus || 'Pending';
            const eventId = event.eventId;

            return (
              <div
                key={event.registrationId}
                className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-indigo-100 via-purple-50 to-pink-50 p-1 hover:shadow-2xl transition-shadow"
              >
                <div className="bg-white rounded-2xl p-6">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black comic-style-text text-gray-900 mb-2">
                        {eventName}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-100 border-2 border-purple-600 rounded-full text-xs font-black text-purple-800">
                          {eventCategory}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 border-2 border-blue-600 rounded-full text-xs font-black text-blue-800">
                          {eventType}
                        </span>
                        {event.isParticipated && (
                          <span className="px-3 py-1 bg-green-100 border-2 border-green-600 rounded-full text-xs font-black text-green-800">
                            ✅ Participated
                          </span>
                        )}
                        {event.isWinner && (
                          <span className="px-3 py-1 bg-yellow-100 border-2 border-yellow-600 rounded-full text-xs font-black text-yellow-800">
                            🏆 Winner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-lg">📅</span>
                      <p className="font-bold text-gray-700">{eventDate}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-lg">📝</span>
                      <p className="font-bold text-gray-700">Registered: {registrationDate}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-lg">💳</span>
                      <p className={`font-bold ${paymentStatus === 'Completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                        Payment: {paymentStatus}
                      </p>
                    </div>
                    {event.eventFee !== undefined && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-lg">💰</span>
                        <p className="font-bold text-gray-700">Fee: ₹{event.eventFee}</p>
                      </div>
                    )}
                    {event.teamType && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-lg">👥</span>
                        <p className="font-bold text-gray-700">
                          {event.teamType} {event.teamSize > 1 ? `(${event.teamSize} members)` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 font-semibold mb-6 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                    💡 {eventDescription}
                  </p>

                 
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Browse More Events Button */}
      <div className="text-center">
        <button className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button">
          🔍 BROWSE MORE EVENTS
        </button>
      </div>
    </div>
  );
}

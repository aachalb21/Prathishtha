# Leaderboard Frontend Integration Guide

## Setup Instructions

### 1. Environment Configuration

Add this to your `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

For production, use your actual backend URL:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 2. Features Implemented

✅ **Real-time Data Fetching**
- Fetches leaderboard from backend API
- Displays user data: name, rank, experience (points), department

✅ **Loading States**
- Spinner animation while fetching data
- Loading message

✅ **Error Handling**
- Displays error message if API fails
- Retry button to refetch data

✅ **Pagination**
- Navigate between pages
- Shows current page and total pages
- 20 users per page

✅ **Auto-refresh**
- Automatically refreshes every 5 minutes
- Stays on current page after refresh

✅ **Podium Display**
- Top 3 users displayed prominently on first page
- Medal badges (🥇 🥈 🥉)
- Different styling for each rank

✅ **User Details**
- Name, Department, Experience Points
- Student PRN and Email on hover
- Formatted experience points

### 3. Data Structure Received

The component expects this API response:

```json
{
  "success": true,
  "message": "Leaderboard fetched successfully",
  "data": {
    "leaderboard": [
      {
        "_id": "...",
        "user": {
          "_id": "userId",
          "name": "User Name",
          "email": "user@email.com",
          "student_prn": "PRN123",
          "Department": "Engineering",
          "College_name": "SAKEC"
        },
        "points": 1500,
        "rank": 1
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "itemsPerPage": 20
    }
  }
}
```

### 4. API Endpoints Used

```
GET /api/users/leaderboard?page=1&limit=20
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### 5. Customization

#### Change Refresh Interval
Edit `Leaderboard.jsx` line 54:
```javascript
// Change 300000 (5 minutes) to your desired interval in milliseconds
const interval = setInterval(() => {
  fetchLeaderboard(currentPage);
}, 300000); // Change this value
```

#### Change Items Per Page
Edit `Leaderboard.jsx` line 17:
```javascript
const itemsPerPage = 20; // Change to your desired number
```

#### Modify User Fields Displayed
Edit the transform logic in `fetchLeaderboard()` function (lines 33-39) to include or exclude fields.

### 6. Testing

1. Start your backend server:
   ```bash
   npm start
   ```

2. The backend should be running on `http://localhost:8000`

3. Visit the leaderboard page:
   ```
   http://localhost:3000/leaderboard
   ```

4. You should see:
   - Loading spinner briefly
   - Top 3 users in podium format
   - Complete leaderboard table
   - Pagination controls

### 7. Troubleshooting

**"Failed to load leaderboard" error:**
- Check if backend server is running
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check browser console for CORS errors
- Ensure CORS is enabled in backend

**No data showing:**
- Build leaderboard first: `POST /api/users/leaderboard/build`
- Check if users have Exp/points in database
- Verify database connection

**Styling looks broken:**
- Clear browser cache
- Rebuild Next.js: `npm run build`
- Check if Tailwind is working


# Pratishtha Admin Panel

A modern, secure admin panel built with React and Vite for managing the Pratishtha festival admin system.

## 🚀 Features

- **Secure Authentication**: JWT-based login with automatic token refresh
- **Dashboard**: Real-time server health monitoring and session management
- **Admin Management**: Create and manage admin accounts (SuperAdmin only)
- **Role-based Access**: Different permission levels for different admin roles
- **Responsive Design**: Modern UI with Tailwind CSS
- **Session Management**: View and monitor active admin sessions
- **Security**: Rate limiting, input validation, and secure headers

## 🏗️ Tech Stack

- **Frontend**: React 19.1.1 + Vite 7.1.2
- **Styling**: Tailwind CSS 4.1.12
- **Icons**: Heroicons
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **State Management**: Context API + useReducer

## 🛡️ Security Features

- JWT Access Tokens (15-minute expiry)
- Refresh Tokens (7-day expiry)
- Automatic token refresh
- Protected routes
- Role-based access control
- Request rate limiting
- Input validation
- CORS protection

## 📁 Project Structure

```
Admin/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout.jsx     # Main layout with navigation
│   │   └── LoadingSpinner.jsx
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx # Authentication state management
│   ├── pages/             # Page components
│   │   ├── Login.jsx      # Admin login page
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   └── AdminManagement.jsx # Admin creation & management
│   ├── services/          # API services
│   │   └── api.js         # Axios configuration & API calls
│   ├── App.jsx            # Main app component with routing
│   ├── App.css            # Global styles
│   └── main.jsx           # React app entry point
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.js         # Vite build configuration
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend server running on http://localhost:8000

### Installation

1. **Clone and navigate to the admin directory**:
   ```bash
   cd Pratishtha-web-app/Admin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🔧 Configuration

### Environment Variables
The admin panel connects to the backend at `http://localhost:8000` by default. To change this, update the `baseURL` in `src/services/api.js`.

### Tailwind CSS
The project uses Tailwind CSS v4 with a custom configuration. Styles are defined in:
- `src/App.css` - Global styles and component classes
- `tailwind.config.js` - Tailwind configuration

## 🎨 UI Components

### Custom CSS Classes
The project includes several utility classes in `App.css`:

- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons  
- `.card` - Content cards with shadow and padding
- `.input-field` - Styled form inputs
- `.sidebar-link` - Navigation sidebar links

### Layout Structure
- **Layout.jsx**: Main layout with responsive sidebar and user menu
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Navigation**: Role-based navigation menu

## 🔐 Authentication Flow

### Login Process
1. User enters email and password
2. Frontend sends credentials to `/api/admin/login`
3. Backend validates and returns access token + refresh token
4. Tokens stored in localStorage
5. User redirected to dashboard

### Automatic Token Refresh
- Access tokens expire in 15 minutes
- Axios interceptor automatically refreshes tokens
- If refresh fails, user redirected to login
- Seamless user experience with no manual intervention

### Role-based Access
- **SuperAdmin**: Full access including admin creation
- **Admin**: Dashboard and session management
- **Other Roles**: Limited access based on permissions

## 📊 Admin Dashboard

### Server Health Monitoring
- Real-time server status
- Database connection status
- Server uptime tracking
- Performance metrics

### Session Management
- View active admin sessions
- Device and browser information
- IP address tracking
- Session creation times
- Last activity timestamps

### Quick Actions
- Logout from current device
- Logout from all devices
- Create new admin (SuperAdmin only)
- Refresh session data

## 👥 Admin Management

### Creating New Admins (SuperAdmin Only)
- Full name and email validation
- Strong password requirements
- Role assignment
- Real-time validation feedback
- Success/error status messages

### Supported Roles
- **Yuva**: Yuva event management
- **Olympus**: Olympus event management
- **Aurum**: Aurum event management
- **Photographer**: Photography access
- **Admin**: General admin access
- **SuperAdmin**: Full system access

### Session Monitoring
- View all active admin sessions
- Device and platform information
- Geographic location tracking
- Session duration monitoring

## 🛠️ API Integration

### Endpoints Used
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/refresh-token` - Token refresh
- `POST /api/admin/logout` - Logout current session
- `POST /api/admin/logout-all` - Logout all sessions
- `GET /api/admin/sessions` - Get active sessions
- `POST /api/admin/create-admin` - Create new admin
- `GET /health` - Server health check

### Error Handling
- Network error handling
- Token expiration handling
- Rate limit handling
- User-friendly error messages
- Automatic retry mechanisms

## 🔒 Security Best Practices

### Frontend Security
- No sensitive data in localStorage except necessary tokens
- Automatic token cleanup on logout
- Protected routes with authentication guards
- XSS prevention with React's built-in protection
- Input sanitization and validation

### API Security
- HTTPS enforcement in production
- JWT token validation
- Rate limiting on sensitive endpoints
- CORS configuration
- Request/response logging

## 🚀 Deployment

### Development
```bash
npm run dev  # Start development server
```

### Production Build
```bash
npm run build  # Create production build
npm run preview  # Preview production build locally
```

### Production Deployment
1. Build the application: `npm run build`
2. Deploy the `dist/` folder to your web server
3. Configure nginx/Apache to serve the SPA
4. Ensure backend API is accessible
5. Configure HTTPS in production

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Automatic token refresh
- [ ] Logout functionality
- [ ] Dashboard data loading
- [ ] Admin creation (SuperAdmin)
- [ ] Session management
- [ ] Responsive design
- [ ] Error handling

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to backend**
- Ensure backend server is running on port 8000
- Check CORS configuration
- Verify API endpoints

**Token refresh issues**
- Check localStorage for valid tokens
- Ensure refresh token hasn't expired
- Verify backend refresh endpoint

**Style issues**
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS
- Verify build process includes CSS

**Route navigation issues**
- Check React Router configuration
- Ensure protected routes are properly wrapped
- Verify authentication state

## 📝 Contributing

1. Follow the established project structure
2. Use the existing CSS utility classes
3. Maintain consistent error handling
4. Add proper TypeScript types (if migrating)
5. Test authentication flows thoroughly
6. Follow React best practices

## 📄 License

This project is part of the Pratishtha festival management system.

## 🤝 Support

For issues and support:
1. Check the troubleshooting section
2. Review backend logs for API issues
3. Check browser console for frontend errors
4. Ensure all dependencies are properly installed

---

**Built with ❤️ for Pratishtha Festival Management**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

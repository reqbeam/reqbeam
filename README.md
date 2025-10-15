# 🚀 Postman Clone - API Testing Tool

A modern, full-featured API testing tool built with **Next.js 15**, **TypeScript**, **Prisma**, and **Tailwind CSS**. This application provides a beautiful, developer-friendly interface similar to Postman, Hoppscotch, and Insomnia.

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)

---

## ✨ Features

### 🎯 Core Features
- **HTTP Request Builder** - Support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Query Parameters Management** - Add, edit, enable/disable params with automatic URL sync
- **Headers Management** - Custom headers with key-value pairs
- **Request Body** - Support for JSON, form-data, and x-www-form-urlencoded
- **Response Viewer** - Beautiful syntax-highlighted JSON responses
- **Request History** - Track all your API requests
- **Collections** - Organize requests into collections
- **Environments** - Manage multiple environments with variables
- **Tab Management** - Work on multiple requests simultaneously

### 🎨 UI/UX Features
- **Dark Theme** - Modern dark-first design with beautiful color schemes
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- **Color-Coded Methods** - Visual distinction for different HTTP methods
- **Syntax Highlighting** - Beautiful code display for responses
- **Real-time Updates** - Instant feedback on request status
- **Smooth Animations** - Polished transitions and interactions

### 🔐 Authentication
- **User Registration & Login** - Secure authentication with NextAuth.js
- **Session Management** - Persistent user sessions
- **Protected Routes** - Secure API endpoints

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Syntax Highlighting:** [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/postman-clone.git
cd postman-clone
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory by copying the example file:

```bash
cp env.example .env
```

Then edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/postman_clone?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App Configuration
NEXT_PUBLIC_APP_NAME="OSS"
```

**Configuration Details:**

- **DATABASE_URL**: Your PostgreSQL connection string
  - Replace `username` with your PostgreSQL username
  - Replace `password` with your PostgreSQL password
  - Replace `postman_clone` with your database name (or create it)
  
- **NEXTAUTH_SECRET**: Generate a secure secret key:
  ```bash
  # On Linux/Mac
  openssl rand -base64 32
  
  # Or use Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 4. Set Up the Database

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE postman_clone;

# Exit psql
\q
```

#### Run Prisma Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Push the schema to your database
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (Database GUI) |

---

## 📁 Project Structure

```
postman-clone/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── dev.db                 # SQLite database (if using SQLite)
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── collections/  # Collections CRUD
│   │   │   ├── environments/ # Environments management
│   │   │   └── request/      # Request sending logic
│   │   ├── auth/             # Auth pages (signin/signup)
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── providers.tsx     # App providers
│   ├── components/
│   │   ├── Collections.tsx   # Collections sidebar
│   │   ├── Dashboard.tsx     # Main dashboard layout
│   │   ├── Environments.tsx  # Environment manager
│   │   ├── RequestBuilder.tsx # Request builder UI
│   │   ├── ResponseViewer.tsx # Response display
│   │   └── Sidebar.tsx       # Left sidebar
│   ├── lib/
│   │   ├── auth.ts           # NextAuth configuration
│   │   └── prisma.ts         # Prisma client instance
│   └── store/
│       └── requestStore.ts   # Zustand state management
├── .env                      # Environment variables
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 🎯 Usage Guide

### Creating Your First Request

1. **Sign Up / Sign In**
   - Navigate to the sign-up page
   - Create an account with your email and password
   - Sign in to access the dashboard

2. **Create a New Request**
   - Click the "New Request" button
   - Select HTTP method (GET, POST, PUT, DELETE, etc.)
   - Enter the API URL

3. **Add Query Parameters**
   - Go to the "Params" tab
   - Add key-value pairs
   - Enable/disable parameters with checkboxes
   - Parameters automatically sync with the URL

4. **Add Headers**
   - Go to the "Headers" tab
   - Add custom headers (e.g., `Authorization`, `Content-Type`)

5. **Add Request Body** (for POST/PUT/PATCH)
   - Go to the "Body" tab
   - Select body type (JSON, form-data, x-www-form-urlencoded)
   - Enter your request payload

6. **Send Request**
   - Click the "Send" button
   - View the response with syntax highlighting
   - Check status code, response time, and size

7. **Save to Collection**
   - Click the "Save" button
   - Choose or create a collection
   - Give your request a name

### Managing Collections

- **Create Collection**: Use the sidebar to create new collections
- **Organize Requests**: Save related requests in collections
- **Load Requests**: Click on saved requests to load them

### Using Environments

- **Create Environment**: Add environment variables
- **Switch Environments**: Activate different environments
- **Use Variables**: Reference variables in your requests

---

## 🔧 Configuration

### Database Configuration

The app uses PostgreSQL by default. To switch to SQLite for development:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. Update `.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
```

3. Run migrations:
```bash
npm run db:push
```

### Customizing Theme

Edit `tailwind.config.ts` to customize colors, fonts, and other design tokens.

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset
```

### Port Already in Use

```bash
# Kill process on port 3000
# On Linux/Mac
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Postman](https://www.postman.com/), [Hoppscotch](https://hoppscotch.io/), and [Insomnia](https://insomnia.rest/)
- Built with amazing open-source tools and libraries

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

## 🌟 Show Your Support

If you like this project, please give it a ⭐️ on GitHub!

---

**Happy API Testing! 🚀**

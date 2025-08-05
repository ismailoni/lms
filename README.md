# 🎓 LMS - Learning Management System

![WIP](https://img.shields.io/badge/status-in%20progress-yellow)
![Next.js](https://img.shields.io/badge/Next.js-15.0.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)

A modern, full-stack Learning Management System built with Next.js, TypeScript, Prisma, and PostgreSQL. Features comprehensive course management, user authentication via Clerk, payment processing with Stripe, and a responsive design with Tailwind CSS.

> ⚠️ **Note**: This project is actively under development. Features and architecture may evolve. Contributions and feedback are welcome!

---

## 🏗️ Project Architecture

```
├── client/                 # Next.js 15 frontend application
│   ├── src/
│   │   ├── app/           # App Router pages & layouts
│   │   │   ├── (auth)/    # Authentication routes
│   │   │   ├── (dashboard)/     # Dashboard routes
│   │   │   └── (nondashboard)/  # Public routes
│   │   ├── components/    # Reusable UI components
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities & schemas
│   │   ├── state/         # Redux Toolkit state management
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
└── server/                # Node.js/Express backend API
    ├── src/
    │   ├── controllers/   # API route handlers
    │   ├── routes/        # Express route definitions
    │   ├── seed/          # Database seeding scripts
    │   └── utils/         # Backend utilities
    ├── prisma/
    │   ├── schema.prisma  # Database schema
    │   └── migrations/    # Database migrations
    └── migrations/        # SQL migration files
```

---

## ✨ Features

### 🔐 Authentication & Authorization
* **Clerk Integration** - Secure user authentication and management
* **Role-based Access** - Student, Teacher, and Admin roles
* **Protected Routes** - Route-level authentication guards

### 📚 Course Management
* **Course Creation** - Rich course builder with sections and chapters
* **Content Upload** - Video, document, and image support via Cloudinary
* **Progress Tracking** - Real-time student progress monitoring
* **Course Preview** - Public course preview for potential students

### 💳 Payment Processing
* **Stripe Integration** - Secure payment processing
* **Teacher Earnings** - Comprehensive earnings tracking and breakdown
* **Transaction History** - Complete payment and enrollment records

### 🎨 Modern UI/UX
* **Responsive Design** - Mobile-first approach with Tailwind CSS
* **Dark/Light Mode** - Theme switching with next-themes
* **Component Library** - shadcn/ui and Radix UI components
* **Drag & Drop** - Course section reordering with react-beautiful-dnd

### 📊 Analytics & Dashboard
* **Student Dashboard** - Course progress and enrolled courses
* **Teacher Dashboard** - Course management and earnings analytics
* **Admin Panel** - System-wide analytics and user management

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS + shadcn/ui
* **State Management**: Redux Toolkit + RTK Query
* **Authentication**: Clerk
* **UI Components**: Radix UI, Lucide React
* **Forms**: React Hook Form + Zod validation
* **Payments**: Stripe React components
* **Media**: Cloudinary integration

### Backend
* **Runtime**: Node.js + Express.js
* **Language**: TypeScript
* **Database**: PostgreSQL with Prisma ORM
* **Authentication**: Clerk Express SDK
* **Payments**: Stripe API
* **File Upload**: Multer + Cloudinary
* **Validation**: Zod schemas
* **Security**: Helmet, CORS

### DevOps & Tools
* **Database Migrations**: Prisma Migrate
* **Development**: Hot reload with nodemon
* **Build**: TypeScript compiler + cpx
* **Code Quality**: ESLint, Prettier
* **Package Manager**: npm

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ and npm
* PostgreSQL database
* Clerk account for authentication
* Stripe account for payments
* Cloudinary account for media storage

### 1️⃣ Clone & Install Dependencies

```bash
git clone https://github.com/ismailoni/lms.git
cd lms

# Install client dependencies
cd client && npm install

# Install server dependencies  
cd ../server && npm install
```

### 2️⃣ Environment Setup

**Client Environment** (`.env.local` in `/client`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

**Server Environment** (`.env` in `/server`):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/lms_db"
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PORT=8000
```

### 3️⃣ Database Setup

```bash
cd server

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run seed
```

### 4️⃣ Start Development Servers

**Backend Server:**
```bash
cd server
npm run dev
```

**Frontend Application:**
```bash
cd client  
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🔧 Available Scripts

### Client (Next.js)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server  
npm run lint       # Run ESLint
```

### Server (Node.js/Express)
```bash
npm run dev           # Start development with hot reload
npm run build         # Build TypeScript to dist/
npm run start         # Start production server
npm run seed          # Seed database with sample data
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run database migrations
npm run db:studio     # Open Prisma Studio
npm run db:reset      # Reset database and reseed
```

---

## 🔗 Production Deployment

### Environment Variables
* Update all environment variables with production values
* Remove development-specific configurations
* Ensure database is accessible from deployment environment

### Backend Deployment Options
* **Railway/Render** - Easy PostgreSQL + Node.js deployment
* **AWS Lambda** - Serverless deployment with serverless-http
* **Digital Ocean App Platform** - Container-based deployment
* **Heroku** - Traditional PaaS deployment

### Frontend Deployment Options  
* **Vercel** - Recommended for Next.js (zero-config)
* **Netlify** - JAMstack deployment
* **AWS Amplify** - Full-stack deployment
* **Railway** - Full-stack deployment option

---

## 📡 API Endpoints

### User Management
| Method | Route                                    | Description                              |
| ------ | ---------------------------------------- | ---------------------------------------- |
| PUT    | `/users/clerk/:userId`                   | Update user profile and settings         |

### Course Management  
| Method | Route                                    | Description                              |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | `/courses`                               | Fetch all courses (with optional filters) |
| GET    | `/courses/:courseId`                     | Get course details by ID                 |
| POST   | `/courses`                               | Create a new course                      |
| PUT    | `/courses/:courseId`                     | Update course by ID                      |
| DELETE | `/courses/:courseId`                     | Delete course by ID                      |

### Transactions & Payments
| Method | Route                                    | Description                              |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | `/transactions?userId=:userId`           | Get user's transaction history           |
| POST   | `/transactions`                          | Create a new transaction                 |
| POST   | `/transactions/stripe/payment-intent`    | Create Stripe payment intent             |

### Teacher Analytics
| Method | Route                                    | Description                              |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | `/teachers/:teacherId/earnings/breakdown` | Get detailed teacher earnings breakdown |

### User Progress & Learning Analytics
| Method | Route                                    | Description                              |
| ------ | ---------------------------------------- | ---------------------------------------- |
| GET    | `/:userId/enrolled-courses`              | Get user's enrolled courses with progress |
| GET    | `/:userId/courses/:courseId`             | Get detailed course progress             |
| GET    | `/:userId/courses/:courseId/access`      | Check course access and enrollment status |
| PUT    | `/:userId/courses/:courseId`             | Update overall course progress           |
| PUT    | `/:userId/courses/:courseId/sections/:sectionId/chapters/:chapterId` | Mark chapter as complete/incomplete |
| PUT    | `/:userId/courses/:courseId/recalculate` | Recalculate overall progress percentage  |
| POST   | `/initialize-progress`                   | Create initial progress structure for enrolled course |

---

## 🧪 Testing

```bash
# Run client tests
cd client && npm test

# Run server tests  
cd server && npm test

# Run Prisma Studio for database inspection
cd server && npm run db:studio
```

---

## 📚 Key Components

### Frontend Components
* **CourseCard** - Course display with enrollment features
* **VideoPlayer** - Custom video player for course content  
* **WizardStepper** - Multi-step course creation wizard
* **AppSidebar** - Navigation sidebar with user context
* **ThemeToggle** - Dark/light mode switching

### Backend Controllers
* **courseController** - Course CRUD operations
* **userCourseProgressController** - Progress tracking
* **transactionController** - Payment processing
* **teacherController** - Teacher-specific operations

---

## 🔧 Development Tools

### Database Management
```bash
# View database in browser
npm run db:studio

# Create new migration
npm run db:migrate

# Reset database
npm run db:reset
```

### Code Quality
* ESLint configuration for consistent code style
* TypeScript for type safety
* Prettier for code formatting
* Husky for Git hooks (if configured)

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)  
5. **Open a Pull Request**

### Development Guidelines
* Follow existing code patterns and conventions
* Add TypeScript types for new features
* Test your changes thoroughly
* Update documentation as needed
* Ensure all tests pass before submitting PR

---

## 📋 Roadmap

- [ ] **Video Streaming** - Implement HLS/DASH for better video delivery
- [ ] **Mobile App** - React Native mobile application
- [ ] **Advanced Analytics** - Detailed course and user analytics
- [ ] **Discussion Forums** - Course-specific discussion boards
- [ ] **Live Sessions** - WebRTC-based live streaming
- [ ] **Certificates** - Automated course completion certificates
- [ ] **Multi-language** - Internationalization support
- [ ] **AI Features** - Content recommendations and auto-grading

---

## 🐛 Known Issues

* Video upload progress indicator needs improvement
* Course search could be more robust
* Mobile responsive design needs refinement in some areas
* Batch operations for course management needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ismail Oni**  
🚀 Full-stack Developer & LMS Architect  
📫 [LinkedIn](https://linkedin.com/in/ismail-oni) • ✉️ [ismailoni80@gmail.com](mailto:ismailoni80@gmail.com)

---

## 🌟 Show Your Support

If you find this project helpful, please consider:
* ⭐ **Starring the repository**
* 🍴 **Forking for your own projects**  
* 🐛 **Reporting bugs and issues**
* 💡 **Suggesting new features**
* 📢 **Sharing with the community**

---

## 🙏 Acknowledgments

* [Next.js](https://nextjs.org) - The React framework for production
* [Clerk](https://clerk.dev) - Authentication and user management
* [Prisma](https://prisma.io) - Next-generation database toolkit
* [shadcn/ui](https://ui.shadcn.com) - Beautifully designed components
* [Stripe](https://stripe.com) - Payment processing platform
* [Cloudinary](https://cloudinary.com) - Media management platform

---

*Built with ❤️ by OniCode — Code like lightning ⚡, refactor like a monk 🧘*

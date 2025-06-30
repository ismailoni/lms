# 🎓 LMS - Learning Management System

![WIP](https://img.shields.io/badge/status-in%20progress-yellow)

A modern, full-stack LMS built with React (frontend) and Node/Express + DynamoDB (backend). Manage courses, users, and content seamlessly!

> ⚠️ **Note**: This project is still under active development. Features and design might change. Contributions and feedback are welcome!

---

## 🏗️ Project Structure

```
/client     ← React app (frontend)
/server     ← Node.js/Express + DynamoDB (backend)
/asset-download  ← Ignored folder (media/temp files)
.gitignore
README.md
```

---

## 🚀 Features

* ✅ User authentication (JWT-based)
* 📚 Course and content management
* 📂 File uploads (assets/media)
* 📊 Admin dashboard & analytics
* 🧪 Local dev with DynamoDB Local

---

## 🧠 Tech Stack

**Frontend**

* React + Vite (or CRA)
* Tailwind CSS
* React Router

**Backend**

* Node.js + Express
* AWS SDK + DynamoDB

---

## ⚙️ Getting Started

### 1️⃣ Clone & Install

```bash
git clone https://github.com/ismailoni/lms.git
cd lms

npm install --prefix client
npm install --prefix server
```

### 2️⃣ Backend Setup (Local DynamoDB)

```bash
java -D"java.library.path=./DynamoDBLocal_lib" \
     -jar DynamoDBLocal.jar \
     -sharedDb \
     -dbPath "./asset-download" \
     -port 8000
```

Create `.env` in `server/`:

```
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMO_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
```

Start backend:

```bash
npm run dev --prefix server
```

### 3️⃣ Frontend Setup

```bash
npm run dev --prefix client
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🔗 Production Setup

* Update `.env` with AWS credentials
* Remove `DYNAMO_ENDPOINT`
* Deploy backend (AWS Lambda/Elastic Beanstalk)
* Deploy frontend (Vercel/Netlify)

---

## 📡 API Endpoints

| Method | Route                | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register new user   |
| POST   | `/api/auth/login`    | Login and get JWT   |
| GET    | `/api/courses`       | Fetch all courses   |
| POST   | `/api/courses`       | Create a new course |
| PUT    | `/api/courses/:id`   | Update course by ID |
| DELETE | `/api/courses/:id`   | Delete course by ID |

---

## 🛠️ Run Tests

```bash
npm test --prefix server
npm test --prefix client
```

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch (`feature/cool-feature`)
3. Commit changes
4. Open a pull request

---

## 👨‍💻 Author

**Ismail Oni**
🚀 Front-end ninja & aspiring full-stack wizard
📫 [LinkedIn](https://linkedin.com/in/ismail-oni) • ✉️ [ismailoni80@gmail.com](mailto:ismailoni80@gmail.com)

---

## 🌟 Show some love

If you like this project, give it a ⭐️ and share it!

---

*Built with ❤️ by OniCode — Code like lightning ⚡, refactor like a monk 🧘.*

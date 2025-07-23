import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dynamoose from 'dynamoose';
import { clerkMiddleware, createClerkClient, requireAuth } from '@clerk/express';
import http from 'http'; // Added for explicit HTTP/1.1 server

// ROUTE IMPORTS 
import courseRoutes from './routes/courseRoutes';
import userClerkRoutes from './routes/userClerkRoutes';
import transactionRoutes from './routes/transactionRoutes';
import teacherRoutes from './routes/teacherRoutes';
import userCourseProgressRoutes from './routes/userCourseProgressRoutes';
import Serverless from 'serverless-http';
import seed from './seed/seedDynamodb';

// CONFIGURATION
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  dynamoose.aws.ddb.set(new dynamoose.aws.ddb.DynamoDB({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  }));
}



if (!isProduction) {
    dynamoose.aws.ddb.local();
}

export const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY
});

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Handle OPTIONS requests (preflight)
app.options('*', cors());

// Security and middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan('common'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(clerkMiddleware());

// ROUTES
app.get('/', (req, res) => {
    res.send('🚀 LMS API up and running!');
});

app.use("/courses", courseRoutes);
app.use("/users/clerk", requireAuth(), userClerkRoutes);
app.use('/transactions', requireAuth(), transactionRoutes);
app.use('/teachers', teacherRoutes);
app.use('/', requireAuth(), userCourseProgressRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// SERVER SETUP
const port = process.env.PORT || 3000;
const server = http.createServer(app);

if (!isProduction) {
    server.listen(port, () => {
        console.log(`Server is running on HTTP/1.1 at http://localhost:${port}`);
    });
}

// For production (you might want to separate this)
if (isProduction) {
    server.listen(port, () => {
        console.log(`Production server running on port ${port}`);
    });
}

// aws project configuration
const severlessApp = Serverless(app)
export const handler = async (event: any, context: any) => {
    if (event.action === 'seed') {
        await seed();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Database seeded successfully' }),
        };
    } else {
        return severlessApp(event, context);
    }
}


export default server;
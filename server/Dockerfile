# Use the official AWS Lambda Node.js 20 base image for building
FROM public.ecr.aws/lambda/nodejs:20 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application (assumes a build script is defined in package.json)
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Start a new stage from the same Lambda Node.js 20 image for the final image
FROM public.ecr.aws/lambda/nodejs:20

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy built application code from the build stage
COPY --from=build /app/dist ${LAMBDA_TASK_ROOT}
# Copy production dependencies from the build stage
COPY --from=build /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
# Copy package.json for Lambda runtime
COPY --from=build /app/package.json ${LAMBDA_TASK_ROOT}/package.json

# Set environment variable for production
ENV NODE_ENV=production

# Specify the Lambda handler entrypoint
CMD ["index.handler"]
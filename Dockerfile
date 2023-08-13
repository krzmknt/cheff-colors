# =====================================
# Build TypeScript source
# -------------------------------------
FROM node:18.17.1-slim as builder
WORKDIR /usr/src/app

COPY package*.json .
RUN npm ci

COPY tsconfig.json .
COPY src src
RUN npm run build


# =====================================
# Create production image
# -------------------------------------
FROM node:18.17.1-slim as runner

# Install AWS Lambda Runtime Interface Client
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.5.0 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist dist

ENV PORT 3000
EXPOSE 3000/tcp

CMD [ "node", "./dist/src/index.js" ]

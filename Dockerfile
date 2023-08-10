FROM node:16

# この1行を追加するだけ！
# COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.5.0 /lambda-adapter /opt/extensions/lambda-adapter

# あとは従来どおり
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000/tcp
CMD [ "node", "index.js" ]

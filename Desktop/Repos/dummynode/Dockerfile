FROM dockertrustedregistry.ezesoft.net/sre/secrets-base-node:0.4.11
COPY ["./app", "/app"]
WORKDIR /app/
RUN npm config set registry http://bosdevartifactory.ezesoft.net:8081/artifactory/api/npm/npm-eze
RUN npm install
ENTRYPOINT ["node", "app"]
FROM ubuntu:16.04

RUN apt-get -qq update
RUN apt-get -y install git curl unzip jq nodejs npm

#Install Docker CLI (for linting)
RUN curl "https://s3.amazonaws.com/ezesoft-docker/docker-full-linux-64.tgz" -o "/tmp/docker.tgz" && tar -xvzf /tmp/docker.tgz -C /tmp docker/docker && mv /tmp/docker/docker /usr/local/bin/docker

RUN update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10
RUN npm config set registry https://bosdevartifactory.ezesoft.net/artifactory/api/npm/npm-eze
RUN curl -L "https://github.com/docker/compose/releases/download/1.9.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
RUN chmod +x /usr/local/bin/docker-compose
RUN chmod -R a+rwx /root



FROM cassandra:3.11

COPY bashrc /root/.bashrc

WORKDIR /somedir

RUN apt-get update && apt-get install something &&\
	./deploy.sh

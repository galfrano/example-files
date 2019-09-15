#!/bin/bash
docker kill $(docker ps -q)
docker system prune --force
project='project-x'
workdir="/var/docker/${project}/"

docker volume create --driver local --opt o=bind --opt device=$workdir/ volumeName
cd $workdir
docker build -t $project .
docker run\
 -dit\
 -e SOME_ENV_VAR='SOME_VAR'\
 -p 6553:6553\
 -v $workdir:/home/$project\
 --name $project\
 --link otherDockerInstance:otherName\
 $project

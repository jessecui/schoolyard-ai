#!/bin/bash

echo What should the version be?
read VERSION

docker buildx build --platform linux/amd64 -t jessecui/schoolyard:$VERSION --push .
ssh root@159.223.99.228 "docker pull jessecui/schoolyard:$VERSION && docker tag jessecui/schoolyard:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
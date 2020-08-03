FROM alpine:latest

#Create Bot Directory
WORKDIR /usr/src/chirp-bot-v2
COPY package.json settings.json ./

#Installation
RUN apk add --update \
	&& apk add --no-cache nodejs-current nodejs-npm \
	&& apk add --no-cache --virtual .build git curl build-base g++ \
	&& npm install \
	&& apk del .build 

#Copy Project to WORKDIR
ADD . /usr/src/chirp-bot-v2/

#Compile TS to JS
RUN npm run tsc

#Start me!
CMD ["npm", "start"]